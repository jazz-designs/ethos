import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LogEntry, StatName, MoodType } from '../types';
import { MOOD_IMAGES, ACTIVITY_IMAGES } from '../assets';

interface ChroniclesScreenProps {
  logs: LogEntry[];
  onPressProfile?: () => void;
}

const MOOD_COLORS: Record<MoodType, string> = {
  worst: '#FFD5D7',
  bad: '#FCF2E8',
  neutral: '#E5DEFF',
  good: '#E9F6ED',
  excellent: '#E7F1FD',
};

const STAT_CONFIG: Record<StatName, { label: string; color: string; bg: string }> = {
  physique: { label: 'Physique', color: '#6F7983', bg: '#FFD5D8' },
  intelligence: { label: 'Intelligence', color: '#6F7983', bg: '#E7F1FD' },
  health: { label: 'Health', color: '#6F7983', bg: '#E9F6ED' },
  mental_health: { label: 'Mental Health', color: '#6F7983', bg: '#FCF2E8' },
};

export const ChroniclesScreen: React.FC<ChroniclesScreenProps> = ({
  logs,
  onPressProfile,
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const sortedLogs = [...logs].sort((a, b) => b.day - a.day);

  // Helper to get formatted day number and month
  const getDateInfo = (log: LogEntry, index: number) => {
    if (log.createdAt) {
      try {
        const d = new Date(log.createdAt);
        if (!isNaN(d.getTime())) {
          const dayNum = d.getDate();
          const monthStr = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
          return { dayNum, monthStr };
        }
      } catch {}
    }
    // Fallback: calculate from day
    const dayNum = Math.max(1, 10 - index > 0 ? 10 - index : log.day);
    return { dayNum, monthStr: 'JAN' };
  };

  // Helper to get caption as a clean 2-word phrase
  const getCaption = (log: LogEntry) => {
    if (log.summary && log.summary.includes('•')) {
      return log.summary.trim();
    }
    if (log.summary) {
      if (log.summary.length <= 25) return log.summary.trim();
      const words = log.summary.replace(/[.,!?;]/g, '').split(/\s+/).slice(0, 2);
      return words.join(' • ');
    }
    if (log.activityScene) {
      const words = log.activityScene.replace(/character\s+/i, '').split(/\s+/).slice(0, 2);
      return words.join(' • ');
    }
    return 'Board • Worked out';
  };

  // Helper to get image source
  const getImageSource = (log: LogEntry, index: number) => {
    if (log.imageUrl) {
      if (typeof log.imageUrl === 'string') {
        return { uri: log.imageUrl };
      }
      return log.imageUrl;
    }
    // Fallback cycling through the 4 user images
    const fallbackImgs = [
      ACTIVITY_IMAGES.workout,
      ACTIVITY_IMAGES.dance,
      ACTIVITY_IMAGES.couch,
      ACTIVITY_IMAGES.first,
    ];
    return fallbackImgs[index % fallbackImgs.length];
  };

  return (
    <View style={styles.container}>
      {/* Header matching journal.png */}
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Pressable
          style={({ pressed }) => [
            styles.profileButton,
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
          onPress={onPressProfile}
        >
          <Ionicons name="person-outline" size={20} color="#2C3036" />
        </Pressable>
      </View>

      {/* Journal Timeline Stream */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={44} color="#6F7983" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Your Journal is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Check in with your mood and log your day to start your story.
            </Text>
          </View>
        ) : (
          sortedLogs.map((log, index) => {
            const { dayNum, monthStr } = getDateInfo(log, index);
            const moodKey = (log.mood as MoodType) || 'good';
            const isExpanded = expandedDays.has(log.day);
            const imageSource = getImageSource(log, index);
            const caption = getCaption(log);
            // Alternate tilt: even index tilts left (-3.5deg), odd index tilts right (+3.5deg)
            const rotationDegree = index % 2 === 0 ? '-3.5deg' : '3.5deg';

            return (
              <Pressable
                key={log.day}
                style={({ pressed }) => [
                  styles.entryCard,
                  pressed && { opacity: 0.95, transform: [{ scale: 0.995 }] },
                ]}
                onPress={() => toggleDay(log.day)}
              >
                {/* ── Left Column: Day Num, Month, and pure Mood SVG at bottom ── */}
                <View style={styles.leftCol}>
                  <View style={styles.dateTopGroup}>
                    <Text style={styles.dayNumText}>{dayNum}</Text>
                    <Text style={styles.monthText}>{monthStr}</Text>
                  </View>

                  {/* Pure mood emoji - NO background circle */}
                  <View style={styles.moodBottomWrapper}>
                    {MOOD_IMAGES[moodKey] && (
                      <Image
                        source={MOOD_IMAGES[moodKey]}
                        style={styles.leftColMoodSvg}
                        contentFit="contain"
                      />
                    )}
                  </View>
                </View>

                {/* ── Vertical Divider Line ── */}
                <View style={styles.verticalDivider} />

                {/* ── Right Section: Tilted Top-Cropped Card & 2-Word Phrase ── */}
                <View style={styles.rightSection}>
                  {/* Top: Tilted Card cropped to the top part */}
                  <View style={styles.tiltedCardContainer}>
                    <View
                      style={[
                        styles.tiltedCard,
                        { transform: [{ rotate: rotationDegree }] },
                      ]}
                    >
                      <Image
                        source={imageSource}
                        style={styles.tiltedImage}
                        contentFit="cover"
                        contentPosition="top"
                        transition={200}
                      />
                    </View>
                  </View>

                  {/* Horizontal Divider Line */}
                  <View style={styles.horizontalDivider} />

                  {/* Bottom: Centered 2-Word Phrase (e.g. "Board • Worked out") */}
                  <View style={styles.captionContainer}>
                    <Text style={styles.captionText} numberOfLines={1}>
                      {caption}
                    </Text>
                  </View>

                  {/* Optional Expanded Drawer on click: Scores Breakdown */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.horizontalDivider} />
                      <Text style={styles.expandedEntryText}>"{log.text}"</Text>

                      <View style={styles.scoresRow}>
                        {(['physique', 'intelligence', 'health', 'mental_health'] as StatName[]).map(
                          (stat) => {
                            const score = log.scores[stat] ?? 0;
                            const isPositive = score >= 0;
                            const meta = STAT_CONFIG[stat];

                            return (
                              <View
                                key={stat}
                                style={[styles.scoreChip, { backgroundColor: meta.bg }]}
                              >
                                <Text style={styles.scoreChipLabel}>{meta.label}</Text>
                                <Text
                                  style={[
                                    styles.scoreChipVal,
                                    { color: isPositive ? '#48A868' : '#E06D6D' },
                                  ]}
                                >
                                  {isPositive ? `+${score}` : `${score}`}
                                </Text>
                              </View>
                            );
                          }
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.6,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3036',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6F7983',
    textAlign: 'center',
    lineHeight: 20,
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  leftCol: {
    width: 68,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTopGroup: {
    alignItems: 'center',
    gap: 2,
  },
  dayNumText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6F7983',
    letterSpacing: 0.8,
  },
  moodBottomWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftColMoodSvg: {
    width: 38,
    height: 38,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#ECEFF1',
  },
  rightSection: {
    flex: 1,
  },
  tiltedCardContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tiltedCard: {
    width: '88%',
    height: 160,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tiltedImage: {
    width: '100%',
    height: '100%',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#ECEFF1',
    width: '100%',
  },
  captionContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#6F7983',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  expandedContent: {
    padding: 14,
    gap: 12,
    backgroundColor: '#FAFBFC',
  },
  expandedEntryText: {
    fontSize: 13.5,
    fontStyle: 'italic',
    color: '#2C3036',
    lineHeight: 19,
  },
  scoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scoreChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C3036',
  },
  scoreChipVal: {
    fontSize: 12,
    fontWeight: '800',
  },
});
