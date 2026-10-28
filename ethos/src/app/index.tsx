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
  Modal,
  AppState as RNAppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import { Theme } from '../theme';
import {
  AppState,
  CharacterType,
  CreateTaskInput,
  LevelUpEvent,
  LogEntry,
  MoodType,
  StatName,
  TabType,
  TaskItem,
} from '../types';
import { HeaderBar } from '../components/HeaderBar';
import { HeroStatsSection } from '../components/HeroStatsSection';
import { SleekJournalInput } from '../components/SleekJournalInput';
import { UnfinishedTasksSection } from '../components/UnfinishedTasksSection';
import { TasksScreen } from '../components/TasksScreen';
import { ProgressScreen } from '../components/ProgressScreen';
import { ChroniclesScreen } from '../components/ChroniclesScreen';
import { HeroScreen } from '../components/HeroScreen';
import { FloatingDock } from '../components/FloatingDock';
import { adjustStatXp, applyXp, deriveState, getTaskStatRewards, STAT_NAMES } from '../game';
import { loadLocalState, resetLocalState, saveLocalState } from '../storage';

export default function HomeScreen() {
  const [state, setState] = useState<AppState | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [character, setCharacter] = useState<CharacterType>('ch_1');
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LogEntry | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  const scrollViewRef = useRef<any>(null);

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

  // ── Wake up sleeping server on app open ──────────────────────────────
  const pingServer = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ping`);
      const data = await res.json();
      return data?.ok === true;
    } catch {
      return false;
    }
  };

  // ── Load Local State & Ping Server on Launch ─────────────────────────
  useEffect(() => {
    pingServer(); // wakes server immediately
    async function init() {
      try {
        const local = await loadLocalState();
        setState(local);
        if (local.selectedCharacter) {
          setCharacter(local.selectedCharacter);
        }
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

  // ── Character Selection ──────────────────────────────────────────────
  const handleSelectCharacter = async (char: CharacterType) => {
    setCharacter(char);
    if (!state) return;
    const nextState = deriveState({
      ...state,
      selectedCharacter: char,
    });
    setState(nextState);
    try {
      await saveLocalState(nextState);
    } catch (err) {
      console.warn('Could not persist character to local storage:', err);
    }
  };

  // ── Task Completion Toggle (Applies XP to Stats) ──────────────────────
  const handleToggleTask = async (taskId: string) => {
    if (!state) return;
    const currentTasks = state.tasks || [];
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) return;

    const rewards = getTaskStatRewards(task);
    const isHabit = task.type === 'habit';
    const targetCount = task.timesPerDay || 1;
    const currentCount = task.timesCompletedToday || (task.completed ? targetCount : 0);

    let nextCompleted = task.completed;
    let nextCount = currentCount;
    let xpMultiplier = 0; // positive for gaining XP, negative for losing XP

    if (isHabit && targetCount > 1) {
      if (currentCount < targetCount) {
        nextCount = currentCount + 1;
        nextCompleted = nextCount >= targetCount;
        xpMultiplier = 1;
      } else {
        // Uncheck / reset from completed to 0
        nextCount = 0;
        nextCompleted = false;
        xpMultiplier = -targetCount;
      }
    } else {
      if (!task.completed) {
        nextCompleted = true;
        nextCount = 1;
        xpMultiplier = 1;
      } else {
        nextCompleted = false;
        nextCount = 0;
        xpMultiplier = -1;
      }
    }

    const updatedTasks = currentTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: nextCompleted,
            timesCompletedToday: nextCount,
          }
        : t
    );

    // Apply XP delta to stats
    const updatedStats = { ...state.stats };
    if (xpMultiplier !== 0) {
      Object.entries(rewards).forEach(([statKey, rewardXp]) => {
        const statName = statKey as StatName;
        const cur = updatedStats[statName] || { level: 1, xp: 0 };
        const delta = (rewardXp || 0) * xpMultiplier;
        const res = adjustStatXp(cur.level, cur.xp, delta);
        updatedStats[statName] = {
          level: res.level,
          xp: res.xp,
        };
      });
    }

    const nextState = deriveState({
      ...state,
      stats: updatedStats,
      tasks: updatedTasks,
    });

    setState(nextState);
    try {
      await saveLocalState(nextState);
    } catch (err) {
      console.warn('Could not persist task update:', err);
    }
  };

  // ── Add New Task or Habit ─────────────────────────────────────────────
  const handleAddTask = async (params: CreateTaskInput) => {
    if (!state || !params.title.trim()) return;
    const currentTasks = state.tasks || [];
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: params.title.trim(),
      completed: false,
      type: params.type,
      statRewards: params.statRewards,
      frequency: params.frequency,
      daysOfWeek: params.daysOfWeek,
      timesPerDay: params.timesPerDay || 1,
      timesCompletedToday: 0,
      reminderTime: params.reminderTime,
      reminderEnabled: params.reminderEnabled,
      createdAt: new Date().toISOString(),
    };
    const nextState = deriveState({
      ...state,
      tasks: [...currentTasks, newTask],
    });
    setState(nextState);
    try {
      await saveLocalState(nextState);
    } catch (err) {
      console.warn('Could not persist new task:', err);
    }
  };

  // ── Update Existing Task or Habit ─────────────────────────────────────
  const handleUpdateTask = async (taskId: string, params: CreateTaskInput) => {
    if (!state || !params.title.trim()) return;
    const currentTasks = state.tasks || [];
    const updatedTasks = currentTasks.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        title: params.title.trim(),
        type: params.type,
        statRewards: params.statRewards,
        frequency: params.frequency,
        daysOfWeek: params.daysOfWeek,
        timesPerDay: params.timesPerDay || 1,
        reminderTime: params.reminderTime,
        reminderEnabled: params.reminderEnabled,
      };
    });
    const nextState = deriveState({
      ...state,
      tasks: updatedTasks,
    });
    setState(nextState);
    try {
      await saveLocalState(nextState);
    } catch (err) {
      console.warn('Could not persist task update:', err);
    }
  };

  // ── Delete Task or Habit ──────────────────────────────────────────────
  const handleDeleteTask = async (taskId: string) => {
    if (!state) return;
    const currentTasks = state.tasks || [];
    const updatedTasks = currentTasks.filter((t) => t.id !== taskId);
    const nextState = deriveState({
      ...state,
      tasks: updatedTasks,
    });
    setState(nextState);
    try {
      await saveLocalState(nextState);
    } catch (err) {
      console.warn('Could not persist task deletion:', err);
    }
  };

  // ── Evaluate Day Chronicle (Stateless Gemini evaluation + Client XP math + AI Activity Scene) ──
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
          character,
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
        physique: 0,
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
        summary: data.summary,
        activityScene: data.activityScene,
        imageUrl: data.imageUrl ?? null,
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
      // Habits carry over and reset for the new day; completed one-time tasks are removed; unfinished one-time tasks carry over
      const nextTasks = (state.tasks || [])
        .filter((t) => t.type === 'habit' || !t.completed)
        .map((t) =>
          t.type === 'habit'
            ? { ...t, completed: false, timesCompletedToday: 0 }
            : t
        );
      const nextState = deriveState({
        ...state,
        currentDay: nextDay,
        currentMood: null,
        tasks: nextTasks,
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
              setCurrentTab('home');
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
          <ActivityIndicator size="large" color="#2C3036" />
          <Text style={styles.loadingText}>Awakening Ethos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate bottom padding so unfinished tasks can scroll cleanly above the floating mood tracker
  const effectiveKeyboardHeight = keyboardHeight > 0 ? keyboardHeight : 290;
  const bottomPadding = !dayLogged
    ? (isKeyboardVisible ? effectiveKeyboardHeight + 80 : 180)
    : 130;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={undefined}
      >
        {/* ── HOME TAB (home-1.png & home-2.png) ── */}
        {currentTab === 'home' && (
          <View style={styles.homeTabWrapper}>
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
              {/* 1. Header with greeting and profile avatar button */}
              <HeaderBar
                day={state.currentDay}
                onPressProfile={() => setIsProfileModalVisible(true)}
              />

              {/* 2. Hero + Stacked Stats Section (New character & exact user colors) */}
              {(() => {
                const todayLog =
                  state.logs.find((l) => l.day === state.currentDay) ||
                  (lastResult?.day === state.currentDay ? lastResult : null);
                return (
                  <HeroStatsSection
                    character={character}
                    stats={state.stats}
                    xpNeeded={state.xpNeeded}
                    dailyImageUrl={todayLog?.imageUrl}
                    dailyActivityScene={todayLog?.activityScene}
                    xpDeltas={lastResult?.scores || state.logs[0]?.scores}
                  />
                );
              })()}

              {/* 3. Unfinished Tasks Section */}
              <UnfinishedTasksSection
                tasks={state.tasks || []}
                onToggleTask={handleToggleTask}
                onPressSeeAll={() => setCurrentTab('tasks')}
              />

              {/* 4. If day is evaluated, show Verdict Result Card right in the scroll flow */}
              {dayLogged && (
                <SleekJournalInput
                  mode="resultOnly"
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
                />
              )}
            </ScrollView>

            {/* 5. Mood Tracker / Journal Input floating pinned above menu bar (and above keyboard when typing) */}
            {!dayLogged && (
              <View
                style={[
                  styles.floatingActionBar,
                  { bottom: isKeyboardVisible ? effectiveKeyboardHeight + 12 : 88 },
                ]}
              >
                <SleekJournalInput
                  mode="floatingBar"
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
                />
              </View>
            )}
          </View>
        )}

        {/* ── TASKS TAB (tasks.png) ── */}
        {currentTab === 'tasks' && (
          <TasksScreen
            tasks={state.tasks || []}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onPressProfile={() => setIsProfileModalVisible(true)}
          />
        )}

        {/* ── JOURNAL CHRONICLES TAB (journal.png) ── */}
        {currentTab === 'journal' && (
          <ChroniclesScreen
            logs={state.logs}
            onPressProfile={() => setIsProfileModalVisible(true)}
          />
        )}

        {/* ── INSIGHTS TAB (insights.png) ── */}
        {currentTab === 'insights' && (
          <ProgressScreen
            state={state}
            onPressProfile={() => setIsProfileModalVisible(true)}
          />
        )}
      </KeyboardAvoidingView>

      {/* Floating Menu Bar (hidden when keyboard is open) */}
      {!isKeyboardVisible && (
        <FloatingDock currentTab={currentTab} onSelectTab={setCurrentTab} />
      )}

      {/* Hero Profile & Settings Modal */}
      <Modal
        visible={isProfileModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Hero Archetype</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsProfileModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#2C3036" />
            </TouchableOpacity>
          </View>
          <HeroScreen
            state={state}
            selectedCharacter={character}
            onSelectCharacter={handleSelectCharacter}
            onReset={() => {
              setIsProfileModalVisible(false);
              handleReset();
            }}
            apiBaseUrl={API_BASE_URL}
            onImportState={(restored) => {
              setState(restored);
              if (restored.selectedCharacter) {
                setCharacter(restored.selectedCharacter);
              }
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
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  homeTabWrapper: {
    flex: 1,
    position: 'relative',
  },
  floatingActionBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 99,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6F7983',
    marginTop: 12,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F4',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3036',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

