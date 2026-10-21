import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from '../types';
import { Theme } from '../theme';

interface TasksScreenProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string) => void;
  onPressProfile?: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onPressProfile,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim());
    setNewTaskTitle('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Pressable
          style={({ pressed }) => [
            styles.profileButton,
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
          onPress={onPressProfile}
        >
          <Ionicons name="person-outline" size={20} color="#2C3036" />
        </Pressable>
      </View>

      {/* Task List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tasks.map((task) => (
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
            <View style={[styles.checkCircle, task.completed && styles.checkCircleCompleted]}>
              {task.completed && (
                <Ionicons name="checkmark" size={18} color="#2C3036" />
              )}
            </View>
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
        ))}
      </ScrollView>

      {/* Floating Add Button matching tasks.png */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
        ]}
        onPress={() => {
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="#2C3036" />
      </Pressable>

      {/* Add Task Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 30 min morning workout"
              placeholderTextColor="#6F7983"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              onSubmitEditing={handleCreateTask}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setNewTaskTitle('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalAddBtn} onPress={handleCreateTask}>
                <Text style={styles.modalAddText}>Add Task</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.6,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 16,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EAECEF',
  },
  checkCircleCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2C3036',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3036',
    flex: 1,
  },
  taskTitleCompleted: {
    color: '#6F7983',
    textDecorationLine: 'line-through',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 110,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 24,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3036',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C3036',
    borderWidth: 1,
    borderColor: '#EAECEF',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6F7983',
  },
  modalAddBtn: {
    backgroundColor: '#2C3036',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  modalAddText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
