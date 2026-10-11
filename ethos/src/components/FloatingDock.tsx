import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { TabType } from '../types';

interface FloatingDockProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

interface DockItem {
  id: TabType;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'today', iconActive: 'home', iconInactive: 'home-outline' },
  { id: 'progress', iconActive: 'bar-chart', iconInactive: 'bar-chart-outline' },
  { id: 'chronicles', iconActive: 'book', iconInactive: 'book-outline' },
  { id: 'hero', iconActive: 'shield', iconInactive: 'shield-outline' },
];

export const FloatingDock: React.FC<FloatingDockProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.dockWrapper} pointerEvents="box-none">
      <View style={styles.dockContainer}>
        {DOCK_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <DockButton
              key={item.id}
              item={item}
              isActive={isActive}
              onPress={() => onSelectTab(item.id)}
            />
          );
        })}
      </View>
    </View>
  );
};

const DockButton: React.FC<{
  item: DockItem;
  isActive: boolean;
  onPress: () => void;
}> = ({ item, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 25,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.dockItem, isActive && styles.dockItemActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isActive ? item.iconActive : item.iconInactive}
          size={24}
          color={isActive ? Theme.colors.dockIconActive : Theme.colors.dockIconInactive}
        />
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.dockBg,
    borderRadius: Theme.radii.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Theme.shadows.float,
  },
  dockItem: {
    width: 52,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.radii.full,
    position: 'relative',
  },
  dockItemActive: {
    backgroundColor: Theme.colors.dockPillActive,
  },
  activeDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.purple,
  },
});
