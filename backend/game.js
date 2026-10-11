'use strict';

const STAT_NAMES = ['health', 'intelligence', 'mental_health', 'strength'];

/**
 * XP needed to go from level L to L+1.
 * Formula: round(100 * 1.15^(L-1))
 * L1->2: 100,  L2->3: 115,  L3->4: 132, ...
 */
function xpNeeded(level) {
  return Math.round(100 * Math.pow(1.15, level - 1));
}

/**
 * Apply a score to a single stat's XP/level.
 *
 * @param {string} statName  – e.g. 'health'
 * @param {number} currentLevel
 * @param {number} currentXp
 * @param {number} score     – integer in [-10, 10]
 * @returns {{ level, xp, xpChange, levelUps: {stat, newLevel}[] }}
 *
 * Rules:
 *  - XP gained = score * 10
 *  - Multiple level-ups are handled in a single call
 *  - XP can never drop below 0
 *  - Levels never decrease
 */
function applyXp(statName, currentLevel, currentXp, score) {
  const xpChange = score * 10;
  const levelUps = [];

  let level = currentLevel;
  let xp = currentXp + xpChange;

  // Floor at 0 — a bad day only wipes progress in the current level
  if (xp < 0) xp = 0;

  // Handle level-ups (possibly more than one)
  while (xp >= xpNeeded(level)) {
    xp -= xpNeeded(level);
    level++;
    levelUps.push({ stat: statName, newLevel: level });
  }

  return { level, xp, xpChange, levelUps };
}

/**
 * Character level = floor(average of the 4 stat levels).
 */
function characterLevel(stats) {
  const sum = STAT_NAMES.reduce((acc, name) => acc + (stats[name]?.level || 1), 0);
  return Math.floor(sum / 4);
}

/**
 * Fresh default state.
 */
function defaultState() {
  const stats = {};
  for (const name of STAT_NAMES) {
    stats[name] = { level: 1, xp: 0 };
  }
  return { currentDay: 1, stats, logs: [] };
}

/**
 * Augment raw state with derived values the client needs.
 */
function deriveState(state) {
  const xpNeededPerStat = {};
  const stats = state?.stats || {};
  for (const name of STAT_NAMES) {
    xpNeededPerStat[name] = xpNeeded(stats[name]?.level || 1);
  }
  return {
    ...state,
    xpNeeded: xpNeededPerStat,
    characterLevel: characterLevel(stats),
    currentMood: state.moods?.[state.currentDay] || state.logs?.find(l => l.day === state.currentDay)?.mood || null,
  };
}

module.exports = { STAT_NAMES, xpNeeded, applyXp, characterLevel, defaultState, deriveState };
