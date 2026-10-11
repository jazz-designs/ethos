import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Theme } from '../theme';
import { AppState, CharacterType, StatName } from '../types';
import { CHARACTER_IMAGES, STAT_IMAGES } from '../assets';

interface HeroScreenProps {
  state: AppState;
  selectedCharacter: CharacterType;
  onSelectCharacter: (char: CharacterType) => void;
  onReset: () => void;
  apiBaseUrl: string;
}

const CHARACTERS: { id: CharacterType; name: string }[] = [
  { id: 'mage', name: 'Mage' },
  { id: 'warrior', name: 'Warrior' },
  { id: 'monk', name: 'Monk' },
  { id: 'ranger', name: 'Ranger' },
];

export const HeroScreen: React.FC<HeroScreenProps> = ({
  state,
  selectedCharacter,
  onSelectCharacter,
  onReset,
  apiBaseUrl,
}) => {
  const { characterLevel, stats, logs } = state;

  const totalXp = Object.values(stats).reduce((acc, s) => acc + s.xp, 0);

  // Dominant stat
  let dominantStat: StatName = 'intelligence';
  let highestLevel = -1;
  (['health', 'intelligence', 'mental_health', 'strength'] as StatName[]).forEach((s) => {
    if (stats[s]?.level > highestLevel) {
      highestLevel = stats[s]?.level;
      dominantStat = s;
    }
  });

  const dominantTitles: Record<StatName, string> = {
    health: 'Vitality Vanguard',
    intelligence: 'Grand Scholar',
    mental_health: 'Zen Master',
    strength: 'Iron Titan',
  };

  const achievements = [
    {
      id: 'first_step',
      icon: 'shield-checkmark',
      title: 'First Step',
      desc: 'Chronicle your first day of existence',
      unlocked: logs.length >= 1,
      color: Theme.colors.mint,
      bg: Theme.colors.mintLight,
    },
    {
      id: 'consistency',
      icon: 'flame',
      title: '3-Day Fire',
      desc: 'Log 3 full days of reflection',
      unlocked: logs.length >= 3,
      color: Theme.colors.orange,
      bg: Theme.colors.orangeLight,
    },
    {
      id: 'strength_up',
      icon: 'barbell',
      title: 'Iron Body',
      desc: 'Reach Level 2 in Strength',
      unlocked: stats.strength?.level >= 2,
      color: Theme.colors.orangeDark,
      bg: Theme.colors.orangeLight,
    },
    {
      id: 'intelligence_up',
      icon: 'bulb',
      title: 'High Mind',
      desc: 'Reach Level 2 in Intelligence',
      unlocked: stats.intelligence?.level >= 2,
      color: Theme.colors.purple,
      bg: Theme.colors.purpleLight,
    },
    {
      id: 'mental_up',
      icon: 'leaf',
      title: 'Inner Peace',
      desc: 'Reach Level 2 in Mental Health',
      unlocked: stats.mental_health?.level >= 2,
      color: Theme.colors.mintDark,
      bg: Theme.colors.mintLight,
    },
    {
      id: 'health_up',
      icon: 'heart',
      title: 'Pure Life',
      desc: 'Reach Level 2 in Health',
      unlocked: stats.health?.level >= 2,
      color: Theme.colors.rose,
      bg: Theme.colors.roseLight,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hero Profile</Text>
          <Text style={styles.subtitle}>Archetype & Feats</Text>
        </View>
        <View style={styles.levelBadge}>
          <Ionicons name="flash" size={14} color="#FFFFFF" />
          <Text style={styles.levelBadgeText}>Level {characterLevel}</Text>
        </View>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.avatarRow}>
          <View style={styles.bigAvatarCircle}>
            <Image
              source={CHARACTER_IMAGES[selectedCharacter]}
              style={styles.bigAvatarImage}
              contentFit="contain"
            />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>
              {selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)}
            </Text>
            <Text style={styles.heroSubTitle}>{dominantTitles[dominantStat]}</Text>
            <View style={styles.tagRow}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{totalXp} XP Stored</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Single-word Archetype Selector */}
        <Text style={styles.selectorTitle}>Select Hero:</Text>
        <View style={styles.avatarPickerRow}>
          {CHARACTERS.map((opt) => {
            const isSelected = selectedCharacter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.avatarChoice,
                  isSelected && styles.avatarChoiceSelected,
                ]}
                onPress={() => onSelectCharacter(opt.id)}
                activeOpacity={0.7}
              >
                <Image
                  source={CHARACTER_IMAGES[opt.id]}
                  style={styles.choiceSvg}
                  contentFit="contain"
                />
                <Text style={[styles.avatarChoiceName, isSelected && styles.avatarChoiceNameSelected]}>
                  {opt.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Feats & Badges</Text>
          <Text style={styles.sectionCounter}>
            {achievements.filter((a) => a.unlocked).length} / {achievements.length} Unlocked
          </Text>
        </View>

        <View style={styles.achievementsGrid}>
          {achievements.map((ach) => (
            <View
              key={ach.id}
              style={[
                styles.achievementCard,
                !ach.unlocked && styles.achievementCardLocked,
              ]}
            >
              <View
                style={[
                  styles.achievementIconCircle,
                  { backgroundColor: ach.unlocked ? ach.bg : Theme.colors.backgroundSubtle },
                ]}
              >
                <Ionicons
                  name={ach.unlocked ? (ach.icon as any) : 'lock-closed'}
                  size={18}
                  color={ach.unlocked ? ach.color : Theme.colors.textMuted}
                />
              </View>
              <View style={styles.achievementTextContainer}>
                <Text
                  style={[
                    styles.achievementTitle,
                    !ach.unlocked && styles.achievementTitleLocked,
                  ]}
                >
                  {ach.title}
                </Text>
                <Text style={styles.achievementDesc}>{ach.desc}</Text>
              </View>
              {ach.unlocked && (
                <Ionicons name="checkmark-circle" size={16} color={Theme.colors.mint} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* System Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        <View style={styles.systemCard}>
          <View style={styles.systemRow}>
            <View>
              <Text style={styles.systemLabel}>Endpoint</Text>
              <Text style={styles.systemValue}>{apiBaseUrl}</Text>
            </View>
            <View style={styles.connectionBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.connectionText}>Active</Text>
            </View>
          </View>

          <View style={styles.systemDivider} />

          <TouchableOpacity
            style={styles.resetButton}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color={Theme.colors.rose} />
            <Text style={styles.resetButtonText}>Reset All Data (Testing)</Text>
          </TouchableOpacity>
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
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.dockBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radii.full,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  bigAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.purple,
    overflow: 'hidden',
  },
  bigAvatarImage: {
    width: 52,
    height: 52,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  heroSubTitle: {
    fontSize: 12.5,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusPill: {
    backgroundColor: Theme.colors.backgroundSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.purpleDark,
  },
  selectorTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  avatarPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarChoice: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.backgroundSubtle,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarChoiceSelected: {
    backgroundColor: Theme.colors.purpleLight,
    borderColor: Theme.colors.purple,
  },
  choiceSvg: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  avatarChoiceName: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  avatarChoiceNameSelected: {
    color: Theme.colors.purpleDark,
    fontWeight: '800',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sectionCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  achievementsGrid: {
    gap: 8,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  achievementCardLocked: {
    opacity: 0.55,
    backgroundColor: '#FAF8F3',
  },
  achievementIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  achievementTitleLocked: {
    color: Theme.colors.textMuted,
  },
  achievementDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  systemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  systemValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.mintLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radii.full,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.mint,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.mintDark,
  },
  systemDivider: {
    height: 1,
    backgroundColor: Theme.colors.borderLight,
    marginVertical: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  resetButtonText: {
    color: Theme.colors.rose,
    fontSize: 13,
    fontWeight: '800',
  },
});
