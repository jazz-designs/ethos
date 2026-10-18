import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Share,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { AppState, CharacterType, StatName } from '../types';
import { CHARACTER_IMAGES } from '../assets';
import { createBackupJson, restoreBackupJson } from '../storage';

interface HeroScreenProps {
  state: AppState;
  selectedCharacter: CharacterType;
  onSelectCharacter: (char: CharacterType) => void;
  onReset: () => void;
  apiBaseUrl: string;
  onImportState: (newState: AppState) => void;
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
  onImportState,
}) => {
  const { characterLevel, stats, logs } = state;

  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

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

  // ── Export Handlers ──────────────────────────────────────────────────
  const handleExportShare = async () => {
    try {
      const json = createBackupJson(state);
      await Share.share({
        title: `Ethos_Backup_Day${state.currentDay}.json`,
        message: json,
      });
    } catch (err: any) {
      Alert.alert('Export Notice', err.message || 'Could not trigger share sheet.');
    }
  };

  const handleExportCopy = async () => {
    try {
      const json = createBackupJson(state);
      await Clipboard.setStringAsync(json);
      Alert.alert(
        'Backup Copied to Clipboard',
        'Your entire journal archive, levels, and stats have been copied. Save this text in your Notes or send it to yourself for backup.'
      );
    } catch (err: any) {
      Alert.alert('Copy Error', err.message || 'Could not copy to clipboard.');
    }
  };

  // ── Import Handlers ──────────────────────────────────────────────────
  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await Clipboard.getStringAsync();
      if (!clipText || !clipText.trim()) {
        setImportError('Clipboard is empty. Please copy your backup JSON first.');
        return;
      }
      setImportText(clipText.trim());
      setImportError(null);
    } catch {
      setImportError('Could not read from clipboard.');
    }
  };

  const handleExecuteRestore = async () => {
    if (!importText.trim()) {
      setImportError('Please paste your backup JSON above.');
      return;
    }

    try {
      const restored = await restoreBackupJson(importText);
      onImportState(restored);
      setIsImportModalVisible(false);
      setImportText('');
      setImportError(null);
      Alert.alert(
        'Restore Complete! 🛡️',
        `Successfully restored Day ${restored.currentDay} with ${restored.logs.length} journal entries and Level ${restored.characterLevel} stats.`
      );
    } catch (err: any) {
      setImportError(err.message || 'Failed to restore backup.');
    }
  };

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

        {/* Archetype Selector */}
        <Text style={styles.selectorTitle}>Select Hero:</Text>
        <View style={styles.avatarPickerRow}>
          {CHARACTERS.map((opt) => {
            const isSelected = selectedCharacter === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  styles.avatarChoice,
                  isSelected && styles.avatarChoiceSelected,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelectCharacter(opt.id);
                }}
              >
                <Image
                  source={CHARACTER_IMAGES[opt.id]}
                  style={styles.choiceSvg}
                  contentFit="contain"
                />
                <Text style={[styles.avatarChoiceName, isSelected && styles.avatarChoiceNameSelected]}>
                  {opt.name}
                </Text>
              </Pressable>
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

      {/* ── App Data & Backup Section ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App Data & Backup</Text>
          <View style={styles.localStorageBadge}>
            <Ionicons name="shield-checkmark" size={12} color={Theme.colors.mintDark} />
            <Text style={styles.localStorageBadgeText}>Phone Storage</Text>
          </View>
        </View>

        <View style={styles.backupCard}>
          <Text style={styles.backupDesc}>
            Your daily journals, stats, and XP calculations stay privately on your phone as app data. Export a backup before uninstalling or switching devices to preserve your journey.
          </Text>

          <View style={styles.backupActionsRow}>
            {/* Export / Share Button */}
            <TouchableOpacity
              style={styles.exportShareButton}
              onPress={handleExportShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
              <Text style={styles.exportShareButtonText}>Share Backup</Text>
            </TouchableOpacity>

            {/* Copy JSON Button */}
            <TouchableOpacity
              style={styles.exportCopyButton}
              onPress={handleExportCopy}
              activeOpacity={0.8}
            >
              <Ionicons name="copy-outline" size={16} color={Theme.colors.purpleDark} />
              <Text style={styles.exportCopyButtonText}>Copy JSON</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.systemDivider} />

          {/* Import / Restore Button */}
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => {
              setImportText('');
              setImportError(null);
              setIsImportModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={17} color={Theme.colors.textPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.importButtonTitle}>Import / Restore Data</Text>
              <Text style={styles.importButtonSub}>Restore your journey from backup text</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* System Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        <View style={styles.systemCard}>
          <View style={styles.systemRow}>
            <View>
              <Text style={styles.systemLabel}>Evaluator Endpoint</Text>
              <Text style={styles.systemValue}>{apiBaseUrl}</Text>
            </View>
            <View style={styles.connectionBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.connectionText}>Ready</Text>
            </View>
          </View>

          <View style={styles.systemDivider} />

          <TouchableOpacity
            style={styles.resetButton}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color={Theme.colors.rose} />
            <Text style={styles.resetButtonText}>Reset All Local Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 110 }} />

      {/* ── Restore Data Modal ── */}
      <Modal
        visible={isImportModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsImportModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Restore Data</Text>
                <Text style={styles.modalSubtitle}>Paste your exported Ethos JSON backup</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setIsImportModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Paste from Clipboard */}
            <TouchableOpacity
              style={styles.quickPasteButton}
              onPress={handlePasteFromClipboard}
              activeOpacity={0.8}
            >
              <Ionicons name="clipboard-outline" size={16} color={Theme.colors.purpleDark} />
              <Text style={styles.quickPasteText}>Paste from Clipboard</Text>
            </TouchableOpacity>

            {/* Text Input for JSON */}
            <TextInput
              style={styles.modalTextInput}
              placeholder="Paste backup JSON here..."
              placeholderTextColor={Theme.colors.textMuted}
              value={importText}
              onChangeText={(val) => {
                setImportText(val);
                if (importError) setImportError(null);
              }}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
            />

            {importError && (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={16} color={Theme.colors.rose} />
                <Text style={styles.modalErrorText}>{importError}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsImportModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalRestoreButton,
                  !importText.trim() && styles.modalRestoreButtonDisabled,
                ]}
                onPress={handleExecuteRestore}
                disabled={!importText.trim()}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-done" size={17} color="#FFFFFF" />
                <Text style={styles.modalRestoreText}>Restore Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderCurve: 'continuous',
    padding: 18,
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
    borderCurve: 'continuous',
    padding: 12,
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
  localStorageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.mintLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
  },
  localStorageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.mintDark,
  },
  backupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
    gap: 12,
  },
  backupDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  backupActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportShareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.purple,
    paddingVertical: 12,
    borderRadius: Theme.radii.md,
    ...Theme.shadows.card,
  },
  exportShareButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  exportCopyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.purpleLight,
    paddingVertical: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.purple,
  },
  exportCopyButtonText: {
    color: Theme.colors.purpleDark,
    fontSize: 13,
    fontWeight: '800',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Theme.colors.backgroundSubtle,
    padding: 12,
    borderRadius: Theme.radii.md,
  },
  importButtonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  importButtonSub: {
    fontSize: 11,
    color: Theme.colors.textMuted,
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
    marginVertical: 4,
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

  // ── Restore Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Theme.radii.xl,
    borderTopRightRadius: Theme.radii.xl,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
    ...Theme.shadows.card,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Theme.colors.purpleLight,
    paddingVertical: 8,
    borderRadius: Theme.radii.full,
  },
  quickPasteText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.purpleDark,
  },
  modalTextInput: {
    backgroundColor: Theme.colors.backgroundSubtle,
    borderRadius: Theme.radii.md,
    padding: 12,
    height: 140,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.roseLight,
    padding: 10,
    borderRadius: Theme.radii.md,
  },
  modalErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.roseDark,
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.backgroundSubtle,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  modalRestoreButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.dockBg,
    paddingVertical: 12,
    borderRadius: Theme.radii.lg,
    ...Theme.shadows.card,
  },
  modalRestoreButtonDisabled: {
    opacity: 0.4,
  },
  modalRestoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
