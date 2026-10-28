import {
  AppState,
  CharacterType,
  LevelUpEvent,
  LogEntry,
  MoodType,
  StatData,
  StatName,
  TaskItem,
} from './types';
import { ACTIVITY_IMAGES } from './assets';

export const STAT_NAMES: readonly StatName[] = [
  'health',
  'intelligence',
  'mental_health',
  'physique',
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
 * Add or subtract XP to/from a stat, adjusting level and XP properly.
 * XP cannot drop below 0 at level 1. Levels never drop below 1.
 */
export function adjustStatXp(
  currentLevel: number,
  currentXp: number,
  deltaXp: number
): { level: number; xp: number; leveledUp: boolean } {
  let level = Math.max(1, currentLevel);
  let xp = currentXp + deltaXp;
  let leveledUp = false;

  if (deltaXp >= 0) {
    while (xp >= xpNeeded(level)) {
      xp -= xpNeeded(level);
      level += 1;
      leveledUp = true;
    }
  } else {
    while (xp < 0 && level > 1) {
      level -= 1;
      xp += xpNeeded(level);
    }
    if (xp < 0) {
      xp = 0;
    }
  }

  return { level, xp, leveledUp };
}

/**
 * Normalizes stat rewards for a task item.
 * Supports legacy single statReward or multiple statRewards (max 3 XP per stat).
 */
export function getTaskStatRewards(task: TaskItem): Partial<Record<StatName, number>> {
  if (task.statRewards && Object.keys(task.statRewards).length > 0) {
    return task.statRewards;
  }
  if (task.statReward) {
    return { [task.statReward]: 2 };
  }
  return {};
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
/**
 * 2 weeks worth of rich journal entries and stats for testing and visual polish.
 * Uses the user's workout, dance, couch, and first images.
 */
export function createTwoWeekDemoState(): AppState {
  const stats: Record<StatName, StatData> = {
    physique: { level: 2, xp: 56 }, // ~49% of 115
    intelligence: { level: 2, xp: 44 }, // ~38% of 115
    health: { level: 1, xp: 80 }, // 80% of 100
    mental_health: { level: 1, xp: 38 }, // 38% of 100
  };

  const xpNeededMap: Record<StatName, number> = {
    physique: xpNeeded(2),
    intelligence: xpNeeded(2),
    health: xpNeeded(1),
    mental_health: xpNeeded(1),
  };

  const now = new Date();
  const getPastIso = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  const logs: LogEntry[] = [
    {
      day: 14,
      text: "Heavy bench press session at the gym. Crushed a new personal record of 100kg!",
      mood: 'good',
      scores: { physique: 5, health: 2, mental_health: -1, intelligence: 1 },
      xpChanges: { physique: 50, health: 20, mental_health: -10, intelligence: 10 },
      levelUps: [],
      summary: "Board • Worked out",
      activityScene: "character lifting a heavy barbell at the gym",
      imageUrl: ACTIVITY_IMAGES.workout,
      createdAt: getPastIso(0),
    },
    {
      day: 13,
      text: "Practiced street dance choreo with headphones in the living room for two hours.",
      mood: 'excellent',
      scores: { physique: 4, health: 3, mental_health: 4, intelligence: 1 },
      xpChanges: { physique: 40, health: 30, mental_health: 40, intelligence: 10 },
      levelUps: [],
      summary: "Fun • Danced",
      activityScene: "character dancing with headphones",
      imageUrl: ACTIVITY_IMAGES.dance,
      createdAt: getPastIso(1),
    },
    {
      day: 12,
      text: "Felt super tired and exhausted. Spent the entire evening on the couch watching movies.",
      mood: 'neutral',
      scores: { physique: -1, health: -1, mental_health: 2, intelligence: 0 },
      xpChanges: { physique: -10, health: -10, mental_health: 20, intelligence: 0 },
      levelUps: [],
      summary: "Board • Watched TV",
      activityScene: "character relaxing on couch",
      imageUrl: ACTIVITY_IMAGES.couch,
      createdAt: getPastIso(2),
    },
    {
      day: 11,
      text: "Won 1st place in the hackathon finals! Received the golden championship trophy!",
      mood: 'excellent',
      scores: { physique: 0, health: 1, mental_health: 5, intelligence: 5 },
      xpChanges: { physique: 0, health: 10, mental_health: 50, intelligence: 50 },
      levelUps: [{ stat: 'intelligence', newLevel: 2 }],
      summary: "Coding • First",
      activityScene: "character holding first place trophy",
      imageUrl: ACTIVITY_IMAGES.first,
      createdAt: getPastIso(3),
    },
    {
      day: 10,
      text: "Intense full body workout followed by clean nutrition meal prep.",
      mood: 'good',
      scores: { physique: 4, health: 4, mental_health: 3, intelligence: 0 },
      xpChanges: { physique: 40, health: 40, mental_health: 30, intelligence: 0 },
      levelUps: [{ stat: 'physique', newLevel: 2 }],
      summary: "Gym • Workout",
      activityScene: "character working out",
      imageUrl: ACTIVITY_IMAGES.workout,
      createdAt: getPastIso(4),
    },
    {
      day: 9,
      text: "Freestyle dance session with studio friends. High energy throughout the night.",
      mood: 'excellent',
      scores: { physique: 3, health: 3, mental_health: 4, intelligence: 1 },
      xpChanges: { physique: 30, health: 30, mental_health: 40, intelligence: 10 },
      levelUps: [],
      summary: "Rhythm • Danced",
      activityScene: "character dancing",
      imageUrl: ACTIVITY_IMAGES.dance,
      createdAt: getPastIso(5),
    },
    {
      day: 8,
      text: "Rest day on the couch reading books and listening to low-fi beats.",
      mood: 'bad',
      scores: { physique: 0, health: 0, mental_health: 1, intelligence: 2 },
      xpChanges: { physique: 0, health: 0, mental_health: 10, intelligence: 20 },
      levelUps: [],
      summary: "Rest • Couch",
      activityScene: "character relaxing on couch",
      imageUrl: ACTIVITY_IMAGES.couch,
      createdAt: getPastIso(6),
    },
    {
      day: 7,
      text: "Solved complex algorithm problems and ranked first on the leaderboard contest.",
      mood: 'excellent',
      scores: { physique: 0, health: 1, mental_health: 4, intelligence: 5 },
      xpChanges: { physique: 0, health: 10, mental_health: 40, intelligence: 50 },
      levelUps: [],
      summary: "Contest • First",
      activityScene: "character holding trophy",
      imageUrl: ACTIVITY_IMAGES.first,
      createdAt: getPastIso(7),
    },
    {
      day: 6,
      text: "Back and shoulder strength routine. Good focus and pump.",
      mood: 'good',
      scores: { physique: 4, health: 3, mental_health: 2, intelligence: 0 },
      xpChanges: { physique: 40, health: 30, mental_health: 20, intelligence: 0 },
      levelUps: [],
      summary: "Power • Worked out",
      activityScene: "character working out",
      imageUrl: ACTIVITY_IMAGES.workout,
      createdAt: getPastIso(8),
    },
    {
      day: 5,
      text: "Celebrated completion of app prototype with a dance performance.",
      mood: 'excellent',
      scores: { physique: 3, health: 2, mental_health: 4, intelligence: 2 },
      xpChanges: { physique: 30, health: 20, mental_health: 40, intelligence: 20 },
      levelUps: [],
      summary: "Joy • Danced",
      activityScene: "character dancing",
      imageUrl: ACTIVITY_IMAGES.dance,
      createdAt: getPastIso(9),
    },
    {
      day: 4,
      text: "Tired day. Stayed in cozy clothes on the sofa all afternoon.",
      mood: 'neutral',
      scores: { physique: -1, health: 0, mental_health: 1, intelligence: 1 },
      xpChanges: { physique: -10, health: 0, mental_health: 10, intelligence: 10 },
      levelUps: [],
      summary: "Calm • Sofa",
      activityScene: "character on couch",
      imageUrl: ACTIVITY_IMAGES.couch,
      createdAt: getPastIso(10),
    },
    {
      day: 3,
      text: "Won our university pitch competition! Outstanding feedback from judges.",
      mood: 'good',
      scores: { physique: 0, health: 1, mental_health: 4, intelligence: 4 },
      xpChanges: { physique: 0, health: 10, mental_health: 40, intelligence: 40 },
      levelUps: [],
      summary: "Pitch • First",
      activityScene: "character with prize",
      imageUrl: ACTIVITY_IMAGES.first,
      createdAt: getPastIso(11),
    },
    {
      day: 2,
      text: "Solid 45-minute dumbbell lifting and core training session.",
      mood: 'good',
      scores: { physique: 4, health: 3, mental_health: 2, intelligence: 0 },
      xpChanges: { physique: 40, health: 30, mental_health: 20, intelligence: 0 },
      levelUps: [],
      summary: "Training • Workout",
      activityScene: "character working out",
      imageUrl: ACTIVITY_IMAGES.workout,
      createdAt: getPastIso(12),
    },
    {
      day: 1,
      text: "Began my journey on Ethos. Outlined core daily goals and habits.",
      mood: 'good',
      scores: { physique: 2, health: 2, mental_health: 3, intelligence: 2 },
      xpChanges: { physique: 20, health: 20, mental_health: 30, intelligence: 20 },
      levelUps: [],
      summary: "Genesis • Start",
      activityScene: "character starting journey",
      imageUrl: ACTIVITY_IMAGES.workout,
      createdAt: getPastIso(13),
    },
  ];

  const moods: Record<number, MoodType> = {};
  logs.forEach((l) => {
    if (l.mood) moods[l.day] = l.mood as MoodType;
  });

  return {
    currentDay: 15,
    stats,
    logs,
    moods,
    xpNeeded: xpNeededMap,
    characterLevel: characterLevel(stats),
    currentMood: null,
    selectedCharacter: 'ch_1',
    tasks: [
      {
        id: '1',
        title: 'Prepare for exam',
        completed: false,
        type: 'task',
        statRewards: { intelligence: 3 },
      },
      {
        id: '2',
        title: 'Morning stretch & cardio',
        completed: false,
        type: 'habit',
        frequency: 'everyday',
        timesPerDay: 1,
        statRewards: { physique: 2, health: 1 },
        reminderTime: '08:00 AM',
        reminderEnabled: true,
      },
      {
        id: '3',
        title: 'Hydrate (8 glasses)',
        completed: false,
        type: 'habit',
        frequency: 'everyday',
        timesPerDay: 3,
        timesCompletedToday: 1,
        statRewards: { health: 1 },
      },
      {
        id: '4',
        title: 'Learn Japanese',
        completed: false,
        type: 'task',
        statRewards: { intelligence: 2 },
      },
      {
        id: '5',
        title: 'Mindfulness & Meditation',
        completed: true,
        type: 'habit',
        frequency: 'everyday',
        timesPerDay: 1,
        timesCompletedToday: 1,
        statRewards: { mental_health: 3 },
        reminderTime: '09:00 PM',
        reminderEnabled: true,
      },
      {
        id: '6',
        title: 'Wash the dishes',
        completed: false,
        type: 'task',
        statRewards: { health: 1 },
      },
      {
        id: '7',
        title: 'Gym workout',
        completed: false,
        type: 'habit',
        frequency: 'specific_days',
        daysOfWeek: ['Mon', 'Wed', 'Fri'],
        timesPerDay: 1,
        statRewards: { physique: 3 },
      },
    ],
  };
}

/**
 * Fresh default state initialized with 2-week testing data.
 */
export function defaultState(): AppState {
  return createTwoWeekDemoState();
}

/**
 * Augment raw or loaded state with calculated/derived fields.
 */
export function deriveState(raw: Partial<AppState>): AppState {
  const currentDay = Math.max(1, typeof raw.currentDay === 'number' ? raw.currentDay : 1);
  const rawStats = (raw.stats || {}) as Partial<Record<StatName, StatData>>;
  const rawPhysique = rawStats.physique || (rawStats as any).strength;

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
    physique: {
      level: Math.max(1, rawPhysique?.level ?? 1),
      xp: Math.max(0, rawPhysique?.xp ?? 0),
    },
  };

  const xpNeededMap: Record<StatName, number> = {
    health: xpNeeded(stats.health.level),
    intelligence: xpNeeded(stats.intelligence.level),
    mental_health: xpNeeded(stats.mental_health.level),
    physique: xpNeeded(stats.physique.level),
  };

  const logs: LogEntry[] = Array.isArray(raw.logs) ? raw.logs : [];
  const moods = raw.moods || {};

  const currentMood =
    (moods[currentDay] as MoodType) ||
    (logs.find((l) => l.day === currentDay)?.mood as MoodType) ||
    raw.currentMood ||
    null;

  const selectedChar = (raw.selectedCharacter as CharacterType) || 'ch_1';

  const rawTasksList = Array.isArray(raw.tasks) && raw.tasks.length > 0
    ? raw.tasks
    : [
        { id: '1', title: 'Prepare for exam', completed: false, type: 'task' as const, statRewards: { intelligence: 3 } },
        { id: '2', title: 'Morning stretch & cardio', completed: false, type: 'habit' as const, timesPerDay: 1, statRewards: { physique: 2, health: 1 } },
        { id: '3', title: 'Complete the app', completed: false, type: 'task' as const, statRewards: { intelligence: 3 } },
        { id: '4', title: 'Mindfulness session', completed: false, type: 'habit' as const, timesPerDay: 1, statRewards: { mental_health: 2 } },
      ];

  const tasks: TaskItem[] = rawTasksList.map((t) => {
    const rewards = getTaskStatRewards(t);
    return {
      ...t,
      type: t.type || 'task',
      statRewards: rewards,
      timesPerDay: t.timesPerDay || 1,
      timesCompletedToday: t.timesCompletedToday ?? (t.completed ? (t.timesPerDay || 1) : 0),
    };
  });

  return {
    currentDay,
    stats,
    logs,
    moods,
    xpNeeded: xpNeededMap,
    characterLevel: characterLevel(stats),
    currentMood,
    selectedCharacter: selectedChar,
    tasks,
  };
}
