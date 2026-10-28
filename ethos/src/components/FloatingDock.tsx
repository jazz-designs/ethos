import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
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
  const [containerWidth, setContainerWidth] = useState(0);
  const initialIndex = DOCK_ITEMS.findIndex((d) => d.id === currentTab);
  const indexAnim = useRef(new Animated.Value(initialIndex >= 0 ? initialIndex : 0)).current;
  const fluidAnim = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  const paddingHorizontal = 12;
  const tabWidth = containerWidth > 0 ? (containerWidth - paddingHorizontal * 2) / DOCK_ITEMS.length : 0;

  useEffect(() => {
    const targetIndex = DOCK_ITEMS.findIndex((d) => d.id === currentTab);
    if (targetIndex < 0) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      indexAnim.setValue(targetIndex);
      return;
    }

    // Liquid water spring deformation
    Animated.parallel([
      Animated.spring(indexAnim, {
        toValue: targetIndex,
        damping: 14,
        stiffness: 140,
        mass: 0.75,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(fluidAnim, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(fluidAnim, {
          toValue: 0,
          damping: 8,
          stiffness: 160,
          mass: 0.6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [currentTab]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const handleTabPress = (tabId: TabType) => {
    if (currentTab !== tabId) {
      onSelectTab(tabId);
    }
  };

  const translateX = indexAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
  });

  const scaleX = fluidAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25], // Stretch like water
  });

  const scaleY = fluidAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.82], // Squash like water
  });

  return (
    <View style={styles.dockWrapper} pointerEvents="box-none">
      <View style={styles.dockContainer} onLayout={handleContainerLayout}>
        {/* Liquid Water Gliding Active Indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.liquidPill,
              {
                width: tabWidth,
                transform: [
                  { translateX },
                  { scaleX },
                  { scaleY },
                ],
              },
            ]}
          />
        )}

        {/* Tab Buttons */}
        {DOCK_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.tabButton,
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
    position: 'relative',
  },
  liquidPill: {
    position: 'absolute',
    left: 12,
    top: 8,
    bottom: 8,
    height: 58,
    backgroundColor: '#F5E8E8', // Warm peach/orange active color from design
    borderRadius: 26,
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    paddingVertical: 6,
    gap: 3,
    zIndex: 2,
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
