'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');
const { STAT_NAMES, applyXp, deriveState, defaultState } = require('./game');

// ── Express setup ───────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ── Gemini setup ────────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set. Create a .env file (see .env.example).');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT =
  'You evaluate a person\'s day for an RPG-style self-tracker. Given their description, give each stat an integer score from -10 to +10.\n' +
  'Scale: 0 = nothing relevant mentioned or neutral. +1 to +3 = a normal, decent day for that stat. +4 to +6 = a strong day. +7 to +10 = exceptional, rare. ' +
  'Negative = actively harmful behavior for that stat (junk food binge, no sleep, wasting the whole day, social isolation, etc). ' +
  'Be strict and realistic, avoid score inflation. Don\'t give points for things that aren\'t mentioned.\n' +
  'Stat meanings: ' +
  'health = sleep, diet, nutrition, physical vitality, hydration, illness recovery; ' +
  'intelligence = learning, studying, reading, coding, deep problem-solving, cognitive challenges; ' +
  'mental_health = emotional balance, mindfulness, meditation, calm, stress relief, mental peace, mood regulation; ' +
  'strength = workouts, physical training, fitness, athletic endurance, heavy lifting.\n' +
  'Also write a one-sentence summary of the day.';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        health:        { type: Type.INTEGER },
        intelligence:  { type: Type.INTEGER },
        mental_health: { type: Type.INTEGER },
        strength:      { type: Type.INTEGER },
      },
      required: STAT_NAMES,
    },
    summary: { type: Type.STRING },
  },
  required: ['scores', 'summary'],
};

// ── Data persistence ────────────────────────────────────────────────────
function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (!state.stats) state.stats = {};
      if (!state.moods) state.moods = {};

      // Migrate previous stat names
      if (!state.stats.intelligence) state.stats.intelligence = state.stats.wisdom || { level: 1, xp: 0 };
      if (!state.stats.mental_health) state.stats.mental_health = state.stats.mind || { level: 1, xp: 0 };

      // Ensure all 4 stats exist
      for (const name of STAT_NAMES) {
        if (!state.stats[name]) state.stats[name] = { level: 1, xp: 0 };
      }

      // Cleanup obsolete keys
      delete state.stats.wisdom;
      delete state.stats.mind;
      delete state.stats.stamina;
      delete state.stats.charisma;

      return state;
    }
  } catch (err) {
    console.error('Corrupt data.json — resetting to default:', err.message);
  }
  const state = defaultState();
  state.moods = {};
  saveState(state);
  return state;
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// ── Gemini integration ──────────────────────────────────────────────────
async function evaluateDay(text) {
  const MAX_ATTEMPTS = 2;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        contents: text,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const parsed = JSON.parse(response.text);

      // Validate structure
      if (!parsed.scores || typeof parsed.scores !== 'object') {
        throw new Error('Missing scores object in Gemini response');
      }
      if (typeof parsed.summary !== 'string') {
        throw new Error('Missing summary in Gemini response');
      }

      // Validate, coerce, and clamp each stat
      const scores = {};
      for (const stat of STAT_NAMES) {
        if (parsed.scores[stat] === undefined) {
          throw new Error(`Missing stat "${stat}" in Gemini response`);
        }
        let val = parseInt(parsed.scores[stat], 10);
        if (isNaN(val)) throw new Error(`Non-numeric score for "${stat}"`);
        scores[stat] = Math.max(-10, Math.min(10, val));
      }

      return { scores, summary: parsed.summary };
    } catch (err) {
      console.error(`Gemini attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(`Gemini evaluation failed after ${MAX_ATTEMPTS} attempts: ${err.message}`);
      }
    }
  }
}

// ── Endpoints ───────────────────────────────────────────────────────────

// GET /api/state — full state + derived values
app.get('/api/state', (_req, res) => {
  res.json(deriveState(loadState()));
});

// POST /api/mood — record or update mood for current day
app.post('/api/mood', (req, res) => {
  const { mood } = req.body;
  if (!mood) {
    return res.status(400).json({ error: 'Mood is required.' });
  }
  const state = loadState();
  state.moods = state.moods || {};
  state.moods[state.currentDay] = mood;

  // Also update today's log if already created
  const todayLog = state.logs?.find(l => l.day === state.currentDay);
  if (todayLog) {
    todayLog.mood = mood;
  }

  saveState(state);
  res.json(deriveState(state));
});

// POST /api/log — evaluate the day
app.post('/api/log', async (req, res) => {
  const { text, mood } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  const state = loadState();

  // Only one log per day
  if (state.logs.some(l => l.day === state.currentDay)) {
    return res.status(409).json({ error: 'Current day is already logged.' });
  }

  let evaluation;
  try {
    evaluation = await evaluateDay(text.trim());
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }

  // Apply XP changes & collect level-ups
  const xpChanges = {};
  const allLevelUps = [];

  for (const stat of STAT_NAMES) {
    const cur = state.stats[stat];
    const result = applyXp(stat, cur.level, cur.xp, evaluation.scores[stat]);
    state.stats[stat].level = result.level;
    state.stats[stat].xp   = result.xp;
    xpChanges[stat] = result.xpChange;
    allLevelUps.push(...result.levelUps);
  }

  const dayMood = mood || state.moods?.[state.currentDay] || null;
  state.moods = state.moods || {};
  if (dayMood) {
    state.moods[state.currentDay] = dayMood;
  }

  const logEntry = {
    day:       state.currentDay,
    text:      text.trim(),
    mood:      dayMood,
    scores:    evaluation.scores,
    xpChanges,
    levelUps:  allLevelUps,
    summary:   evaluation.summary,
    createdAt: new Date().toISOString(),
  };

  state.logs.push(logEntry);
  saveState(state);

  res.json({ log: logEntry, state: deriveState(state) });
});

// POST /api/next-day — advance to next day
app.post('/api/next-day', (_req, res) => {
  const state = loadState();

  if (!state.logs.some(l => l.day === state.currentDay)) {
    return res.status(400).json({ error: 'Current day has not been logged yet.' });
  }

  state.currentDay += 1;
  saveState(state);

  res.json(deriveState(state));
});

// POST /api/reset — wipe everything back to defaults
app.post('/api/reset', (_req, res) => {
  const state = defaultState();
  state.moods = {};
  saveState(state);
  res.json(deriveState(state));
});

// ── Start ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Ethos backend running on http://localhost:${PORT}`);
});
