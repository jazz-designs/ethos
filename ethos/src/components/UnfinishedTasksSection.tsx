import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from '../types';

interface UnfinishedTasksSectionProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onPressSeeAll?: () => void;
}

export const UnfinishedTasksSection: React.FC<UnfinishedTasksSectionProps> = ({
  tasks,
  onToggleTask,
  onPressSeeAll,
}) => {
  const unfinishedTasks = tasks.filter((t) => !t.completed);
  const displayTasks = unfinishedTasks.length > 0 ? unfinishedTasks : tasks.slice(0, 4);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Unfinished Tasks</Text>
        {onPressSeeAll && (
          <Pressable onPress={onPressSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.tasksList}>
        {displayTasks.map((task) => {
          return (
            <Pressable
              key={task.id}
              style={({ pressed }) => [
                styles.taskCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => {
                onToggleTask(task.id);
              }}
            >
              {/* Checkbox Circle */}
              <View style={[styles.checkCircle, task.completed && styles.checkCircleCompleted]}>
                {task.completed && (
                  <Ionicons name="checkmark" size={16} color="#2C3036" />
                )}
              </View>

              {/* Task Text */}
              <Text
                style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleCompleted,
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F7983',
  },
  tasksList: {
    gap: 10,
  },
  taskCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#F0F2F4',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleCompleted: {
    backgroundColor: '#E9F6ED',
    borderColor: '#B8E5C7',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#424850',
    flex: 1,
  },
  taskTitleCompleted: {
    color: '#9CA3AC',
    textDecorationLine: 'line-through',
  },
});
