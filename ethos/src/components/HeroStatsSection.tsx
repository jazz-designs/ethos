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
      {/* ── Left Column: Way Bigger Character Image, on the left, bleeding offscreen to the left ── */}
      <View style={styles.heroColumn}>
        <View style={styles.glowCircle} />
        <Image
          source={CHARACTER_IMAGES[character]}
          style={styles.heroImage}
          contentFit="contain"
          transition={200}
        />
      </View>

      {/* ── Right Column: 4 Stats Stacked Vertically to the right of the character ── */}
      <View style={styles.statsColumn}>
        {STAT_CONFIGS.map((config) => {
          const statData = stats[config.name] || { level: 1, xp: 0 };
          const needed = xpNeeded[config.name] || 100;
          const progressPercent = Math.min(100, Math.max(0, (statData.xp / needed) * 100));

          return (
            <View key={config.name} style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: config.lightBg }]}>
                  <Image
                    source={STAT_IMAGES[config.name]}
                    style={styles.statPng}
                    contentFit="contain"
                  />
                </View>

                <View style={styles.labelContainer}>
                  <View style={styles.labelTopRow}>
                    <Text style={styles.statLabel} numberOfLines={1}>
                      {config.label}
                    </Text>
                    <Text style={styles.statLevelText}>Lv {statData.level}</Text>
                  </View>

                  {/* Progress Track */}
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

                  {/* XP fraction */}
                  <View style={styles.xpRow}>
                    <Text style={styles.xpCurrent}>
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
    paddingRight: 18,
    position: 'relative',
    overflow: 'visible',
    marginVertical: 4,
  },
  heroColumn: {
    width: '46%',
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: -25, // Bleeds offscreen to the left as requested
    zIndex: -1,
    overflow: 'visible',
  },
  glowCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(120, 104, 230, 0.08)',
  },
  heroImage: {
    width: 450,
    height: 400,
  },
  statsColumn: {
    flex: 1,
    gap: 8,
    zIndex: 2,
    maxWidth: '56%',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  statPng: {
    width: 20,
    height: 20,
  },
  labelContainer: {
    flex: 1,
  },
  labelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  statLevelText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
  },
  progressTrack: {
    height: 5,
    backgroundColor: Theme.colors.backgroundSubtle,
    borderRadius: Theme.radii.full,
    overflow: 'hidden',
    marginBottom: 3,
  },
  progressBar: {
    height: '100%',
    borderRadius: Theme.radii.full,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpCurrent: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  xpPercent: {
    fontSize: 9,
    fontWeight: '800',
  },
});
