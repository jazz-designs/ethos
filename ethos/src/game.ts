import { AppState, LevelUpEvent, LogEntry, MoodType, StatData, StatName } from './types';

export const STAT_NAMES: readonly StatName[] = [
  'health',
  'intelligence',
  'mental_health',
  'strength',
] as const;

/**
 * XP needed to advance from level L to L+1.
 * Formula: round(100 * 1.15^(L-1))
 * L1->2: 100, L2->3: 115, L3->4: 132, etc.
 */
export function xpNeeded(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  return Math.round(100 * Math.pow(1.15, safeLevel - 1));
}

/**
 * Apply a score (-10 to +10) to a single stat's XP and level.
 *
 * Rules:
 *  - XP change = score * 10
 *  - XP can never drop below 0 (floors at current level's 0)
 *  - Levels never decrease
 *  - Handles single or multi level-ups
 */
export function applyXp(
  statName: StatName,
  currentLevel: number,
  currentXp: number,
  score: number
): { level: number; xp: number; xpChange: number; levelUps: LevelUpEvent[] } {
  const xpChange = Math.round(score) * 10;
  const levelUps: LevelUpEvent[] = [];

  let level = Math.max(1, currentLevel);
  let xp = Math.max(0, currentXp + xpChange);

  while (xp >= xpNeeded(level)) {
    xp -= xpNeeded(level);
    level += 1;
    levelUps.push({ stat: statName, newLevel: level });
  }

  return { level, xp, xpChange, levelUps };
}

/**
 * Character overall level = floor(average of the 4 stat levels).
 */
export function characterLevel(stats: Record<StatName, StatData>): number {
  const sum = STAT_NAMES.reduce((acc, name) => acc + (stats[name]?.level || 1), 0);
  return Math.max(1, Math.floor(sum / 4));
}

/**
 * Fresh default state for Day 1.
 */
export function defaultState(): AppState {
  const stats: Record<StatName, StatData> = {
    health: { level: 1, xp: 0 },
    intelligence: { level: 1, xp: 0 },
    mental_health: { level: 1, xp: 0 },
    strength: { level: 1, xp: 0 },
  };

  const xpNeededMap: Record<StatName, number> = {
    health: xpNeeded(1),
    intelligence: xpNeeded(1),
    mental_health: xpNeeded(1),
    strength: xpNeeded(1),
  };

  return {
    currentDay: 1,
    stats,
    logs: [],
    moods: {},
    xpNeeded: xpNeededMap,
    characterLevel: 1,
    currentMood: null,
  };
}

/**
 * Augment raw or loaded state with calculated/derived fields.
 */
export function deriveState(raw: Partial<AppState>): AppState {
  const currentDay = Math.max(1, typeof raw.currentDay === 'number' ? raw.currentDay : 1);
  const rawStats = (raw.stats || {}) as Partial<Record<StatName, StatData>>;

  const stats: Record<StatName, StatData> = {
    health: {
      level: Math.max(1, rawStats.health?.level ?? 1),
      xp: Math.max(0, rawStats.health?.xp ?? 0),
    },
    intelligence: {
      level: Math.max(1, rawStats.intelligence?.level ?? 1),
      xp: Math.max(0, rawStats.intelligence?.xp ?? 0),
    },
    mental_health: {
      level: Math.max(1, rawStats.mental_health?.level ?? 1),
      xp: Math.max(0, rawStats.mental_health?.xp ?? 0),
    },
    strength: {
      level: Math.max(1, rawStats.strength?.level ?? 1),
      xp: Math.max(0, rawStats.strength?.xp ?? 0),
    },
  };

  const xpNeededMap: Record<StatName, number> = {
    health: xpNeeded(stats.health.level),
    intelligence: xpNeeded(stats.intelligence.level),
    mental_health: xpNeeded(stats.mental_health.level),
    strength: xpNeeded(stats.strength.level),
  };

  const logs: LogEntry[] = Array.isArray(raw.logs) ? raw.logs : [];
  const moods = raw.moods || {};

  const currentMood =
    (moods[currentDay] as MoodType) ||
    (logs.find((l) => l.day === currentDay)?.mood as MoodType) ||
    raw.currentMood ||
    null;

  return {
    currentDay,
    stats,
    logs,
    moods,
    xpNeeded: xpNeededMap,
    characterLevel: characterLevel(stats),
    currentMood,
  };
}
