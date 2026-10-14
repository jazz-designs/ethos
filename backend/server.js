'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { STAT_NAMES } = require('./game');

// ── Express setup ───────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ── OpenRouter setup ────────────────────────────────────────────────────
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';

if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY is not set. Create a .env file (see .env.example).');
  process.exit(1);
}

// ── Rate Limiting ───────────────────────────────────────────────────────
// Per-IP rate limiter: max 10 requests per 10 minutes per IP (configurable)
const ipRateLimiter = rateLimit({
  windowMs: parseInt(process.env.IP_RATE_LIMIT_WINDOW_MS, 10) || 10 * 60 * 1000,
  max: parseInt(process.env.IP_RATE_LIMIT_MAX, 10) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded: Too many evaluation requests from your IP. Please wait a few minutes before trying again.',
    });
  },
});

// Global rate limiter: max 20 requests per minute globally (configurable)
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000,
  max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX, 10) || 20,
  keyGenerator: () => '__global_evaluator__',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Global rate limit reached: AI evaluation service is currently handling high volume. Please wait a moment and try again.',
    });
  },
});

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
  'Respond ONLY with a valid JSON object matching this schema: {"scores": {"health": 0, "intelligence": 0, "mental_health": 0, "strength": 0}}. Do not include any explanations, thoughts, or markdown formatting.';

// ── OpenRouter Evaluation ───────────────────────────────────────────────
async function evaluateDay(text) {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ethos.local',
          'X-Title': 'Ethos RPG Tracker',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenRouter HTTP ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string') {
        throw new Error('Empty response received from evaluation model.');
      }

      // Robust JSON extraction
      let jsonStr = content.trim();
      const match = jsonStr.match(/\{[\s\S]*"scores"[\s\S]*\}/) || jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        jsonStr = match[0];
      }

      const parsed = JSON.parse(jsonStr);
      const rawScores = parsed.scores || parsed;

      const scores = {};
      for (const stat of STAT_NAMES) {
        let val = parseInt(rawScores[stat], 10);
        if (isNaN(val)) val = 0;
        scores[stat] = Math.max(-10, Math.min(10, val));
      }

      return { scores };
    } catch (err) {
      console.error(`AI attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(`Evaluation failed after ${MAX_ATTEMPTS} attempts: ${err.message}`);
      }
      // Wait before retry
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// ── Endpoints ───────────────────────────────────────────────────────────

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ethos-evaluator',
    model: OPENROUTER_MODEL,
  });
});

// Stateless evaluation handler
const handleEvaluation = async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for evaluation.' });
  }

  try {
    const evaluation = await evaluateDay(text.trim());
    res.json({ scores: evaluation.scores });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};

// POST /api/evaluate — main stateless scoring route
app.post('/api/evaluate', ipRateLimiter, globalRateLimiter, handleEvaluation);

// POST /api/log — backward compatible route returning scores
app.post('/api/log', ipRateLimiter, globalRateLimiter, handleEvaluation);

// GET /api/state — notification that state is local on client
app.get('/api/state', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'User data and state are stored locally on device storage.',
  });
});

// ── Start ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Ethos evaluator running on http://localhost:${PORT} with model ${OPENROUTER_MODEL}`);
});
