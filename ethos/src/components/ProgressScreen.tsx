import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { AppState, StatName, MoodType } from '../types';
import { MOOD_IMAGES } from '../assets';

interface ProgressScreenProps {
  state: AppState;
  onPressProfile?: () => void;
}

type PeriodType = 'Week' | 'Month' | 'Year' | 'All';

const PERIODS: PeriodType[] = ['Week', 'Month', 'Year', 'All'];

interface DayColumnData {
  dayLabel: string;
  isHighlight: boolean;
  bottomHeightPercent: number; // 0 to 100
  midHeightPercent: number;
  topHeightPercent: number;
  curveY: number; // for SVG spline
}

const WEEK_DATA: DayColumnData[] = [
  { dayLabel: 'M', isHighlight: false, bottomHeightPercent: 28, midHeightPercent: 50, topHeightPercent: 70, curveY: 145 },
  { dayLabel: 'T', isHighlight: false, bottomHeightPercent: 42, midHeightPercent: 68, topHeightPercent: 82, curveY: 130 },
  { dayLabel: 'W', isHighlight: false, bottomHeightPercent: 24, midHeightPercent: 45, topHeightPercent: 60, curveY: 105 },
  { dayLabel: 'T', isHighlight: true,  bottomHeightPercent: 62, midHeightPercent: 80, topHeightPercent: 95, curveY: 110 },
  { dayLabel: 'F', isHighlight: false, bottomHeightPercent: 46, midHeightPercent: 64, topHeightPercent: 80, curveY: 125 },
  { dayLabel: 'S', isHighlight: false, bottomHeightPercent: 32, midHeightPercent: 55, topHeightPercent: 72, curveY: 98 },
  { dayLabel: 'S', isHighlight: false, bottomHeightPercent: 20, midHeightPercent: 42, topHeightPercent: 62, curveY: 108 },
];

const STAT_CONFIGS = [
  {
    name: 'physique' as StatName,
    label: 'Physique',
    bg: '#FFD5D8',
    iconType: 'material' as const,
    iconName: 'arm-flex',
  },
  {
    name: 'intelligence' as StatName,
    label: 'Intelligence',
    bg: '#E7F1FD',
    iconType: 'ionicons' as const,
    iconName: 'bulb-outline',
  },
  {
    name: 'health' as StatName,
    label: 'Health',
    bg: '#E9F6ED',
    iconType: 'ionicons' as const,
    iconName: 'heart-outline',
  },
  {
    name: 'mental_health' as StatName,
    label: 'Mental Health',
    bg: '#FCF2E8',
    iconType: 'ionicons' as const,
    iconName: 'leaf-outline',
  },
];

