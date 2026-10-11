import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

  // When day changes, reset to showing the mood tracker first
  React.useEffect(() => {
    setSwappedToInput(false);
  }, [day]);

  const handleChooseMood = (mood: MoodType) => {
    onSelectMood(mood);
    setSwappedToInput(true);
  };

  const handleSwitchToMoods = () => {
    setSwappedToInput(false);
  };

  // If day is not logged:
  // - Show ONLY the mood tracker at first (before a mood is tapped/swapped)
  // - Swapping to input box occurs once a mood is chosen
  const showMoodTrackerFirst = !dayLogged && !swappedToInput;

  return (
    <View style={styles.container}>
      {/* ── 1. MOOD TRACKER FIRST (Only mood tracker at first, Big icons, No surrounding background box) ── */}
      {showMoodTrackerFirst ? (
        <View style={styles.moodTrackerContainer}>
          <View style={styles.moodHeaderRow}>
            <Text style={styles.moodTitle}>How was your day?</Text>
            <Text style={styles.moodSubtitle}>Select your mood to chronicle your feats</Text>
          </View>

          {/* 5 Big Mood Icons with NO background surrounding each mood */}
          <View style={styles.moodsRow}>
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={styles.moodItem}
                  onPress={() => handleChooseMood(m.id)}
                  activeOpacity={0.65}
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
                </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.selectedMoodPill}
                onPress={handleSwitchToMoods}
                activeOpacity={0.7}
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
              </TouchableOpacity>
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

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!text.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={onEvaluate}
              disabled={!text.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ── 3. DAY LOGGED NOTICE ── */
        <View style={styles.loggedNotice}>
          <View style={styles.loggedRow}>
            <Ionicons name="checkmark-circle" size={20} color={Theme.colors.mint} />
            <Text style={styles.loggedText}>Day {day} Chronicle Evaluated</Text>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={Theme.colors.rose} />
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
          <TouchableOpacity
            style={styles.nextDayButton}
            onPress={onNextDay}
            activeOpacity={0.85}
          >
            <Text style={styles.nextDayButtonText}>Advance to Day {day + 1}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    gap: 12,
  },
  // ── Mood Tracker (First view) ──
  moodTrackerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  moodHeaderRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  moodTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  moodSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    marginTop: 3,
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
    paddingVertical: 4,
  },
  moodIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIconSelected: {
    transform: [{ scale: 1.12 }],
  },
  bigMoodIcon: {
    width: 66,
    height: 66,
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
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  pillMoodIcon: {
    width: 20,
    height: 20,
  },
  pillMoodText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  pillChangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.purple,
    marginLeft: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  inputBoxFocused: {
    borderColor: Theme.colors.purple,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Theme.colors.textPrimary,
    maxHeight: 120,
    minHeight: 44,
    lineHeight: 21,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.colors.dockBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    ...Theme.shadows.card,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },

  // ── Logged Notice ──
  loggedNotice: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loggedText: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.roseLight,
    padding: 10,
    borderRadius: Theme.radii.md,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.roseDark,
    flex: 1,
  },

  // ── Result Card ──
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.purpleLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.purpleDark,
  },
  resultMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.backgroundSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
  },
  resultMoodIcon: {
    width: 14,
    height: 14,
  },
  resultMoodText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  summaryText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  scoresGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  scoreChip: {
    flex: 1,
    borderRadius: Theme.radii.md,
    padding: 8,
    alignItems: 'center',
  },
  scoreTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  scoreStatIcon: {
    width: 12,
    height: 12,
  },
  scoreStatName: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  xpChangeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  levelUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Theme.colors.goldLight,
    borderRadius: Theme.radii.lg,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFE0A0',
  },
  levelUpTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Theme.colors.goldDark,
  },
  levelUpDetail: {
    fontSize: 11.5,
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
    paddingVertical: 14,
    ...Theme.shadows.card,
  },
  nextDayButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
