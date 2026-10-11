import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { AppState, CharacterType, LogEntry, MoodType, TabType } from '../types';
import { HeaderBar } from '../components/HeaderBar';
import { HeroStatsSection } from '../components/HeroStatsSection';
import { SleekJournalInput } from '../components/SleekJournalInput';
import { ProgressScreen } from '../components/ProgressScreen';
import { ChroniclesScreen } from '../components/ChroniclesScreen';
import { HeroScreen } from '../components/HeroScreen';
import { FloatingDock } from '../components/FloatingDock';

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

  // Check if current day has already been evaluated
  const dayLogged = state
    ? state.logs.some((l) => l.day === state.currentDay)
    : false;

  // ── Fetch Server State ────────────────────────────────────────────────
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/state`);
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data: AppState = await res.json();
      setState(data);
      setError(null);

      // Restore today's log & mood if already exists
      const todayLog = data.logs.find((l) => l.day === data.currentDay);
      setLastResult(todayLog ?? null);

      if (todayLog?.mood) {
        setSelectedMood(todayLog.mood as MoodType);
      } else if (data.currentMood) {
        setSelectedMood(data.currentMood as MoodType);
      } else {
        setSelectedMood(null);
      }
    } catch {
      setError(`Cannot connect to server at ${API_BASE_URL}.\nEnsure backend is running and your PC & phone are on the same Wi-Fi.`);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // ── Mood Selection ───────────────────────────────────────────────────
  const handleSelectMood = async (mood: MoodType) => {
    setSelectedMood(mood);
    if (!state) return;

    // Optimistically update
    setState((prev) => (prev ? { ...prev, currentMood: mood } : null));

    try {
      const res = await fetch(`${API_BASE_URL}/api/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });
      if (res.ok) {
        const updated: AppState = await res.json();
        setState(updated);
      }
    } catch (err) {
      console.warn('Could not save mood to server:', err);
    }
  };

  // ── Evaluate Day Chronicle ───────────────────────────────────────────
  const handleEvaluate = async () => {
    if (!text.trim() || loading || !state) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          mood: selectedMood || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Evaluation failed with status ${res.status}`);

      setState(data.state);
      setLastResult(data.log);
      setText('');
      Keyboard.dismiss();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during evaluation.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Advance to Next Day ──────────────────────────────────────────────
  const handleNextDay = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/next-day`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to advance day`);

      setState(data);
      setLastResult(null);
      setText('');
      setSelectedMood(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to advance to next day.';
      setError(message);
    }
  };

  // ── Reset All Data ───────────────────────────────────────────────────
  const handleReset = () => {
    Alert.alert(
      'Reset All Progress?',
      'This will wipe all stat levels, XP, mood archives, and chronicle history back to Day 1.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/reset`, { method: 'POST' });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setState(data);
              setLastResult(null);
              setText('');
              setSelectedMood(null);
              setError(null);
              setCurrentTab('today');
            } catch {
              setError('Failed to reset server data.');
            }
          },
        },
      ]
    );
  };

  // ── Loading & Initial Error Views ────────────────────────────────────
  if (!state) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          {error ? (
            <View style={styles.initErrorCard}>
              <View style={styles.initErrorIcon}>
                <Ionicons name="cloud-offline" size={32} color={Theme.colors.roseDark} />
              </View>
              <Text style={styles.initErrorTitle}>Connection Lost</Text>
              <Text style={styles.initErrorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchState}>
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Theme.colors.purple} />
              <Text style={styles.loadingText}>Awakening Ethos...</Text>
            </View>
          )}
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
            {/* 1. Header (No user logo on top left) */}
            <HeaderBar day={state.currentDay} />

            {/* 2. Hero + Stacked Stats Section */}
            {/* (Character big and on the LEFT going offscreen, 4 stats stacked on RIGHT, no hero label or level) */}
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
          />
        )}
      </KeyboardAvoidingView>

      {/* 4. Animated Minimalist Floating Dock (hidden when typing so it never obscures the input box) */}
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
  },
  initErrorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    padding: 26,
    alignItems: 'center',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  initErrorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.roseLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  initErrorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  initErrorText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Theme.colors.dockBg,
    borderRadius: Theme.radii.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...Theme.shadows.card,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