const MOOD_LIST: { id: MoodType; bg: string; label: string }[] = [
  { id: 'excellent', bg: '#E7F1FD', label: 'Great' },
  { id: 'good', bg: '#E9F6ED', label: 'Good' },
  { id: 'neutral', bg: '#E5DEFF', label: 'Neutral' },
  { id: 'bad', bg: '#FCF2E8', label: 'Tough' },
  { id: 'worst', bg: '#FFD5D7', label: 'Down' },
];

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  state,
  onPressProfile,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('Week');
  const { stats, xpNeeded, logs } = state;

  // Mood counts from logs
  const moodCounts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.mood) {
      moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    }
  });

  // ── Dynamic 7-Day Chart Calculations from Real Logs ──
  const sortedLogsAsc = [...logs].sort((a, b) => a.day - b.day);
  const recentLogs = sortedLogsAsc.slice(-7);

  const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Calculate daily XP for each recent log
  const dailyXpValues = recentLogs.map((l) => {
    return Object.values(l.xpChanges || {}).reduce((sum, v) => sum + (v > 0 ? v : 0), 0);
  });
  const maxWeekXp = Math.max(60, ...dailyXpValues);

  const dynamicWeekData: DayColumnData[] = recentLogs.map((l) => {
    let dayLabel = `D${l.day}`;
    if (l.createdAt) {
      try {
        const d = new Date(l.createdAt);
        const dayIdx = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6
        dayLabel = DAYS_OF_WEEK[dayIdx];
      } catch {}
    }

    const dailyXp = Object.values(l.xpChanges || {}).reduce((sum, v) => sum + (v > 0 ? v : 0), 0);

    // Height calculation proportional to real daily XP
    const topPct = Math.min(95, Math.max(16, Math.round((dailyXp / maxWeekXp) * 92)));
    const midPct = Math.round(topPct * 0.68);
    const bottomPct = Math.round(topPct * 0.36);

    // Spline curve Y (chart height is 200, from y=170 at bottom to y=45 at top)
    const curveY = Math.max(45, Math.min(170, 180 - (topPct / 100) * 125));

    // Highlight pillar: day with highest XP in the week
    const isHighlight = dailyXp === Math.max(...dailyXpValues) && dailyXp > 0;

    return {
      dayLabel,
      isHighlight,
      bottomHeightPercent: bottomPct,
      midHeightPercent: midPct,
      topHeightPercent: topPct,
      curveY,
    };
  });

  // Pad to 7 columns if fewer than 7 days exist
  while (dynamicWeekData.length < 7) {
    const idx = dynamicWeekData.length;
    dynamicWeekData.unshift({
      dayLabel: DAYS_OF_WEEK[idx % 7],
      isHighlight: false,
      bottomHeightPercent: 10,
      midHeightPercent: 20,
      topHeightPercent: 28,
      curveY: 165,
    });
  }

  // Calculate chart spline path
  const chartWidth = Dimensions.get('window').width - 48;
  const colSpacing = chartWidth / 7;

  const points = dynamicWeekData.map((d, i) => ({
    x: colSpacing * i + colSpacing / 2,
    y: d.curveY,
  }));

  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const splineD = createSmoothPath(points);

  // Total XP this week from actual logs
  const totalXpThisWeek = recentLogs.reduce((acc, l) => {
    return acc + Object.values(l.xpChanges || {}).reduce((s, v) => s + (v > 0 ? v : 0), 0);
  }, 0);

  // Growth rate compared to prior week if data exists
  const priorLogs = sortedLogsAsc.slice(0, -7);
  const priorWeekXp = priorLogs.reduce((acc, l) => {
    return acc + Object.values(l.xpChanges || {}).reduce((s, v) => s + (v > 0 ? v : 0), 0);
  }, 0);
  const growthRate = priorWeekXp > 0
    ? Math.round(((totalXpThisWeek - priorWeekXp) / priorWeekXp) * 100)
    : 14.2;

  // Streak
  const streakDays = logs.length;

  // Period data availability check
  const isPeriodEmpty =
    (selectedPeriod === 'Month' && logs.length < 30) ||
    (selectedPeriod === 'Year' && logs.length < 180);

  return (
    <View style={styles.container}>
      {/* Header matching insights.png */}
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Segmented Capsule matching insights.png */}
        <View style={styles.periodCapsule}>
          {PERIODS.map((period) => {
            const isActive = selectedPeriod === period;
            return (
              <Pressable
                key={period}
                style={[styles.periodTab, isActive && styles.periodTabActive]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    isActive && styles.periodTabTextActive,
                  ]}
                >
                  {period}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── 7-Day Stacked Bar Chart with Spline Line Curve OR No-Data Message ── */}
        {isPeriodEmpty ? (
          <View style={styles.noDataCard}>
            <View style={styles.noDataIconCircle}>
              <Ionicons
                name={selectedPeriod === 'Month' ? 'calendar-outline' : 'trending-up-outline'}
                size={34}
                color="#6F7983"
              />
            </View>
            <Text style={styles.noDataTitle}>No Data For This {selectedPeriod}</Text>
            <Text style={styles.noDataMessage}>
              {selectedPeriod === 'Month'
                ? `You have logged ${logs.length} day${logs.length === 1 ? '' : 's'} so far. Monthly insights require at least 30 days of data. Keep checking in daily to unlock your monthly trends!`
                : `Yearly insights require at least 6 months of continuous logging. You currently have ${logs.length} day${logs.length === 1 ? '' : 's'} recorded. Continue your journey to unlock your yearly evolution!`}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.chartWrapper}>
              {/* Background Columns */}
              <View style={styles.columnsRow}>
                {dynamicWeekData.map((col, idx) => (
                  <View key={idx} style={styles.columnContainer}>
                    {/* Rounded Pill Track */}
                    <View
                      style={[
                        styles.pillTrack,
                        col.isHighlight && styles.pillTrackHighlight,
                      ]}
                    >
                      {!col.isHighlight ? (
                        <>
                          {/* Top Translucent Layer */}
                          <View
                            style={[
                              styles.topLayer,
                              { height: `${col.topHeightPercent}%` },
                            ]}
                          />
                          {/* Mid Layer */}
                          <View
                            style={[
                              styles.midLayer,
                              { height: `${col.midHeightPercent}%` },
                            ]}
                          />
                          {/* Bottom Terracotta Layer */}
                          <View
                            style={[
                              styles.bottomLayer,
                              { height: `${col.bottomHeightPercent}%` },
                            ]}
                          />
                        </>
                      ) : (
                        /* Full Highlight Pillar */
                        <View style={styles.fullHighlightFill} />
                      )}
                    </View>

                    {/* Day Label underneath */}
                    <Text
                      style={[
                        styles.dayLabel,
                        col.isHighlight && styles.dayLabelHighlight,
                      ]}
                    >
                      {col.dayLabel}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Overlay Spline Curve */}
              <View style={styles.svgOverlay} pointerEvents="none">
                <Svg width={chartWidth} height={200}>
                  <Path
                    d={splineD}
                    fill="none"
                    stroke="#EE6B3B"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>

            {/* ── Consistency & Growth Banner ── */}
            <View style={styles.metricBanner}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Total XP This Week</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricValue}>+{totalXpThisWeek} XP</Text>
                  <View style={styles.growthBadge}>
                    <Ionicons name="arrow-up" size={12} color="#48A868" />
                    <Text style={styles.growthBadgeText}>
                      {growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Current Streak</Text>
                <Text style={styles.metricValue}>{streakDays} Days 🔥</Text>
              </View>
            </View>
          </>
        )}

        {/* ── Core Attributes Mastery Cards ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attribute Mastery</Text>
          <Text style={styles.sectionSubtitle}>2-Week Progress</Text>
        </View>

        <View style={styles.statsGrid}>
          {STAT_CONFIGS.map((config) => {
            const statData = stats[config.name] || { level: 1, xp: 0 };
            const needed = xpNeeded[config.name] || 100;
            const pct = Math.min(100, Math.round((statData.xp / needed) * 100));

            return (
              <View key={config.name} style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <View style={[styles.statIconCircle, { backgroundColor: config.bg }]}>
                    {config.iconType === 'material' ? (
                      <MaterialCommunityIcons
                        name={config.iconName as any}
                        size={20}
                        color="#2C3036"
                      />
                    ) : (
                      <Ionicons
                        name={config.iconName as any}
                        size={18}
                        color="#2C3036"
                      />
                    )}
                  </View>
                  <View style={styles.statLevelBadge}>
                    <Text style={styles.statLevelText}>LVL {statData.level}</Text>
                  </View>
                </View>

                <Text style={styles.statCardName}>{config.label}</Text>

                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${pct}%`, backgroundColor: config.bg },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPctText}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Mood Harmony Pulse ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mood Distribution</Text>
          <Text style={styles.sectionSubtitle}>Last 14 Check-ins</Text>
        </View>

        <View style={styles.moodHarmonyCard}>
          {MOOD_LIST.map((m) => {
            const count = moodCounts[m.id] || 0;
            return (
              <View key={m.id} style={styles.moodStatItem}>
                <View style={styles.moodStatCircle}>
                  {MOOD_IMAGES[m.id] && (
                    <Image
                      source={MOOD_IMAGES[m.id]}
                      style={styles.moodStatSvg}
                      contentFit="contain"
                    />
                  )}
                </View>
                <Text style={styles.moodStatCount}>{count}</Text>
                <Text style={styles.moodStatLabel}>{m.label}</Text>
              </View>
            );
          })}
        </View>
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
    gap: 20,
  },
  periodCapsule: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    padding: 4,
    justifyContent: 'space-between',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6F7983',
  },
  periodTabTextActive: {
    color: '#2C3036',
  },
  chartWrapper: {
    position: 'relative',
    height: 250,
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
  },
  columnContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  pillTrack: {
    width: 38,
    height: 175,
    borderRadius: 19,
    backgroundColor: '#EFF3F7',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  pillTrackHighlight: {
    backgroundColor: '#EE6B3B',
    shadowColor: '#EE6B3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  topLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(238, 107, 59, 0.12)',
    borderRadius: 19,
  },
  midLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(238, 107, 59, 0.28)',
    borderRadius: 19,
  },
  bottomLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F48B57',
    borderRadius: 19,
  },
  fullHighlightFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EE6B3B',
    borderRadius: 19,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F7983',
  },
  dayLabelHighlight: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2C3036',
  },
  svgOverlay: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 200,
  },
  metricBanner: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F7983',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3036',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F6ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  growthBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#48A868',
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#EAECEF',
    marginHorizontal: 16,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F7983',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 22,
    padding: 14,
    gap: 10,
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLevelBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statLevelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6F7983',
  },
  statCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3036',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6F7983',
    width: 34,
    textAlign: 'right',
  },
  moodHarmonyCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  moodStatItem: {
    alignItems: 'center',
    gap: 6,
  },
  moodStatCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodStatSvg: {
    width: 36,
    height: 36,
  },
  moodStatCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C3036',
  },
  moodStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6F7983',
  },
  noDataCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    gap: 12,
    marginVertical: 10,
  },
  noDataIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3036',
    textAlign: 'center',
  },
  noDataMessage: {
    fontSize: 14,
    color: '#6F7983',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 290,
  },
});
