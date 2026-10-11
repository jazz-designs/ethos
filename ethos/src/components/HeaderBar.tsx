import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme';

interface HeaderBarProps {
  day: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ day }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hello, Hero 👋</Text>

      <View style={styles.dayBadge}>
        <Text style={styles.dayFire}>🔥</Text>
        <Text style={styles.dayText}>Day {day}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.orangeLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    borderColor: '#FFE0CF',
  },
  dayFire: {
    fontSize: 14,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.orangeDark,
  },
});
