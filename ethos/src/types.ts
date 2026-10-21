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
  statReward?: StatName;
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
