export type StatName = 'health' | 'intelligence' | 'mental_health' | 'strength';

export type MoodType = 'worst' | 'bad' | 'neutral' | 'good' | 'excellent';

export type CharacterType = 'mage' | 'monk' | 'ranger' | 'warrior';

export interface StatData {
  level: number;
  xp: number;
}

export interface LevelUpEvent {
  stat: string;
  newLevel: number;
}

export interface LogEntry {
  day: number;
  text: string;
  mood?: MoodType | string | null;
  scores: Record<StatName, number>;
  xpChanges: Record<StatName, number>;
  levelUps: LevelUpEvent[];
  summary?: string;
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
}

export type TabType = 'today' | 'progress' | 'chronicles' | 'hero';

export interface MoodOption {
  id: MoodType;
  label: string;
  color: string;
  bg: string;
}
