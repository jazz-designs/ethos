import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import { Theme } from '../theme';
import { AppState, CharacterType, LevelUpEvent, LogEntry, MoodType, StatName, TabType } from '../types';
import { HeaderBar } from '../components/HeaderBar';
import { HeroStatsSection } from '../components/HeroStatsSection';
import { SleekJournalInput } from '../components/SleekJournalInput';
import { ProgressScreen } from '../components/ProgressScreen';
import { ChroniclesScreen } from '../components/ChroniclesScreen';
import { HeroScreen } from '../components/HeroScreen';
import { FloatingDock } from '../components/FloatingDock';
import { applyXp, deriveState, STAT_NAMES } from '../game';
import { loadLocalState, resetLocalState, saveLocalState } from '../storage';

export default function HomeScreen() {
  const [state, setState] = useState<AppState | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('today');
  const [character, setCharacter] = useState<CharacterType>('mage');
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LogEntry | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  // Keyboard visibility & exact height listener
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e?.endCoordinates?.height || 280;
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Load Local State on Launch ───────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const local = await loadLocalState();
        setState(local);
        const todayLog = local.logs.find((l) => l.day === local.currentDay);
        setLastResult(todayLog ?? null);

        if (todayLog?.mood) {
          setSelectedMood(todayLog.mood as MoodType);
        } else if (local.currentMood) {
          setSelectedMood(local.currentMood as MoodType);
        } else {
          setSelectedMood(null);
        }
      } catch (err: any) {
        console.error('Failed to load local state:', err);
        setError('Could not load local data from device storage.');
      }
    }
    init();
  }, []);

  // Check if current day has already been evaluated
  const dayLogged = state
    ? state.logs.some((l) => l.day === state.currentDay)
    : false;

  // ── Mood Selection (Local storage persistence) ───────────────────────
  const handleSelectMood = async (mood: MoodType) => {
    setSelectedMood(mood);
    if (!state) return;

    const nextMoods = { ...(state.moods || {}), [state.currentDay]: mood };
    const nextLogs = state.logs.map((l) => (l.day === state.currentDay ? { ...l, mood } : l));

    const nextState = deriveState({
      ...state,
      currentMood: mood,
      moods: nextMoods,
      logs: nextLogs,
    });

    setState(nextState);
    try {
      await saveLocalState(nextState);
    } catch (err) {
      console.warn('Could not persist mood to local storage:', err);
    }
  };

  // ── Evaluate Day Chronicle (Stateless Gemini evaluation + Client XP math) ──
  const handleEvaluate = async () => {
    if (!text.trim() || loading || !state) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Evaluation service error (${res.status})`);
      }

      if (!data.scores || typeof data.scores !== 'object') {
        throw new Error('Invalid response structure received from evaluation service.');
      }

      // ── Client-Side XP Math ──
      const scores = data.scores as Record<StatName, number>;
      const updatedStats = { ...state.stats };
      const xpChanges: Record<StatName, number> = {
        health: 0,
        intelligence: 0,
        mental_health: 0,
        strength: 0,
      };
      const allLevelUps: LevelUpEvent[] = [];

      for (const stat of STAT_NAMES) {
        const cur = updatedStats[stat] || { level: 1, xp: 0 };
        const scoreVal = typeof scores[stat] === 'number' ? scores[stat] : 0;
        const result = applyXp(stat, cur.level, cur.xp, scoreVal);

        updatedStats[stat] = {
          level: result.level,
          xp: result.xp,
        };
        xpChanges[stat] = result.xpChange;
        allLevelUps.push(...result.levelUps);
      }

      const dayMood = selectedMood || state.moods?.[state.currentDay] || null;
      const nextMoods = { ...(state.moods || {}) };
      if (dayMood) {
        nextMoods[state.currentDay] = dayMood;
      }

      const logEntry: LogEntry = {
        day: state.currentDay,
        text: text.trim(),
        mood: dayMood,
        scores,
        xpChanges,
        levelUps: allLevelUps,
        createdAt: new Date().toISOString(),
      };

      const nextState = deriveState({
        ...state,
        stats: updatedStats,
        logs: [...state.logs, logEntry],
        moods: nextMoods,
        currentMood: dayMood,
      });

      // Save to local device storage
      await saveLocalState(nextState);

      setState(nextState);
      setLastResult(logEntry);
      setText('');
      Keyboard.dismiss();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during evaluation.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Advance to Next Day (100% Local) ──────────────────────────────────
  const handleNextDay = async () => {
    if (!state) return;
    setError(null);
    try {
      const nextDay = state.currentDay + 1;
      const nextState = deriveState({
        ...state,
        currentDay: nextDay,
        currentMood: null,
      });

      await saveLocalState(nextState);
      setState(nextState);
      setLastResult(null);
      setText('');
      setSelectedMood(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to advance to next day.';
      setError(message);
    }
  };

  // ── Reset All Local Data ─────────────────────────────────────────────
  const handleReset = () => {
    Alert.alert(
      'Reset All Progress?',
      'This will wipe all stat levels, XP, mood archives, and chronicle history back to Day 1 on this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              const fresh = await resetLocalState();
              setState(fresh);
              setLastResult(null);
              setText('');
              setSelectedMood(null);
              setError(null);
              setCurrentTab('today');
            } catch {
              setError('Failed to reset local data.');
            }
          },
        },
      ]
    );
  };

  // ── Loading View ─────────────────────────────────────────────────────
  if (!state) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.purple} />
          <Text style={styles.loadingText}>Awakening Ethos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate bottom padding based on keyboard height so input box stays fully above keyboard
  const bottomPadding = isKeyboardVisible
    ? Math.max(keyboardHeight, 280) + 60
    : 130;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {currentTab === 'today' && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* 1. Header */}
            <HeaderBar day={state.currentDay} />

            {/* 2. Hero + Stacked Stats Section */}
            <HeroStatsSection
              character={character}
              stats={state.stats}
              xpNeeded={state.xpNeeded}
            />

            {/* 3. Frictionless Rounded Input with Send Icon & Pop-up Mood Selector */}
            <SleekJournalInput
              day={state.currentDay}
              text={text}
              onChangeText={setText}
              selectedMood={selectedMood}
              onSelectMood={handleSelectMood}
              loading={loading}
              dayLogged={dayLogged}
              onEvaluate={handleEvaluate}
              lastResult={lastResult}
              onNextDay={handleNextDay}
              error={error}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
          </ScrollView>
        )}

        {currentTab === 'progress' && <ProgressScreen state={state} />}

        {currentTab === 'chronicles' && <ChroniclesScreen logs={state.logs} />}

        {currentTab === 'hero' && (
          <HeroScreen
            state={state}
            selectedCharacter={character}
            onSelectCharacter={setCharacter}
            onReset={handleReset}
            apiBaseUrl={API_BASE_URL}
            onImportState={(restored) => {
              setState(restored);
              const todayLog = restored.logs.find((l) => l.day === restored.currentDay);
              setLastResult(todayLog ?? null);
              if (todayLog?.mood) {
                setSelectedMood(todayLog.mood as MoodType);
              } else if (restored.currentMood) {
                setSelectedMood(restored.currentMood as MoodType);
              } else {
                setSelectedMood(null);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>

      {/* 4. Animated Minimalist Floating Dock (hidden when typing) */}
      {!isKeyboardVisible && (
        <FloatingDock currentTab={currentTab} onSelectTab={setCurrentTab} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginTop: 12,
  },
});
