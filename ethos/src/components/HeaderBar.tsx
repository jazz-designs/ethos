import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface HeaderBarProps {
  day?: number;
  onPressProfile?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onPressProfile }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning.';
    if (hour < 18) return 'Good Afternoon.';
    return 'Good Evening.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{getGreeting()}</Text>
        <Text style={styles.subtitle}>Ready to check in?</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.profileButton,
          pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
        ]}
        onPress={onPressProfile}
      >
        <Ionicons name="person-outline" size={20} color={Theme.colors.textPrimary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  left: {
    gap: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6F7983',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF1',
  },
});
