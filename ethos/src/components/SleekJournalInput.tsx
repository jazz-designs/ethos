import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Theme } from '../theme';
import { LogEntry, MoodType, StatName } from '../types';
import { MOOD_IMAGES } from '../assets';

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
  mode?: 'all' | 'floatingBar' | 'resultOnly';
}

const MOOD_BUTTONS: { id: MoodType; bg: string }[] = [
  { id: 'worst', bg: '#FFD5D7' },
  { id: 'bad', bg: '#FCF2E8' },
  { id: 'neutral', bg: '#E5DEFF' },
  { id: 'good', bg: '#E9F6ED' },
  { id: 'excellent', bg: '#E7F1FD' },
];

const STAT_CONFIGS: Record<StatName, { label: string; bg: string; color: string }> = {
  physique: { label: 'Physique', bg: '#FFD5D8', color: '#2C3036' },
  intelligence: { label: 'Intelligence', bg: '#E7F1FD', color: '#2C3036' },
  health: { label: 'Health', bg: '#E9F6ED', color: '#2C3036' },
  mental_health: { label: 'Mental Health', bg: '#FCF2E8', color: '#2C3036' },
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
  mode = 'all',
}) => {
  const [swappedToInput, setSwappedToInput] = useState(false);

  // When day advances, reset to mood view
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

  const handleSendPress = () => {
    if (!text.trim() || loading) return;
    onEvaluate();
  };

  const handleAdvanceDay = () => {
    onNextDay();
  };

  const showMoodTrackerFirst = !dayLogged && !swappedToInput;

  // If in floatingBar mode and day is already logged, don't show the floating bar
  if (mode === 'floatingBar' && dayLogged) {
    return null;
  }

  // If in resultOnly mode and not logged / no result, don't show anything
  if (mode === 'resultOnly' && (!dayLogged || !lastResult)) {
    return null;
  }

  return (
    <View style={[styles.wrapper, mode === 'floatingBar' && styles.floatingWrapper]}>
      {/* ── Error Banner if any ── */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#E06D6D" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── FLOATING ACTION BAR: home-1 (Moods) OR home-2 (Input Box) ── */}
      {mode !== 'resultOnly' && !dayLogged && (
        showMoodTrackerFirst ? (
          /* ── home-1.png: Floating White Pill with 5 Mood Face Buttons ── */
          <View style={styles.floatingPill}>
            {MOOD_BUTTONS.map((m) => {
              const isSelected = selectedMood === m.id;
              return (
                <Pressable
                  key={m.id}
                  style={({ pressed }) => [
                    styles.moodItem,
                    isSelected && styles.moodItemSelected,
                    pressed && { transform: [{ scale: 0.94 }], opacity: 0.88 },
                  ]}
                  onPress={() => handleChooseMood(m.id)}
                >
                  <Image
                    source={MOOD_IMAGES[m.id]}
                    style={styles.moodSvg}
                    contentFit="contain"
                  />
                </Pressable>
              );
            })}
          </View>
        ) : (
          /* ── home-2.png: Floating Input Box with + Action Button ── */
          <View style={styles.inputPill}>
            {selectedMood && (
              <Pressable
                style={({ pressed }) => [
                  styles.miniMoodPill,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleSwitchToMoods}
              >
                <Image
                  source={MOOD_IMAGES[selectedMood]}
                  style={styles.miniMoodSvg}
                  contentFit="contain"
                />
              </Pressable>
            )}

            <TextInput
              style={styles.textInput}
              placeholder="Write about your day...."
              placeholderTextColor="#6F7983"
              value={text}
              onChangeText={onChangeText}
              onFocus={onFocus}
              multiline={true}
              scrollEnabled={true}
              autoCapitalize="sentences"
            />

            <Pressable
              style={({ pressed }) => [
                styles.plusButton,
                pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] },
              ]}
              onPress={handleSendPress}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#2C3036" />
              ) : (
                <Ionicons name="add" size={26} color="#2C3036" />
              )}
            </Pressable>
          </View>
        )
      )}

      {/* ── Evaluation Result Verdict Card (Shows in resultOnly or all mode) ── */}
      {mode !== 'floatingBar' && lastResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultBadge}>
              <Ionicons name="sparkles" size={13} color="#2C3036" />
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

          {/* 2-Word / Short Phrase Verdict */}
          <View style={styles.verdictPhraseContainer}>
            <Text style={styles.verdictPhraseText}>{lastResult.summary}</Text>
          </View>

          {/* Generated Character Daily Feat Image */}
          {lastResult.imageUrl && (
            <View style={styles.activityImageWrapper}>
              <Image
                source={{ uri: lastResult.imageUrl }}
                style={styles.activityImage}
                contentFit="cover"
                transition={300}
              />
            </View>
          )}

          {/* 4 Core Pillar Scores Grid */}
          <View style={styles.scoresGrid}>
            {(['physique', 'intelligence', 'health', 'mental_health'] as StatName[]).map((stat) => {
              const score = lastResult.scores[stat] ?? 0;
              const xpChange = lastResult.xpChanges[stat] ?? 0;
              const isPositive = score >= 0;
              const meta = STAT_CONFIGS[stat];

              return (
                <View key={stat} style={[styles.scoreChip, { backgroundColor: meta.bg }]}>
                  <Text style={styles.scoreStatName}>{meta.label}</Text>
                  <Text
                    style={[
                      styles.scoreNumber,
                      { color: isPositive ? '#2C3036' : '#E06D6D' },
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

          {/* Advance to Next Day Button */}
          <Pressable
            style={({ pressed }) => [
              styles.nextDayButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleAdvanceDay}
          >
            <Text style={styles.nextDayButtonText}>Advance to Day {day + 1}</Text>
            <Ionicons name="arrow-forward" size={18} color="#2C3036" />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  floatingWrapper: {
    paddingHorizontal: 0,
    gap: 0,
    marginBottom: 8,
    width: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEB',
    borderRadius: 16,
    padding: 12,
  },
  errorText: {
    color: '#D43838',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // ── home-1.png: Floating Mood Pill ──
  floatingPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 38,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    width: '100%',
  },
  moodItem: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  moodItemSelected: {
    transform: [{ scale: 1.14 }],
  },
  moodSvg: {
    width: 50,
    height: 50,
  },

  // ── home-2.png: Floating Input Box Pill ──
  inputPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    minHeight: 58,
    maxHeight: 125,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: 10,
    width: '100%',
  },
  miniMoodPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMoodSvg: {
    width: 36,
    height: 36,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3036',
    maxHeight: 96,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingRight: 4,
    textAlignVertical: 'center',
  },
  plusButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Day Logged Notice ──
  loggedNoticePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E9F6ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  loggedNoticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3036',
  },

  // ── Verdict Result Card ──
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#F0F2F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginTop: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5E8E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2C3036',
  },
  resultMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  resultMoodIcon: {
    width: 18,
    height: 18,
  },
  resultMoodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F7983',
  },
  verdictPhraseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  verdictPhraseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6F7983',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  activityImageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    position: 'relative',
    height: 190,
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  activityBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(23, 23, 23, 0.82)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textTransform: 'capitalize',
  },
  scoresGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreChip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  scoreStatName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6F7983',
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  xpChangeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6F7983',
    fontVariant: ['tabular-nums'],
  },
  nextDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5E8E8',
    borderRadius: 20,
    paddingVertical: 14,
  },
  nextDayButtonText: {
    color: '#2C3036',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
