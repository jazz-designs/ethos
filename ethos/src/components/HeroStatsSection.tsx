import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { CharacterType, StatData, StatName } from '../types';
import { CHARACTER_IMAGES, CHARACTER_INFO } from '../assets';

interface HeroStatsSectionProps {
  character: CharacterType;
  stats: Record<StatName, StatData>;
  xpNeeded: Record<StatName, number>;
  dailyImageUrl?: string | null;
  dailyActivityScene?: string | null;
  xpDeltas?: Record<StatName, number>;
}

interface StatConfig {
  name: StatName;
  label: string;
  fillColor: string;
  iconType: 'material' | 'ionicons';
  iconName: string;
}

const STAT_CONFIGS: StatConfig[] = [
  {
    name: 'physique',
    label: 'physique',
    fillColor: '#FFD5D8',
    iconType: 'material',
    iconName: 'arm-flex',
  },
  {
    name: 'intelligence',
    label: 'Intelligence',
    fillColor: '#E7F1FD',
    iconType: 'ionicons',
    iconName: 'bulb-outline',
  },
  {
    name: 'health',
    label: 'Health',
    fillColor: '#E9F6ED',
    iconType: 'ionicons',
    iconName: 'heart-outline',
  },
  {
    name: 'mental_health',
    label: 'Mental Health',
    fillColor: '#FCF2E8',
    iconType: 'ionicons',
    iconName: 'leaf-outline',
  },
];

export const HeroStatsSection: React.FC<HeroStatsSectionProps> = ({
  character,
  stats,
  xpNeeded,
  dailyImageUrl,
  dailyActivityScene,
  xpDeltas,
}) => {
  const charKey = CHARACTER_IMAGES[character] ? character : 'ch_1';
  const imageSource = dailyImageUrl ? { uri: dailyImageUrl } : CHARACTER_IMAGES[charKey];

  return (
    <View style={styles.container}>
      {/* ── Left Column: Character Full Height ── */}
      <View style={styles.characterColumn}>
        <Image
          source={imageSource}
          style={styles.characterImage}
          contentFit="contain"
          transition={300}
        />
      </View>

      {/* ── Right Column: 4 Stat Pills ── */}
      <View style={styles.statsColumn}>
        {STAT_CONFIGS.map((config) => {
          const statData = stats[config.name] || { level: 1, xp: 0 };
          const needed = xpNeeded[config.name] || 100;
          const actualPercent = Math.min(100, Math.max(0, Math.round((statData.xp / needed) * 100)));
          const fillWidthPercent = actualPercent > 0 ? Math.max(14, actualPercent) : 0;
          const delta = xpDeltas?.[config.name];

          return (
            <View key={config.name} style={styles.pillContainer}>
              {/* Progress Fill Background */}
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${fillWidthPercent}%`,
                    backgroundColor: config.fillColor,
                  },
                ]}
              />

              {/* Pill Content Overlay */}
              <View style={styles.pillContent}>
                <View style={styles.leftPillGroup}>
                  {/* White Icon Circle */}
                  <View style={styles.iconCircle}>
                    {config.iconType === 'material' ? (
                      <MaterialCommunityIcons
                        name={config.iconName as any}
                        size={22}
                        color="#6F7983"
                      />
                    ) : (
                      <Ionicons
                        name={config.iconName as any}
                        size={20}
                        color="#6F7983"
                      />
                    )}
                  </View>

                  {/* Stat Title & Percentage */}
                  <View style={styles.textGroup}>
                    <Text style={styles.statLabel} numberOfLines={1}>
                      {config.label}
                    </Text>
                    <View style={styles.percentRow}>
                      <Text style={styles.percentText}>
                        {statData.xp} xp
                      </Text>
                      {delta !== undefined && delta !== 0 && (
                        <Text
                          style={[
                            styles.deltaText,
                            { color: delta > 0 ? '#48A868' : '#E06D6D' },
                          ]}
                        >
                          {delta > 0 ? `+${delta}` : `${delta}`}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Level Text */}
                <Text style={styles.levelText}>LVL {statData.level}</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  characterColumn: {
    width: '35%',
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  characterImage: {
    width: '140%',
    height: '140%',
  },
  statsColumn: {
    flex: 1,
    height: 300,
    justifyContent: 'space-between',
    gap: 10,
  },
  pillContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F2F4',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 6,
    paddingRight: 16,
    zIndex: 2,
  },
  leftPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  textGroup: {
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6F7983',
    marginBottom: 2,
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#2C3036',
    fontVariant: ['tabular-nums'],
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  levelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6F7983',
    letterSpacing: 0.4,
  },
});
