import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { TabType } from '../types';

interface FloatingDockProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

interface DockItem {
  id: TabType;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'home', label: 'HOME', iconName: 'home-outline', iconActive: 'home' },
  { id: 'tasks', label: 'TASKS', iconName: 'checkbox-outline', iconActive: 'checkbox' },
  { id: 'journal', label: 'JOURNAL', iconName: 'book-outline', iconActive: 'book' },
  { id: 'insights', label: 'INSIGHTS', iconName: 'bar-chart-outline', iconActive: 'bar-chart' },
];

export const FloatingDock: React.FC<FloatingDockProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const handleTabPress = (tabId: TabType) => {
    if (currentTab !== tabId) {
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
                styles.tabButton,
                isActive && styles.tabButtonActive,
                pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
              ]}
              onPress={() => handleTabPress(item.id)}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.iconName}
                size={22}
                color={isActive ? Theme.colors.dockTextActive : Theme.colors.dockTextInactive}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {item.label}
              </Text>
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
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    width: '92%',
    maxWidth: 420,
    height: 74,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    paddingVertical: 6,
    gap: 3,
  },
  tabButtonActive: {
    backgroundColor: '#F5E8E8',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#2C3036',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#6F7983',
    fontWeight: '700',
  },
});
