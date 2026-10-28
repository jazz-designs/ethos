'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
const { STAT_NAMES } = require('./game');

// ── Express setup ───────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;

// ── Vercel AI Gateway Setup ─────────────────────────────────────────────
const AI_GATEWAY_API_KEY =
  process.env.AI_GATEWAY_API_KEY || process.env.OPENROUTER_API_KEY;
const AI_GATEWAY_MODEL =
  process.env.AI_GATEWAY_MODEL || 'deepseek/deepseek-v4.1-flash-1017';
const AI_GATEWAY_BASE_URL = (
  process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1'
).replace(/\/+$/, '');

const IMAGE_MODEL = process.env.IMAGE_MODEL || 'bfl/flux-2-klein-4b';
const IMAGE_MODEL_FALLBACK = process.env.IMAGE_MODEL_FALLBACK || 'bfl/flux-3-image-klein';

if (!AI_GATEWAY_API_KEY) {
  console.error('AI_GATEWAY_API_KEY is not set. Create a .env file (see .env.example).');
  process.exit(1);
}

// ── Character Visual Profiles ───────────────────────────────────────────
const CHARACTER_PROFILES = {
  ch_1: {
    file: 'ch-1.png',
    appearance: 'A stylish anime boy with messy wavy white hair wearing round black glasses, over-ear black headphones, an oversized cozy cream turtleneck sweater, loose sage-green baggy cargo pants with utility straps, and white chunky sneakers, full body standing pose, clean solid white background',
  },
  ch_2: {
    file: 'ch-2.png',
    appearance: 'A fashionable anime girl with long wavy pastel pink hair tied with black ribbons, black crop top with off-shoulder white jacket, baggy black cargo pants with straps and chains, white platform sneakers, and black shoulder bag, clean solid white background',
  },
  ch_3: {
    file: 'ch-3.png',
    appearance: 'A cute anime girl with long wavy brown hair, round glasses, headphones, an oversized cream knit sweater, dark grey baggy cargo pants with hanging straps, white sneakers, and backpack, clean solid white background',
  },
  ch_4: {
    file: 'ch-4.png',
    appearance: 'A cool anime boy with messy dark curly hair, silver necklace, oversized black windbreaker jacket with star graphic print, baggy black cargo pants with silver chain, and sneakers, clean solid white background',
  },
};
// Aliases for backward compatibility
CHARACTER_PROFILES.boy_1 = CHARACTER_PROFILES.ch_1;
CHARACTER_PROFILES.boy_2 = CHARACTER_PROFILES.ch_4;
CHARACTER_PROFILES.girl_1 = CHARACTER_PROFILES.ch_2;
CHARACTER_PROFILES.girl_2 = CHARACTER_PROFILES.ch_3;

// ── Rate Limiting ───────────────────────────────────────────────────────
const ipRateLimiter = rateLimit({
  windowMs: parseInt(process.env.IP_RATE_LIMIT_WINDOW_MS, 10) || 10 * 60 * 1000,
  max: parseInt(process.env.IP_RATE_LIMIT_MAX, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded: Too many evaluation requests from your IP. Please wait a few minutes before trying again.',
    });
  },
});

