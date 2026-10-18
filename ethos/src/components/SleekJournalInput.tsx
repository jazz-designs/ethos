import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { LogEntry, MoodType, StatName } from '../types';
import { MOOD_IMAGES, STAT_IMAGES } from '../assets';

interface SleekJournalInputProps {
  day: number;
  text: string;
  onChangeText: (text: string) => void;
  selectedMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
  loading: boolean;
  dayLogged: boolean;
  onEvaluate: () => void;
  lastResult: LogEntry | null;
  onNextDay: () => void;
  error?: string | null;
  onFocus?: () => void;
}

const MOODS: { id: MoodType; label: string; color: string }[] = [
  { id: 'worst', label: 'Worst', color: Theme.colors.roseDark },
  { id: 'bad', label: 'Bad', color: Theme.colors.orangeDark },
  { id: 'neutral', label: 'Neutral', color: Theme.colors.purpleDark },
  { id: 'good', label: 'Good', color: Theme.colors.mintDark },
  { id: 'excellent', label: 'Excellent', color: Theme.colors.goldDark },
];

const STAT_LABELS: Record<StatName, { label: string; color: string; bg: string }> = {
  health: { label: 'Health', color: Theme.colors.roseDark, bg: Theme.colors.roseLight },
  intelligence: { label: 'Intelligence', color: Theme.colors.purpleDark, bg: Theme.colors.purpleLight },
  mental_health: { label: 'Mental Health', color: Theme.colors.mintDark, bg: Theme.colors.mintLight },
  strength: { label: 'Strength', color: Theme.colors.orangeDark, bg: Theme.colors.orangeLight },
};

