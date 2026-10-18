import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Theme } from '../theme';
import { AppState, StatName, MoodType } from '../types';
import { MOOD_IMAGES, STAT_IMAGES } from '../assets';

interface ProgressScreenProps {
  state: AppState;
}

const MOOD_LIST: { id: MoodType; label: string; color: string; bg: string }[] = [
  { id: 'worst', label: 'Worst', color: Theme.colors.roseDark, bg: Theme.colors.roseLight },
  { id: 'bad', label: 'Bad', color: Theme.colors.orangeDark, bg: Theme.colors.orangeLight },
  { id: 'neutral', label: 'Neutral', color: Theme.colors.purpleDark, bg: Theme.colors.purpleLight },
  { id: 'good', label: 'Good', color: Theme.colors.mintDark, bg: Theme.colors.mintLight },
  { id: 'excellent', label: 'Excellent', color: Theme.colors.goldDark, bg: Theme.colors.goldLight },
];

const STAT_CONFIG: Record<StatName, { label: string; color: string; bg: string }> = {
  health: { label: 'Health', color: Theme.colors.rose, bg: Theme.colors.roseLight },
  intelligence: { label: 'Intelligence', color: Theme.colors.purple, bg: Theme.colors.purpleLight },
  mental_health: { label: 'Mental Health', color: Theme.colors.mint, bg: Theme.colors.mintLight },
  strength: { label: 'Strength', color: Theme.colors.orange, bg: Theme.colors.orangeLight },
};

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ state }) => {
  const { characterLevel, stats, xpNeeded, logs } = state;

  const totalXp = Object.values(stats).reduce((acc, s) => acc + s.xp, 0);
  const chartDays = logs.length > 0 ? logs.slice(-7) : [];

  const moodCounts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.mood) {
      moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    }
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Attributes & Aura Analytics</Text>
        </View>
        <View style={styles.filterPill}>
          <Ionicons name="sparkles" size={14} color={Theme.colors.purpleDark} />
          <Text style={styles.filterPillText}>4 Pillars</Text>
        </View>
      </View>

      {/* Hero Metric Card */}
      <View style={styles.metricCard}>
        <View style={styles.metricTopRow}>
          <View style={styles.metricIconCircle}>
            <Ionicons name="bar-chart" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.tabToggle}>
            <Pressable style={[styles.tabToggleItem, styles.tabToggleActive]}>
              <Text style={styles.tabToggleActiveText}>Weekly</Text>
            </Pressable>
            <Pressable style={styles.tabToggleItem}>
              <Text style={styles.tabToggleText}>Lifetime</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroNumbersRow}>
          <View style={styles.heroNumberBlock}>
            <Text style={styles.heroBigNumber}>{logs.length}</Text>
            <Text style={styles.heroNumberLabel}>Days Logged</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroNumberBlock}>
            <Text style={styles.heroBigNumber}>{characterLevel}</Text>
            <Text style={styles.heroNumberLabel}>Character Lv</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroNumberBlock}>
            <Text style={styles.heroBigNumber}>{totalXp}</Text>
            <Text style={styles.heroNumberLabel}>Active XP</Text>
          </View>
        </View>

        {/* Stacked Vertical Bar Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Performance Matrix</Text>
          <View style={styles.barsRow}>
            {chartDays.length === 0 ? (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>
                  Complete your first daily chronicle to view the XP chart.
                </Text>
              </View>
            ) : (
              chartDays.map((log) => {
                const totalScore = Object.values(log.scores).reduce((a, b) => a + Math.max(0, b), 0);
                const heightPercent = Math.min(100, Math.max(15, totalScore * 4));

                return (
                  <View key={log.day} style={styles.barColumn}>
                    <Text style={styles.barTopScore}>{totalScore}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFillStacked, { height: `${heightPercent}%` }]}>
                        <View style={styles.barTopSegment} />
                        <View style={styles.barBottomSegment} />
                      </View>
                    </View>
                    <Text style={styles.barDayLabel}>Day {log.day}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>

      {/* Attribute Mastery Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attribute Mastery</Text>

        {(['health', 'intelligence', 'mental_health', 'strength'] as StatName[]).map((stat) => {
          const s = stats[stat] || { level: 1, xp: 0 };
          const needed = xpNeeded[stat] || 100;
          const pct = Math.min(100, Math.round((s.xp / needed) * 100));
          const meta = STAT_CONFIG[stat];

          return (
            <View key={stat} style={styles.masteryCard}>
              <View style={[styles.masteryIconCircle, { backgroundColor: meta.bg }]}>
                <Image
                  source={STAT_IMAGES[stat]}
                  style={styles.masterySvg}
                  contentFit="contain"
                />
              </View>

              <View style={styles.masteryContent}>
                <View style={styles.masteryTopRow}>
                  <Text style={styles.masteryTitle}>{meta.label}</Text>
                  <Text style={[styles.masteryLevel, { color: meta.color }]}>Lv {s.level}</Text>
                </View>
                <View style={styles.masteryTrack}>
                  <View style={[styles.masteryFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
                </View>
                <View style={styles.masteryBottomRow}>
                  <Text style={styles.masteryXp}>{s.xp} / {needed} XP</Text>
                  <Text style={styles.masteryPct}>{pct}% to next level</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Mood Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mood Distribution</Text>
        <View style={styles.moodGrid}>
          {MOOD_LIST.map((m) => {
            const count = moodCounts[m.id] || 0;
            return (
              <View key={m.id} style={[styles.moodStatCard, { backgroundColor: m.bg }]}>
                <Image
                  source={MOOD_IMAGES[m.id]}
                  style={styles.moodStatIcon}
                  contentFit="contain"
                />
                <Text style={[styles.moodStatCount, { color: m.color }]}>{count}</Text>
                <Text style={styles.moodStatLabel}>{m.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

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
    gap: 18,
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
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.radii.full,
    borderCurve: 'continuous',
    ...Theme.shadows.subtle,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.purpleDark,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    borderCurve: 'continuous',
    padding: 20,
    ...Theme.shadows.card,
  },
  metricTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.dockBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundSubtle,
    borderRadius: Theme.radii.full,
    padding: 4,
  },
  tabToggleItem: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Theme.radii.full,
  },
  tabToggleActive: {
    backgroundColor: '#FFFFFF',
    ...Theme.shadows.card,
  },
  tabToggleActiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  tabToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  heroNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  heroNumberBlock: {
    alignItems: 'center',
  },
  heroBigNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroNumberLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 30,
    backgroundColor: Theme.colors.borderLight,
  },
  chartContainer: {
    marginTop: 6,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    marginBottom: 14,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 4,
  },
  emptyChart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 12.5,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTopScore: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.orangeDark,
    marginBottom: 4,
  },
  barTrack: {
    width: 24,
    height: 100,
    backgroundColor: Theme.colors.backgroundSubtle,
    borderRadius: Theme.radii.full,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillStacked: {
    width: '100%',
    borderRadius: Theme.radii.full,
    overflow: 'hidden',
  },
  barTopSegment: {
    flex: 1,
    backgroundColor: Theme.colors.orange,
  },
  barBottomSegment: {
    flex: 1,
    backgroundColor: Theme.colors.purple,
  },
  barDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    marginTop: 6,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  masteryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  masteryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  masterySvg: {
    width: 28,
    height: 28,
  },
  masteryContent: {
    flex: 1,
  },
  masteryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  masteryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  masteryLevel: {
    fontSize: 13,
    fontWeight: '900',
  },
  masteryTrack: {
    height: 6,
    backgroundColor: Theme.colors.backgroundSubtle,
    borderRadius: Theme.radii.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  masteryFill: {
    height: '100%',
    borderRadius: Theme.radii.full,
  },
  masteryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  masteryXp: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  masteryPct: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '700',
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodStatCard: {
    flex: 1,
    borderRadius: Theme.radii.md,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodStatIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  moodStatCount: {
    fontSize: 16,
    fontWeight: '900',
  },
  moodStatLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
});
