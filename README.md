# Ethos — Personal RPG Day Evaluator

A gamified self-tracker app built with **Expo (React Native)** and **Node.js + Express + Gemini 3.8 Flash**.

The UI is inspired by modern gamified edtech interfaces: warm cream backdrop (`#F6F4ED`), high corner radii (24px–32px), transparent character illustrations, and an animated floating bottom dock.

---

## 🏛️ The 4 Core Stat Pillars

| Pillar | SVG Asset | Meaning |
|---|---|---|
| **Health** | `assets/images/health.svg` | Sleep, diet, nutrition, physical vitality & recovery |
| **Intelligence** | `assets/images/intelligence.svg` | Learning, studying, reading, coding & problem-solving |
| **Mental Health** | `assets/images/mental-health.svg` | Emotional balance, mindfulness, meditation, calm & peace |
| **Strength** | `assets/images/strength.svg` | Workouts, physical training, athletic effort & endurance |

Character level is calculated as `floor(average of the 4 stat levels)`.

---

## 🎭 5 Daily Moods

| Mood | SVG Asset |
|---|---|
| **Worst** | `assets/images/worst.svg` |
| **Bad** | `assets/images/bad.svg` |
| **Neutral** | `assets/images/neutral.svg` |
| **Good** | `assets/images/good.svg` |
| **Excellent** | `assets/images/excellent.svg` |

Moods pop up seamlessly directly from the daily input box when typing, saved independently per day without counting against AI evaluation.

---

## 🧙 Character Archetypes

- **Mage** (`assets/images/mage.svg`)
- **Monk** (`assets/images/monk.svg`)
- **Ranger** (`assets/images/ranger.svg`)
- **Warrior** (`assets/images/warrior.svg`)

Single-word names with a large transparent character portrait showcased on the home screen.

---

## 🚀 Running the Project

### 1. Backend (`/backend`)

```bash
cd backend
npm install
npm start
```

Runs on `http://localhost:3000` (or `PORT` environment variable).

Endpoints:
- `GET /api/state` — Full state + derived XP needed + character level + current mood.
- `POST /api/mood` — `{ mood: "good" }` to set/update mood for current day.
- `POST /api/log` — `{ text: "...", mood: "good" }` evaluates the day with Gemini.
- `POST /api/next-day` — Advances `currentDay += 1`.
- `POST /api/reset` — Resets state to default.

Unit tests:
```bash
npm test
```

### 2. Frontend (`/ethos`)

```bash
cd ethos
npx expo start
```

Press **w** for Web, or scan the QR code using **Expo Go** on Android/iOS.
