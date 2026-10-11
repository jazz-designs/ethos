import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Theme } from '../theme';
import { LogEntry, StatName, MoodType } from '../types';
import { MOOD_IMAGES, STAT_IMAGES } from '../assets';

interface ChroniclesScreenProps {
  logs: LogEntry[];
}

const STAT_CONFIG: Record<StatName, { label: string; color: string; bg: string }> = {
  health: { label: 'Health', color: Theme.colors.roseDark, bg: Theme.colors.roseLight },
  intelligence: { label: 'Intelligence', color: Theme.colors.purpleDark, bg: Theme.colors.purpleLight },
  mental_health: { label: 'Mental Health', color: Theme.colors.mintDark, bg: Theme.colors.mintLight },
  strength: { label: 'Strength', color: Theme.colors.orangeDark, bg: Theme.colors.orangeLight },
};

const MOOD_META: Record<MoodType, { label: string; color: string; bg: string }> = {
  worst: { label: 'Worst', color: Theme.colors.roseDark, bg: Theme.colors.roseLight },
  bad: { label: 'Bad', color: Theme.colors.orangeDark, bg: Theme.colors.orangeLight },
  neutral: { label: 'Neutral', color: Theme.colors.purpleDark, bg: Theme.colors.purpleLight },
  good: { label: 'Good', color: Theme.colors.mintDark, bg: Theme.colors.mintLight },
  excellent: { label: 'Excellent', color: Theme.colors.goldDark, bg: Theme.colors.goldLight },
};

export const ChroniclesScreen: React.FC<ChroniclesScreenProps> = ({ logs }) => {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chronicles</Text>
          <Text style={styles.subtitle}>Daily Feats & Journey Log</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{logs.length} Days</Text>
        </View>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📜</Text>
          <Text style={styles.emptyTitle}>The Archives Are Silent</Text>
          <Text style={styles.emptyText}>
            Log your day on the Today tab to begin your permanent record.
          </Text>
        </View>
      ) : (
        <View style={styles.logList}>
          {sortedLogs.map((log) => {
            const isExpanded = expandedDays.has(log.day);
            const moodKey = (log.mood as MoodType) || 'good';
            const moodMeta = MOOD_META[moodKey] || MOOD_META.good;

            return (
              <TouchableOpacity
                key={log.day}
                style={styles.logCard}
                onPress={() => toggleDay(log.day)}
                activeOpacity={0.85}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>Day {log.day}</Text>
                  </View>

                  {log.mood && MOOD_IMAGES[moodKey] && (
                    <View style={[styles.moodPill, { backgroundColor: moodMeta.bg }]}>
                      <Image
                        source={MOOD_IMAGES[moodKey]}
                        style={styles.moodIcon}
                        contentFit="contain"
                      />
                      <Text style={[styles.moodText, { color: moodMeta.color }]}>
                        {moodMeta.label}
                      </Text>
                    </View>
                  )}

                  <View style={styles.expandIcon}>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Theme.colors.textMuted}
                    />
                  </View>
                </View>

                {/* Summary */}
                <Text style={styles.summaryText} numberOfLines={isExpanded ? undefined : 2}>
                  "{log.summary}"
                </Text>

                {/* Scores Row */}
                <View style={styles.scoresRow}>
                  {(['health', 'intelligence', 'mental_health', 'strength'] as StatName[]).map((stat) => {
                    const score = log.scores[stat] ?? 0;
                    const isPositive = score >= 0;
                    const meta = STAT_CONFIG[stat];

                    return (
                      <View key={stat} style={[styles.scoreChip, { backgroundColor: meta.bg }]}>
                        <Image
                          source={STAT_IMAGES[stat]}
                          style={styles.chipStatIcon}
                          contentFit="contain"
                        />
                        <Text
                          style={[
                            styles.chipScore,
                            { color: isPositive ? Theme.colors.mintDark : Theme.colors.roseDark },
                          ]}
                        >
                          {isPositive ? `+${score}` : score}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />

                    <Text style={styles.sectionLabel}>Your Entry:</Text>
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteText}>{log.text}</Text>
                    </View>

                    <Text style={styles.sectionLabel}>XP Impact:</Text>
                    <View style={styles.xpGrid}>
                      {(['health', 'intelligence', 'mental_health', 'strength'] as StatName[]).map((stat) => {
                        const xpChange = log.xpChanges[stat] ?? 0;
                        const isPos = xpChange >= 0;
                        const meta = STAT_CONFIG[stat];

                        return (
                          <View key={stat} style={styles.xpCard}>
                            <Text style={styles.xpCardLabel}>{meta.label}</Text>
                            <Text
                              style={[
                                styles.xpCardValue,
                                { color: isPos ? Theme.colors.mintDark : Theme.colors.roseDark },
                              ]}
                            >
                              {isPos ? `+${xpChange}` : xpChange} XP
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {log.levelUps.length > 0 && (
                      <View style={styles.levelUpNotice}>
                        <Ionicons name="trophy" size={16} color={Theme.colors.goldDark} />
                        <View style={{ flex: 1 }}>
                          {log.levelUps.map((lu, idx) => (
                            <Text key={idx} style={styles.levelUpText}>
                              🎉 {lu.stat.toUpperCase()} reached Level {lu.newLevel}!
                            </Text>
                          ))}
                        </View>
                      </View>
                    )}

                    <Text style={styles.timestampText}>
                      {new Date(log.createdAt).toLocaleDateString()} at{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={{ height: 110 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.purpleDark,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  logList: {
    gap: 12,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dayBadge: {
    backgroundColor: Theme.colors.purpleLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Theme.radii.full,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: Theme.colors.purpleDark,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
  },
  moodIcon: {
    width: 14,
    height: 14,
  },
  moodText: {
    fontSize: 11,
    fontWeight: '800',
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  summaryText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
  },
  chipStatIcon: {
    width: 12,
    height: 12,
  },
  chipScore: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.borderLight,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  quoteBox: {
    backgroundColor: Theme.colors.backgroundSubtle,
    borderRadius: Theme.radii.md,
    padding: 12,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 13,
    color: Theme.colors.textPrimary,
    lineHeight: 20,
  },
  xpGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  xpCard: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundInput,
    borderRadius: Theme.radii.sm,
    padding: 8,
    alignItems: 'center',
  },
  xpCardLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  xpCardValue: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  levelUpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.colors.goldLight,
    borderRadius: Theme.radii.md,
    padding: 10,
    marginBottom: 12,
  },
  levelUpText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.goldDark,
  },
  timestampText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textAlign: 'right',
  },
});