const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000,
  max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX, 10) || 40,
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
  "You evaluate a person's day for an RPG-style self-tracker. Given their description, give each stat an integer score from -10 to +10.\n" +
  "Scale: 0 = nothing relevant mentioned or neutral. +1 to +3 = a normal, decent day for that stat. +4 to +6 = a strong day. +7 to +10 = exceptional, rare. " +
  "Negative = actively harmful behavior for that stat (junk food binge, no sleep, wasting the whole day, social isolation, etc). " +
  "Be strict and realistic, avoid score inflation. Don't give points for things that aren't mentioned.\n" +
  "Stat meanings: " +
  "health = sleep, diet, nutrition, physical vitality, hydration, illness recovery; " +
  "intelligence = learning, studying, reading, coding, deep problem-solving, cognitive challenges; " +
  "mental_health = emotional balance, mindfulness, meditation, calm, stress relief, mental peace, mood regulation; " +
  "physique = workouts, physical training, gym, exercise, athletic endurance, heavy lifting, bodily fitness.\n" +
  "For 'summary', provide ONLY a concise 2-word phrase or short label in the exact format: 'Mood • Activity' (e.g. 'Board • Worked out', 'Fun • Danced', 'Tired • Studied', 'Lazy • Watched movie', 'Happy • Won first'). DO NOT write full sentences or paragraphs.\n" +
  'Also extract a short key action scene for image generation (e.g. "character lifting dumbbells at the gym", "character relaxing on a couch watching TV", "character proudly holding a first place trophy on a winner podium", "character studying thick books under a desk lamp").\n' +
  'Respond ONLY with a valid JSON object matching this schema: {"scores": {"health": 0, "intelligence": 0, "mental_health": 0, "physique": 0}, "summary": "Mood • Activity", "activityScene": "Key action scene"}. Do not include any explanations, thoughts, or markdown formatting.';

// ── Vercel AI Gateway Evaluation (DeepSeek) ──────────────────────────────
async function evaluateDay(text) {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_GATEWAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_GATEWAY_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`AI Gateway HTTP ${response.status}: ${errBody}`);
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
        if (stat === 'physique' && isNaN(val)) {
          val = parseInt(rawScores.strength, 10);
        }
        if (isNaN(val)) val = 0;
        scores[stat] = Math.max(-10, Math.min(10, val));
      }

      let summary =
        typeof parsed.summary === 'string'
          ? parsed.summary.trim()
          : 'Checked in • Logged';
      if (summary.includes('\n')) {
        summary = summary.split('\n')[0].trim();
      }
      if (summary.length > 30 && !summary.includes('•')) {
        const words = summary.replace(/[.,!?;]/g, '').split(/\s+/).slice(0, 3);
        summary = words.join(' ');
      }

      const activityScene =
        typeof parsed.activityScene === 'string' && parsed.activityScene.trim()
          ? parsed.activityScene.trim()
          : 'character relaxing peacefully';

      return { scores, summary, activityScene };
    } catch (err) {
      console.error(`AI attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(`Evaluation failed after ${MAX_ATTEMPTS} attempts: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// ── Image Generation (Image-to-Image with Reference Image Input) ─────────
async function generateCharacterImage(activityScene, characterKey) {
  const charKey = CHARACTER_PROFILES[characterKey] ? characterKey : 'ch_1';
  const profile = CHARACTER_PROFILES[charKey];

  // Read reference image file buffer
  let refBuffer = null;
  const refFileName = profile.file;
  try {
    const candidatePath = path.resolve(__dirname, '..', 'ethos', 'assets', 'images', profile.file);
    if (fs.existsSync(candidatePath)) {
      refBuffer = fs.readFileSync(candidatePath);
      console.log(`[ImageGen] Loaded reference image: ${profile.file} (${refBuffer.length} bytes)`);
    }
  } catch (err) {
    console.warn('Could not read character reference file:', err.message);
  }

  // Compose prompt explicitly directing the model to preserve character traits
  const editPrompt =
    `Keep the exact same cute character from the reference image with ${profile.appearance}. ` +
    `The character is ${activityScene}. ` +
    'Preserve the exact same clean modern 2D anime illustration art style with delicate soft line art, no black outline border around the character, no thick contour lines, no sticker outline border, flat colors, cute stylized character, ' +
    'minimal composition with only 2 or 3 elements, clean solid pure white background matching the character aesthetic, no extra people, no complex background.';

  const fullPrompt =
    `${profile.appearance}. The character is ${activityScene}. ` +
    'Modern 2D anime illustration art style with delicate soft line art, no black outline border around the character, no thick contour lines, no sticker outline border, flat colors, cute stylized character, ' +
    'minimal composition with only 2 or 3 elements, clean solid pure white background, uncluttered, charming simple illustration, no extra people, no complex background.';

  console.log(`[ImageGen] Generating for [${charKey}] scene: "${activityScene}"`);

  // Models to try in order: low-cost Klein models only (budget tier)
  const modelsToTry = [
    IMAGE_MODEL,
    IMAGE_MODEL_FALLBACK,
    'bfl/flux-2-klein-4b',
  ];

  // 1. Try Image-to-Image (/images/edits) with the reference image file
  if (refBuffer) {
    for (const model of modelsToTry) {
      try {
        console.log(`[ImageGen] Sending reference image to /images/edits (model: ${model})...`);
        const form = new FormData();
        form.append('model', model);
        form.append('prompt', editPrompt);
        form.append('image', new Blob([refBuffer], { type: 'image/jpeg' }), refFileName);

        const res = await fetch(`${AI_GATEWAY_BASE_URL}/images/edits`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
          },
          body: form,
        });

        if (res.ok) {
          const data = await res.json();
          const imageItem = data.data?.[0];
          if (imageItem?.b64_json) {
            console.log(`[ImageGen] Success with model ${model} via /images/edits (base64 image generated)`);
            return `data:image/jpeg;base64,${imageItem.b64_json}`;
          } else if (imageItem?.url) {
            console.log(`[ImageGen] Success with model ${model} via /images/edits (URL generated)`);
            return imageItem.url;
          }
        } else {
          const errText = await res.text();
          console.warn(`[ImageGen] Model ${model} /images/edits returned HTTP ${res.status}: ${errText.slice(0, 180)}`);
        }
      } catch (err) {
        console.warn(`[ImageGen] /images/edits attempt with ${model} failed:`, err.message);
      }
    }
  }

  // 2. Fallback to Text-to-Image (/images/generations) if image edit failed
  console.log('[ImageGen] Falling back to text-to-image /images/generations...');
  for (const model of modelsToTry) {
    try {
      const res = await fetch(`${AI_GATEWAY_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: fullPrompt,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[ImageGen] Model ${model} /images/generations returned HTTP ${res.status}: ${errText.slice(0, 180)}`);
        continue;
      }

      const data = await res.json();
      const imageItem = data.data?.[0];
      if (imageItem?.b64_json) {
        return `data:image/jpeg;base64,${imageItem.b64_json}`;
      } else if (imageItem?.url) {
        return imageItem.url;
      }
    } catch (err) {
      console.warn(`[ImageGen] /images/generations error with ${model}:`, err.message);
    }
  }

  return null;
}

