export type StatName = 'health' | 'intelligence' | 'mental_health' | 'physique';

export type MoodType = 'worst' | 'bad' | 'neutral' | 'good' | 'excellent';

export type CharacterType = 'ch_1' | 'ch_2' | 'ch_3' | 'ch_4';

export interface StatData {
  level: number;
  xp: number;
}

export interface LevelUpEvent {
  stat: string;
  newLevel: number;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  type?: 'task' | 'habit';
  statReward?: StatName; // legacy single stat
  statRewards?: Partial<Record<StatName, number>>; // 0 to 3 XP per stat
  frequency?: 'everyday' | 'specific_days';
  daysOfWeek?: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  timesPerDay?: number; // 1, 2, or 3
  timesCompletedToday?: number;
  reminderTime?: string | null; // e.g. '09:00 AM'
  reminderEnabled?: boolean;
  createdAt?: string;
}

export interface CreateTaskInput {
  title: string;
  type: 'task' | 'habit';
  statRewards: Partial<Record<StatName, number>>;
  frequency?: 'everyday' | 'specific_days';
  daysOfWeek?: string[];
  timesPerDay?: number;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
}


export interface LogEntry {
  day: number;
  text: string;
  mood?: MoodType | string | null;
  scores: Record<StatName, number>;
  xpChanges: Record<StatName, number>;
  levelUps: LevelUpEvent[];
  summary?: string;
  activityScene?: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface AppState {
  currentDay: number;
  stats: Record<StatName, StatData>;
  logs: LogEntry[];
  moods?: Record<number | string, MoodType | string>;
  xpNeeded: Record<StatName, number>;
  characterLevel: number;
  currentMood?: MoodType | string | null;
  selectedCharacter?: CharacterType;
  tasks?: TaskItem[];
}

export type TabType = 'home' | 'tasks' | 'journal' | 'insights';

export interface MoodOption {
  id: MoodType;
  label: string;
  color: string;
  bg: string;
}
