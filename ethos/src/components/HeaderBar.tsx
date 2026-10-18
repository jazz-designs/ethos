import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface HeaderBarProps {
  day: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ day }) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={13} color={Theme.colors.orangeDark} />
          <Text style={styles.streakText}>DAY {day} ODYSSEY</Text>
        </View>
        <Text style={styles.title}>Ethos</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.activeAuraPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.activeAuraText}>Live</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xs,
    paddingBottom: Theme.spacing.sm,
  },
  left: {
    gap: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.orangeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
  },
  streakText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Theme.colors.orangeDark,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.8,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeAuraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radii.full,
    borderCurve: 'continuous',
    ...Theme.shadows.subtle,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Theme.colors.mint,
  },
  activeAuraText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
});
