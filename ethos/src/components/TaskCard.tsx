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
import { TaskItem } from '../types';

interface TaskCardProps {
  task: TaskItem;
  onToggle: (taskId: string) => void;
  onPressCard: (task: TaskItem) => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onPressCard,
  compact = false,
}) => {
  const [cardWidth, setCardWidth] = useState(0);

  const targetCount = task.timesPerDay || 1;
  const isMultiTime = (task.timesPerDay || 1) > 1;
  const completedCount = task.timesCompletedToday ?? (task.completed ? targetCount : 0);

  // Target progress percentage: 0..1
  let targetRatio = 0;
  if (task.completed) {
    targetRatio = 1;
  } else if (isMultiTime) {
    targetRatio = Math.min(1, Math.max(0, completedCount / targetCount));
  } else {
    targetRatio = 0;
  }

  const fillAnim = useRef(new Animated.Value(targetRatio)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: targetRatio,
      duration: 350,
      easing: Easing.bezier(0.2, 0.9, 0.3, 1), // Water-smooth fluid glide
      useNativeDriver: false,
    }).start();
  }, [targetRatio]);

  const onCardLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== cardWidth) {
      setCardWidth(w);
    }
  };

  // Interpolate to explicit pixel width using measured cardWidth so 100% covers 100% of the box
  const animatedWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, cardWidth > 0 ? cardWidth : 500],
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        compact && styles.cardCompact,
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
      ]}
      onLayout={onCardLayout}
      onPress={() => onPressCard(task)}
    >
      {/* Smooth Liquid Water Progress Fill (Fills 100% of the entire box with zero gaps) */}
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: animatedWidth,
          },
        ]}
      />

      {/* Card Content Overlay */}
      <View style={styles.cardContent}>
        {/* Checkbox Circle (Tapping toggles completion/progress, clean with checkmark only) */}
        <Pressable
          style={({ pressed }) => [
            styles.checkCircle,
            compact && styles.checkCircleCompact,
            task.completed && styles.checkCircleCompleted,
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
          hitSlop={10}
          onPress={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
        >
          {task.completed && (
            <Ionicons name="checkmark" size={compact ? 16 : 18} color="#2C3036" />
          )}
        </Pressable>

        {/* Clean Title Only */}
        <View style={styles.titleGroup}>
          <Text
            style={[
              styles.taskTitle,
              compact && styles.taskTitleCompact,
              task.completed && styles.taskTitleCompleted,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden', // Clips the fill cleanly to the card's rounded borders
    borderWidth: 1,
    borderColor: '#ECEFF1',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  cardCompact: {
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#f9eeecff', // Kept user's exact color
    zIndex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 2,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDE2E7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  checkCircleCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  checkCircleCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2C3036',
  },
  titleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3036',
    letterSpacing: -0.2,
  },
  taskTitleCompact: {
    fontSize: 15,
  },
  taskTitleCompleted: {
    color: '#9AA2AB',
    textDecorationLine: 'line-through',
  },
});
