import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, LogEntry, MoodType, StatData, StatName } from './types';
import { defaultState, deriveState, STAT_NAMES } from './game';

const STORAGE_KEY = '@ethos_character_state_v1';

export interface EthosBackupEnvelope {
  appName: 'Ethos';
  schemaVersion: 1;
  exportedAt: string;
  data: {
    currentDay: number;
    stats: Record<StatName, StatData>;
    logs: LogEntry[];
    moods?: Record<number | string, MoodType | string>;
  };
}

/**
 * Load state from user's phone local storage.
 * If no saved data exists, initializes and returns default state.
 */
export async function loadLocalState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = defaultState();
      try {
        await saveLocalState(initial);
      } catch (saveErr) {
        console.warn('Initial state created in memory, save deferred:', saveErr);
      }
      return initial;
    }

    const parsed = JSON.parse(raw);
    return deriveState(parsed);
  } catch (err) {
    console.warn('Failed to load local state, falling back to default:', err);
    const fallback = defaultState();
    return fallback;
  }
}

/**
 * Save state locally to user's phone app storage.
 */
export async function saveLocalState(state: AppState): Promise<void> {
  try {
    const json = JSON.stringify(state);
    await AsyncStorage.setItem(STORAGE_KEY, json);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('Failed to save state to local device storage:', errMsg);
    throw new Error(`Unable to write data to local storage: ${errMsg}`);
  }
}

/**
 * Reset local storage back to Day 1 defaults.
 */
export async function resetLocalState(): Promise<AppState> {
  const fresh = defaultState();
  await saveLocalState(fresh);
  return fresh;
}

/**
 * Export all journal entries, stats, and moods to a formatted JSON string.
 */
export function createBackupJson(state: AppState): string {
  const envelope: EthosBackupEnvelope = {
    appName: 'Ethos',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      currentDay: state.currentDay,
      stats: state.stats,
      logs: state.logs,
      moods: state.moods,
    },
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Validates and restores backup JSON into local phone storage.
 */
export async function restoreBackupJson(jsonString: string): Promise<AppState> {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('Backup data is empty or invalid.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString.trim());
  } catch {
    throw new Error('Invalid JSON format. Please ensure the full backup text was copied.');
  }

  // Support both wrapped envelope { appName, data: { ... } } and raw state object
  const payload = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backup structure: missing data object.');
  }

  // Validate stats
  if (!payload.stats || typeof payload.stats !== 'object') {
    throw new Error('Invalid backup structure: missing stats data.');
  }

  // Sanitize and derive full state
  const restoredState = deriveState({
    currentDay: typeof payload.currentDay === 'number' ? payload.currentDay : 1,
    stats: payload.stats,
    logs: Array.isArray(payload.logs) ? payload.logs : [],
    moods: payload.moods || {},
  });

  // Persist restored state locally on user's device
  await saveLocalState(restoredState);

  return restoredState;
}
