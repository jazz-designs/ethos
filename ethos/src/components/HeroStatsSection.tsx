import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Theme } from '../theme';
import { CharacterType, StatData, StatName } from '../types';
import { CHARACTER_IMAGES, STAT_IMAGES } from '../assets';

interface HeroStatsSectionProps {
  character: CharacterType;
  stats: Record<StatName, StatData>;
  xpNeeded: Record<StatName, number>;
}

interface StatConfig {
  name: StatName;
  label: string;
  color: string;
  lightBg: string;
  darkColor: string;
}

const STAT_CONFIGS: StatConfig[] = [
  {
    name: 'health',
    label: 'Health',
    color: Theme.colors.rose,
    lightBg: Theme.colors.roseLight,
    darkColor: Theme.colors.roseDark,
  },
  {
    name: 'intelligence',
    label: 'Intelligence',
    color: Theme.colors.purple,
    lightBg: Theme.colors.purpleLight,
    darkColor: Theme.colors.purpleDark,
  },
  {
    name: 'mental_health',
    label: 'Mental Health',
    color: Theme.colors.mint,
    lightBg: Theme.colors.mintLight,
    darkColor: Theme.colors.mintDark,
  },
  {
    name: 'strength',
    label: 'Strength',
    color: Theme.colors.orange,
    lightBg: Theme.colors.orangeLight,
    darkColor: Theme.colors.orangeDark,
  },
];

export const HeroStatsSection: React.FC<HeroStatsSectionProps> = ({
  character,
  stats,
  xpNeeded,
}) => {
  return (
    <View style={styles.container}>
      {/* ── Left: Featured Hero Stage (Character prominent and crisp) ── */}
      <View style={styles.heroColumn}>
        <View style={styles.glowAura} />
        <Image
          source={CHARACTER_IMAGES[character]}
          style={styles.heroImage}
          contentFit="contain"
          transition={250}
        />
      </View>

      {/* ── Right: 4 Core Pillars Stacked Vertically ── */}
      <View style={styles.statsColumn}>
        {STAT_CONFIGS.map((config) => {
          const statData = stats[config.name] || { level: 1, xp: 0 };
          const needed = xpNeeded[config.name] || 100;
          const progressPercent = Math.min(100, Math.max(0, (statData.xp / needed) * 100));

          return (
            <View key={config.name} style={styles.statCard}>
              <View style={styles.statRow}>
                {/* Stat Icon */}
                <View style={[styles.iconCircle, { backgroundColor: config.lightBg }]}>
                  <Image
                    source={STAT_IMAGES[config.name]}
                    style={styles.statPng}
                    contentFit="contain"
                  />
                </View>

                {/* Stat Details */}
                <View style={styles.statInfo}>
                  <View style={styles.statTopLine}>
                    <Text style={styles.statLabel} numberOfLines={1}>
                      {config.label}
                    </Text>
                    <Text style={[styles.statLevel, { color: config.darkColor }]}>
                      Lv {statData.level}
                    </Text>
                  </View>

                  {/* Progress Meter */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${progressPercent}%`,
                          backgroundColor: config.color,
                        },
                      ]}
                    />
                  </View>

                  {/* XP Numbers */}
                  <View style={styles.xpRow}>
                    <Text style={styles.xpText}>
                      {statData.xp}/{needed} XP
                    </Text>
                    <Text style={[styles.xpPercent, { color: config.darkColor }]}>
                      {Math.round(progressPercent)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.md,
  },
  heroColumn: {
    flex: 1,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(124, 110, 230, 0.09)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  statsColumn: {
    width: '54%',
    gap: 8,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.md,
    borderCurve: 'continuous',
    paddingHorizontal: 10,
    paddingVertical: 9,
    ...Theme.shadows.card,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  statPng: {
    width: 20,
    height: 20,
  },
  statInfo: {
    flex: 1,
  },
  statTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  statLevel: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    backgroundColor: Theme.colors.backgroundSubtle,
    borderRadius: Theme.radii.full,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginBottom: 3,
  },
  progressBar: {
    height: '100%',
    borderRadius: Theme.radii.full,
    borderCurve: 'continuous',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  xpPercent: {
    fontSize: 9.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