// ── Endpoints ───────────────────────────────────────────────────────────

// Ping / Wakeup endpoint
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ethos-evaluator',
    provider: 'vercel-ai-gateway',
    evaluatorModel: AI_GATEWAY_MODEL,
    imageModel: IMAGE_MODEL,
    imageModelFallback: IMAGE_MODEL_FALLBACK,
  });
});

// Stateless evaluation handler
const handleEvaluation = async (req, res) => {
  const { text, character } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for evaluation.' });
  }

  try {
    // 1. Evaluate day chronicle
    const evaluation = await evaluateDay(text.trim());

    // 2. Generate activity illustration matching character
    let imageUrl = null;
    try {
      imageUrl = await generateCharacterImage(evaluation.activityScene, character || 'ch_1');
    } catch (imgErr) {
      console.error('Image generation error:', imgErr);
    }

    res.json({
      scores: evaluation.scores,
      summary: evaluation.summary,
      activityScene: evaluation.activityScene,
      imageUrl,
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};

// Main evaluation routes
app.post('/api/evaluate', ipRateLimiter, globalRateLimiter, handleEvaluation);
app.post('/api/log', ipRateLimiter, globalRateLimiter, handleEvaluation);

// GET /api/state
app.get('/api/state', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'User data and state are stored locally on device storage.',
  });
});

// ── Start ───────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Ethos evaluator running on http://0.0.0.0:${PORT} (LAN accessible) with model ${AI_GATEWAY_MODEL} and image model ${IMAGE_MODEL}`
  );
});