export const SleekJournalInput: React.FC<SleekJournalInputProps> = ({
  day,
  text,
  onChangeText,
  selectedMood,
  onSelectMood,
  loading,
  dayLogged,
  onEvaluate,
  lastResult,
  onNextDay,
  error,
  onFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [swappedToInput, setSwappedToInput] = useState(false);

  // When day advances, reset to mood view
  React.useEffect(() => {
    setSwappedToInput(false);
  }, [day]);

  const handleChooseMood = (mood: MoodType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectMood(mood);
    setSwappedToInput(true);
  };

  const handleSwitchToMoods = () => {
    Haptics.selectionAsync();
    setSwappedToInput(false);
  };

  const handleSendPress = () => {
    if (!text.trim() || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEvaluate();
  };

  const handleAdvanceDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNextDay();
  };

  // Show ONLY the mood tracker at first (before a mood is tapped)
  const showMoodTrackerFirst = !dayLogged && !swappedToInput;

  return (
    <View style={styles.container}>
      {/* ── 1. MOOD TRACKER FIRST (Unboxed, Big Expressive Icons) ── */}
      {showMoodTrackerFirst ? (
        <View style={styles.moodTrackerContainer}>
          <View style={styles.moodHeader}>
            <Text style={styles.moodTitle}>How was your day?</Text>
            <Text style={styles.moodSubtitle}>Select your mood to chronicle your feats</Text>
          </View>

          {/* 5 Big Mood Icons with no surrounding background boxes */}
          <View style={styles.moodsRow}>
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.id;
              return (
                <Pressable
                  key={m.id}
                  style={({ pressed }) => [
                    styles.moodItem,
                    pressed && styles.moodItemPressed,
                  ]}
                  onPress={() => handleChooseMood(m.id)}
                >
                  <View style={[styles.moodIconWrapper, isSelected && styles.moodIconSelected]}>
                    <Image
                      source={MOOD_IMAGES[m.id]}
                      style={styles.bigMoodIcon}
                      contentFit="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.moodLabel,
                      { color: isSelected ? m.color : Theme.colors.textSecondary },
                      isSelected && styles.moodLabelSelected,
                    ]}
                  >
                    {m.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.activeDot, { backgroundColor: m.color }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : !dayLogged ? (
        /* ── 2. INPUT BOX (Swapped after mood is selected) ── */
        <View style={styles.inputSection}>
          {/* Header showing selected mood with option to switch back */}
          {selectedMood && (
            <View style={styles.selectedMoodHeader}>
              <Pressable
                style={({ pressed }) => [
                  styles.selectedMoodPill,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleSwitchToMoods}
              >
                <Image
                  source={MOOD_IMAGES[selectedMood]}
                  style={styles.pillMoodIcon}
                  contentFit="contain"
                />
                <Text style={styles.pillMoodText}>
                  {selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} Aura
                </Text>
                <Text style={styles.pillChangeText}>Change ▾</Text>
              </Pressable>
            </View>
          )}

          {/* Frictionless rounded input box with placeholder "How was your day?" */}
          <View style={[styles.inputBox, isFocused && styles.inputBoxFocused]}>
            <TextInput
              style={styles.textInput}
              placeholder="How was your day?"
              placeholderTextColor={Theme.colors.textMuted}
              multiline
              value={text}
              onChangeText={onChangeText}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => setIsFocused(false)}
              editable={!loading}
            />

            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                (!text.trim() || loading) && styles.sendButtonDisabled,
                pressed && text.trim() && !loading && { transform: [{ scale: 0.94 }] },
              ]}
              onPress={handleSendPress}
              disabled={!text.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        /* ── 3. DAY LOGGED NOTICE ── */
        <View style={styles.loggedNotice}>
          <View style={styles.loggedRow}>
            <Ionicons name="checkmark-circle" size={22} color={Theme.colors.mint} />
            <Text style={styles.loggedText}>Day {day} Chronicle Evaluated</Text>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={Theme.colors.rose} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Evaluation Result Card ── */}
      {lastResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultBadge}>
              <Ionicons name="sparkles" size={13} color={Theme.colors.purpleDark} />
              <Text style={styles.resultBadgeText}>Day {lastResult.day} Verdict</Text>
            </View>
            {lastResult.mood && (
              <View style={styles.resultMoodPill}>
                <Image
                  source={MOOD_IMAGES[lastResult.mood as MoodType] || MOOD_IMAGES.good}
                  style={styles.resultMoodIcon}
                  contentFit="contain"
                />
                <Text style={styles.resultMoodText}>
                  {lastResult.mood.charAt(0).toUpperCase() + lastResult.mood.slice(1)}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.summaryText}>"{lastResult.summary}"</Text>

          {/* 4 Core Pillar Scores Grid */}
          <View style={styles.scoresGrid}>
            {(['health', 'intelligence', 'mental_health', 'strength'] as StatName[]).map((stat) => {
              const score = lastResult.scores[stat] ?? 0;
              const xpChange = lastResult.xpChanges[stat] ?? 0;
              const isPositive = score >= 0;
              const meta = STAT_LABELS[stat];

              return (
                <View key={stat} style={[styles.scoreChip, { backgroundColor: meta.bg }]}>
                  <View style={styles.scoreTopRow}>
                    <Image
                      source={STAT_IMAGES[stat]}
                      style={styles.scoreStatIcon}
                      contentFit="contain"
                    />
                    <Text style={[styles.scoreStatName, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.scoreNumber,
                      { color: isPositive ? Theme.colors.mintDark : Theme.colors.roseDark },
                    ]}
                  >
                    {isPositive ? `+${score}` : `${score}`}
                  </Text>
                  <Text style={styles.xpChangeText}>
                    {isPositive ? `+${xpChange}` : `${xpChange}`} XP
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Level Up Banner */}
          {lastResult.levelUps.length > 0 && (
            <View style={styles.levelUpCard}>
              <Ionicons name="trophy" size={20} color={Theme.colors.goldDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.levelUpTitle}>Level Up Achieved!</Text>
                {lastResult.levelUps.map((lu, idx) => (
                  <Text key={idx} style={styles.levelUpDetail}>
                    🎉 {lu.stat.toUpperCase()} reached Level {lu.newLevel}!
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Advance to Next Day Button */}
          <Pressable
            style={({ pressed }) => [
              styles.nextDayButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleAdvanceDay}
          >
            <Text style={styles.nextDayButtonText}>Advance to Day {day + 1}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },

  // ── Mood Tracker (First view) ──
  moodTrackerContainer: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: 2,
  },
  moodHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  moodTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  moodSubtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  moodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  moodItemPressed: {
    transform: [{ scale: 0.93 }],
  },
  moodIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIconSelected: {
    transform: [{ scale: 1.15 }],
  },
  bigMoodIcon: {
    width: 62,
    height: 62,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  moodLabelSelected: {
    fontWeight: '900',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },

  // ── Input Section (Swapped view) ──
  inputSection: {
    gap: 8,
  },
  selectedMoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
  selectedMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radii.full,
    borderCurve: 'continuous',
    ...Theme.shadows.subtle,
  },
  pillMoodIcon: {
    width: 20,
    height: 20,
  },
  pillMoodText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  pillChangeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Theme.colors.purple,
    marginLeft: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Theme.shadows.card,
  },
  inputBoxFocused: {
    borderColor: Theme.colors.purple,
  },
  textInput: {
    flex: 1,
    fontSize: 15.5,
    color: Theme.colors.textPrimary,
    maxHeight: 120,
    minHeight: 46,
    lineHeight: 22,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.dockBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    ...Theme.shadows.subtle,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },

  // ── Logged Notice ──
  loggedNotice: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.lg,
    borderCurve: 'continuous',
    padding: 16,
    alignItems: 'center',
    ...Theme.shadows.subtle,
  },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loggedText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.colors.roseLight,
    padding: 12,
    borderRadius: Theme.radii.md,
    borderCurve: 'continuous',
  },
  errorText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Theme.colors.roseDark,
    flex: 1,
  },

  // ── Result Card ──
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    borderCurve: 'continuous',
    padding: 20,
    ...Theme.shadows.card,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.purpleLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radii.full,
    borderCurve: 'continuous',
  },
  resultBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Theme.colors.purpleDark,
  },
  resultMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.backgroundSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
    borderCurve: 'continuous',
  },
  resultMoodIcon: {
    width: 14,
    height: 14,
  },
  resultMoodText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    lineHeight: 21,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  scoresGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  scoreChip: {
    flex: 1,
    borderRadius: Theme.radii.md,
    borderCurve: 'continuous',
    padding: 10,
    alignItems: 'center',
  },
  scoreTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  scoreStatIcon: {
    width: 13,
    height: 13,
  },
  scoreStatName: {
    fontSize: 10,
    fontWeight: '800',
  },
  scoreNumber: {
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  xpChangeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  levelUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Theme.colors.goldLight,
    borderRadius: Theme.radii.lg,
    borderCurve: 'continuous',
    padding: 14,
    marginBottom: 16,
  },
  levelUpTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: Theme.colors.goldDark,
  },
  levelUpDetail: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  nextDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.purple,
    borderRadius: Theme.radii.lg,
    borderCurve: 'continuous',
    paddingVertical: 15,
    ...Theme.shadows.card,
  },
  nextDayButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
