import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  { id: 'progress', iconActive: 'stats-chart', iconInactive: 'stats-chart-outline' },
  { id: 'chronicles', iconActive: 'book', iconInactive: 'book-outline' },
  { id: 'hero', iconActive: 'shield-checkmark', iconInactive: 'shield-outline' },
];

export const FloatingDock: React.FC<FloatingDockProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const handleTabPress = (tabId: TabType) => {
    if (currentTab !== tabId) {
      Haptics.selectionAsync();
      onSelectTab(tabId);
    }
  };

  return (
    <View style={styles.dockWrapper} pointerEvents="box-none">
      <View style={styles.dockContainer}>
        {DOCK_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.dockItem,
                isActive && styles.dockItemActive,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
              onPress={() => handleTabPress(item.id)}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.iconInactive}
                size={22}
                color={isActive ? Theme.colors.dockIconActive : Theme.colors.dockIconInactive}
              />
              {isActive && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 22,
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
    borderCurve: 'continuous',
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 8,
    ...Theme.shadows.float,
  },
  dockItem: {
    width: 50,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.radii.full,
    borderCurve: 'continuous',
    position: 'relative',
  },
  dockItemActive: {
    backgroundColor: Theme.colors.dockPillActive,
  },
  activeDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.purple,
  },
});
