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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CreateTaskInput, StatName, TaskItem } from '../types';
import { TaskCard } from './TaskCard';
import { LiquidGlassSlider } from './LiquidGlassSlider';

interface TasksScreenProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: CreateTaskInput) => void;
  onUpdateTask?: (taskId: string, task: CreateTaskInput) => void;
  onDeleteTask?: (taskId: string) => void;
  onPressProfile?: () => void;
}

interface StatRowConfig {
  name: StatName;
  label: string;
  fillColor: string;
  accentColor: string;
  sliderAccent: string;
  iconType: 'material' | 'ionicons';
  iconName: string;
}

const STAT_CONFIGS: StatRowConfig[] = [
  {
    name: 'physique',
    label: 'Physique',
    fillColor: '#FFD5D8',
    accentColor: '#C24050',
    sliderAccent: '#FF9EA7',
    iconType: 'material',
    iconName: 'arm-flex',
  },
  {
    name: 'intelligence',
    label: 'Intelligence',
    fillColor: '#E7F1FD',
    accentColor: '#2563EB',
    sliderAccent: '#93C5FD',
    iconType: 'ionicons',
    iconName: 'bulb-outline',
  },
  {
    name: 'health',
    label: 'Health',
    fillColor: '#E9F6ED',
    accentColor: '#16A34A',
    sliderAccent: '#86EFAC',
    iconType: 'ionicons',
    iconName: 'heart-outline',
  },
  {
    name: 'mental_health',
    label: 'Mental Health',
    fillColor: '#FCF2E8',
    accentColor: '#D97706',
    sliderAccent: '#FDBA74',
    iconType: 'ionicons',
    iconName: 'leaf-outline',
  },
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_PRESETS = ['07:00 AM', '09:00 AM', '12:00 PM', '06:00 PM', '09:00 PM'];

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onPressProfile,
}) => {
  const [filter, setFilter] = useState<'all' | 'habits' | 'tasks'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<'task' | 'habit'>('task');
  const [frequency, setFrequency] = useState<'everyday' | 'specific_days'>('everyday');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [timesPerDay, setTimesPerDay] = useState<number>(1);
  const [statRewards, setStatRewards] = useState<Partial<Record<StatName, number>>>({
    intelligence: 1,
  });

  // Reminder State
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customHour, setCustomHour] = useState('08');
  const [customMin, setCustomMin] = useState('30');
  const [customPeriod, setCustomPeriod] = useState<'AM' | 'PM'>('AM');
  const [selectedPreset, setSelectedPreset] = useState<string>('09:00 AM');

  const openCreateModal = () => {
    setEditingTaskId(null);
    setTitle('');
    setTaskType('task');
    setFrequency('everyday');
    setSelectedDays(['Mon', 'Wed', 'Fri']);
    setTimesPerDay(1);
    setStatRewards({ intelligence: 1 });
    setReminderEnabled(false);
    setIsCustomTime(false);
    setSelectedPreset('09:00 AM');
    setCustomHour('08');
    setCustomMin('30');
    setCustomPeriod('AM');
    setModalVisible(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setTaskType(task.type || 'task');
    setFrequency(task.frequency || 'everyday');
    setSelectedDays(task.daysOfWeek || ['Mon', 'Wed', 'Fri']);
    setTimesPerDay(task.timesPerDay || 1);

    const rewards = task.statRewards || (task.statReward ? { [task.statReward]: 1 } : {});
    setStatRewards(rewards);

    if (task.reminderTime) {
      setReminderEnabled(true);
      if (TIME_PRESETS.includes(task.reminderTime)) {
        setSelectedPreset(task.reminderTime);
        setIsCustomTime(false);
      } else {
        setIsCustomTime(true);
        const match = task.reminderTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          setCustomHour(match[1].padStart(2, '0'));
          setCustomMin(match[2]);
          setCustomPeriod((match[3]?.toUpperCase() as 'AM' | 'PM') || 'AM');
        }
      }
    } else {
      setReminderEnabled(false);
      setIsCustomTime(false);
      setSelectedPreset('09:00 AM');
    }

    setModalVisible(true);
  };

  const handleStatXpChange = (stat: StatName, xp: number) => {
    setStatRewards((prev) => {
      const next = { ...prev };
      if (xp <= 0) {
        delete next[stat];
      } else {
        next[stat] = Math.min(3, Math.max(0, xp));
      }
      return next;
    });
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const adjustHour = (delta: number) => {
    let h = parseInt(customHour, 10) || 12;
    h += delta;
    if (h > 12) h = 1;
    if (h < 1) h = 12;
    setCustomHour(h.toString().padStart(2, '0'));
  };

  const adjustMin = (delta: number) => {
    let m = parseInt(customMin, 10) || 0;
    m = (m + delta + 60) % 60;
    setCustomMin(m.toString().padStart(2, '0'));
  };

  const currentReminderTime = reminderEnabled
    ? isCustomTime
      ? `${customHour}:${customMin} ${customPeriod}`
      : selectedPreset
    : null;

  const totalSelectedXp = Object.values(statRewards).reduce((sum, v) => sum + (v || 0), 0);

  const handleSave = () => {
    if (!title.trim()) return;

    const rewards = Object.keys(statRewards).length > 0 ? statRewards : { health: 1 };
    const taskInput: CreateTaskInput = {
      title: title.trim(),
      type: taskType,
      statRewards: rewards,
      frequency: taskType === 'habit' ? frequency : undefined,
      daysOfWeek: taskType === 'habit' && frequency === 'specific_days' ? selectedDays : undefined,
      timesPerDay: taskType === 'habit' ? timesPerDay : 1,
      reminderTime: currentReminderTime,
      reminderEnabled,
    };

    if (editingTaskId && onUpdateTask) {
      onUpdateTask(editingTaskId, taskInput);
    } else {
      onAddTask(taskInput);
    }

    setModalVisible(false);
  };

  const handleDelete = () => {
    if (editingTaskId && onDeleteTask) {
      onDeleteTask(editingTaskId);
      setModalVisible(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'habits') return t.type === 'habit';
    if (filter === 'tasks') return t.type !== 'habit';
    return true;
  });

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

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}
          >
            All ({tasks.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === 'habits' && styles.filterChipActive]}
          onPress={() => setFilter('habits')}
        >
          <Text
            style={[styles.filterChipText, filter === 'habits' && styles.filterChipTextActive]}
          >
            Habits ({tasks.filter((t) => t.type === 'habit').length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === 'tasks' && styles.filterChipActive]}
          onPress={() => setFilter('tasks')}
        >
          <Text
            style={[styles.filterChipText, filter === 'tasks' && styles.filterChipTextActive]}
          >
            Tasks ({tasks.filter((t) => t.type !== 'habit').length})
          </Text>
        </Pressable>
      </View>

      {/* Task List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onPressCard={openEditModal}
          />
        ))}

        {filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#D0D5DD" />
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>Tap the + button below to create one!</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
        ]}
        onPress={openCreateModal}
      >
        <Ionicons name="add" size={32} color="#2C3036" />
      </Pressable>

      {/* Add / Edit Task Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTaskId
                  ? taskType === 'habit'
                    ? 'Edit Habit'
                    : 'Edit Task'
                  : taskType === 'habit'
                  ? 'New Habit'
                  : 'New Task'}
              </Text>
              <Pressable
                style={styles.modalCloseBtn}
                hitSlop={8}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#6F7983" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title Input */}
              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={
                  taskType === 'habit'
                    ? 'e.g. Read 15 mins, Drink water'
                    : 'e.g. 30 min morning workout'
                }
                placeholderTextColor="#9AA2AB"
                value={title}
                onChangeText={setTitle}
                autoFocus={!editingTaskId}
                returnKeyType="done"
              />

              {/* Type Switcher: Task vs Habit */}
              <Text style={styles.fieldLabel}>TYPE</Text>
              <View style={styles.segmentedRow}>
                <Pressable
                  style={[
                    styles.segmentBtn,
                    taskType === 'task' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setTaskType('task')}
                >
                  <Ionicons
                    name="checkbox-outline"
                    size={16}
                    color={taskType === 'task' ? '#FFFFFF' : '#6F7983'}
                  />
                  <Text
                    style={[
                      styles.segmentBtnText,
                      taskType === 'task' && styles.segmentBtnTextActive,
                    ]}
                  >
                    One-Time Task
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.segmentBtn,
                    taskType === 'habit' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setTaskType('habit')}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={16}
                    color={taskType === 'habit' ? '#FFFFFF' : '#6F7983'}
                  />
                  <Text
                    style={[
                      styles.segmentBtnText,
                      taskType === 'habit' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Habit
                  </Text>
                </Pressable>
              </View>

              {/* Habit Frequency & Target Slider */}
              {taskType === 'habit' && (
                <View style={styles.habitSettingsSection}>
                  <Text style={styles.fieldLabel}>FREQUENCY</Text>
                  <View style={styles.pillToggleRow}>
                    <Pressable
                      style={[
                        styles.togglePill,
                        frequency === 'everyday' && styles.togglePillActive,
                      ]}
                      onPress={() => setFrequency('everyday')}
                    >
                      <Text
                        style={[
                          styles.togglePillText,
                          frequency === 'everyday' && styles.togglePillTextActive,
                        ]}
                      >
                        Everyday
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.togglePill,
                        frequency === 'specific_days' && styles.togglePillActive,
                      ]}
                      onPress={() => setFrequency('specific_days')}
                    >
                      <Text
                        style={[
                          styles.togglePillText,
                          frequency === 'specific_days' && styles.togglePillTextActive,
                        ]}
                      >
                        Specific Days
                      </Text>
                    </Pressable>
                  </View>

                  {frequency === 'specific_days' && (
                    <View style={styles.daysRow}>
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = selectedDays.includes(day);
                        return (
                          <Pressable
                            key={day}
                            style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
                            onPress={() => toggleDay(day)}
                          >
                            <Text
                              style={[styles.dayBtnText, isSelected && styles.dayBtnTextActive]}
                            >
                              {day.slice(0, 1)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {/* Compact Target Per Day Slider (1 to 10) */}
                  <View style={styles.targetSliderHeader}>
                    <Text style={styles.fieldLabel}>TARGET PER DAY</Text>
                    <Text style={styles.targetValueText}>
                      {timesPerDay === 1 ? '1x / day' : `${timesPerDay}x / day`}
                    </Text>
                  </View>
                  <LiquidGlassSlider
                    value={timesPerDay}
                    min={1}
                    max={10}
                    step={1}
                    accentColor="#F9733E"
                    onChange={setTimesPerDay}
                    showTicks={false}
                  />
                </View>
              )}

              {/* Stat XP Rewards: Compact, Low-Profile Container */}
              <View style={styles.statsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.fieldLabel}>STAT XP REWARDS</Text>
                  <Text style={styles.maxSubtext}>0 to 3 XP per stat</Text>
                </View>

                <View style={styles.compactStatsBox}>
                  {STAT_CONFIGS.map((cfg, idx) => {
                    const currentXp = statRewards[cfg.name] || 0;
                    const isLast = idx === STAT_CONFIGS.length - 1;
                    return (
                      <View
                        key={cfg.name}
                        style={[styles.compactStatRow, !isLast && styles.compactStatBorder]}
                      >
                        {/* Top Line: Icon + Label on Left, XP Badge on Right */}
                        <View style={styles.compactStatTopRow}>
                          <View style={styles.statLeftCol}>
                            <View
                              style={[styles.compactIconBadge, { backgroundColor: cfg.fillColor }]}
                            >
                              {cfg.iconType === 'material' ? (
                                <MaterialCommunityIcons
                                  name={cfg.iconName as any}
                                  size={14}
                                  color={cfg.accentColor}
                                />
                              ) : (
                                <Ionicons
                                  name={cfg.iconName as any}
                                  size={14}
                                  color={cfg.accentColor}
                                />
                              )}
                            </View>
                            <Text style={styles.compactStatName}>{cfg.label}</Text>
                          </View>

                          <View
                            style={[
                              styles.compactXpBadge,
                              {
                                backgroundColor: currentXp > 0 ? cfg.fillColor : '#F3F4F6',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.compactXpBadgeText,
                                {
                                  color: currentXp > 0 ? cfg.accentColor : '#8E98A4',
                                },
                              ]}
                            >
                              {currentXp > 0 ? `+${currentXp} XP` : '0 XP'}
                            </Text>
                          </View>
                        </View>

                        {/* Bottom Line: Full-Width Glitch-Free Slider */}
                        <LiquidGlassSlider
                          value={currentXp}
                          min={0}
                          max={3}
                          step={1}
                          accentColor={cfg.sliderAccent}
                          onChange={(val) => handleStatXpChange(cfg.name, val)}
                          showTicks={true}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Reminder Section: Presets + Custom Clock */}
              <View style={styles.reminderSection}>
                <Pressable
                  style={styles.reminderToggleRow}
                  onPress={() => setReminderEnabled(!reminderEnabled)}
                >
                  <View style={styles.reminderLeft}>
                    <Ionicons
                      name={reminderEnabled ? 'alarm' : 'alarm-outline'}
                      size={18}
                      color={reminderEnabled ? '#2C3036' : '#6F7983'}
                    />
                    <Text style={styles.reminderLabel}>Reminder</Text>
                  </View>
                  <View
                    style={[
                      styles.reminderSwitch,
                      reminderEnabled && styles.reminderSwitchActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        reminderEnabled && styles.switchThumbActive,
                      ]}
                    />
                  </View>
                </Pressable>

                {reminderEnabled && (
                  <View style={styles.reminderBody}>
                    {/* Time Preset Pills with 'Custom' chip */}
                    <View style={styles.presetPillsRow}>
                      {TIME_PRESETS.map((t) => {
                        const isChosen = !isCustomTime && selectedPreset === t;
                        return (
                          <Pressable
                            key={t}
                            style={[
                              styles.timePill,
                              isChosen && styles.timePillActive,
                            ]}
                            onPress={() => {
                              setSelectedPreset(t);
                              setIsCustomTime(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.timePillText,
                                isChosen && styles.timePillTextActive,
                              ]}
                            >
                              {t}
                            </Text>
                          </Pressable>
                        );
                      })}

                      {/* Custom Chip */}
                      <Pressable
                        style={[
                          styles.timePill,
                          isCustomTime && styles.timePillActive,
                        ]}
                        onPress={() => setIsCustomTime(true)}
                      >
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={isCustomTime ? '#FFFFFF' : '#55606E'}
                        />
                        <Text
                          style={[
                            styles.timePillText,
                            isCustomTime && styles.timePillTextActive,
                          ]}
                        >
                          Custom
                        </Text>
                      </Pressable>
                    </View>

                    {/* Custom Clock Picker (Visible when Custom is chosen) */}
                    {isCustomTime && (
                      <View style={styles.customClockCard}>
                        <View style={styles.clockDisplayRow}>
                          {/* Hour stepper */}
                          <View style={styles.clockDigitBlock}>
                            <Pressable
                              style={styles.clockArrow}
                              onPress={() => adjustHour(1)}
                            >
                              <Ionicons name="chevron-up" size={14} color="#6F7983" />
                            </Pressable>
                            <Text style={styles.clockDigit}>{customHour}</Text>
                            <Pressable
                              style={styles.clockArrow}
                              onPress={() => adjustHour(-1)}
                            >
                              <Ionicons name="chevron-down" size={14} color="#6F7983" />
                            </Pressable>
                          </View>

                          <Text style={styles.clockDivider}>:</Text>

                          {/* Minute stepper */}
                          <View style={styles.clockDigitBlock}>
                            <Pressable
                              style={styles.clockArrow}
                              onPress={() => adjustMin(5)}
                            >
                              <Ionicons name="chevron-up" size={14} color="#6F7983" />
                            </Pressable>
                            <Text style={styles.clockDigit}>{customMin}</Text>
                            <Pressable
                              style={styles.clockArrow}
                              onPress={() => adjustMin(-5)}
                            >
                              <Ionicons name="chevron-down" size={14} color="#6F7983" />
                            </Pressable>
                          </View>

                          {/* AM / PM Segment */}
                          <View style={styles.periodSegment}>
                            <Pressable
                              style={[
                                styles.periodBtn,
                                customPeriod === 'AM' && styles.periodBtnActive,
                              ]}
                              onPress={() => setCustomPeriod('AM')}
                            >
                              <Text
                                style={[
                                  styles.periodText,
                                  customPeriod === 'AM' && styles.periodTextActive,
                                ]}
                              >
                                AM
                              </Text>
                            </Pressable>
                            <Pressable
                              style={[
                                styles.periodBtn,
                                customPeriod === 'PM' && styles.periodBtnActive,
                              ]}
                              onPress={() => setCustomPeriod('PM')}
                            >
                              <Text
                                style={[
                                  styles.periodText,
                                  customPeriod === 'PM' && styles.periodTextActive,
                                ]}
                              >
                                PM
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Pinned Bottom Action Button (Never goes out of screen; Cancel removed) */}
            <View style={styles.modalFixedFooter}>
              {editingTaskId && onDeleteTask && (
                <Pressable style={styles.modalDeleteBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={17} color="#E06D6D" />
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.modalSaveBtn,
                  editingTaskId ? styles.modalSaveBtnFlex : styles.modalSaveBtnFull,
                  !title.trim() && styles.modalSaveBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={!title.trim()}
              >
                <Text style={styles.modalSaveText}>
                  {editingTaskId
                    ? 'Save Changes'
                    : taskType === 'habit'
                    ? 'Create Habit'
                    : 'Create Task'}
                  {totalSelectedXp > 0 ? ` (+${totalSelectedXp} XP)` : ''}
                </Text>
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
    paddingBottom: 12,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#2C3036',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F7983',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6F7983',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9AA2AB',
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.4,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6F7983',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2C3036',
    borderWidth: 1,
    borderColor: '#EAECEF',
    marginBottom: 14,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    padding: 3,
    gap: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: '#2C3036',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F7983',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  habitSettingsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  pillToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  togglePill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6EA',
  },
  togglePillActive: {
    backgroundColor: '#2C3036',
    borderColor: '#2C3036',
  },
  togglePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#55606E',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E6EA',
  },
  dayBtnActive: {
    backgroundColor: '#2C3036',
    borderColor: '#2C3036',
  },
  dayBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6F7983',
  },
  dayBtnTextActive: {
    color: '#FFFFFF',
  },
  targetSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  targetValueText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#F9733E',
  },
  statsSection: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  maxSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E98A4',
  },
  compactStatsBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  compactStatRow: {
    paddingVertical: 8,
  },
  compactStatBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },
  compactStatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactStatName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C3036',
  },
  compactXpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactXpBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reminderSection: {
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  reminderToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reminderLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2C3036',
  },
  reminderSwitch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  reminderSwitchActive: {
    backgroundColor: '#2C3036',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  reminderBody: {
    marginTop: 10,
    gap: 8,
  },
  presetPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6EA',
  },
  timePillActive: {
    backgroundColor: '#2C3036',
    borderColor: '#2C3036',
  },
  timePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#55606E',
  },
  timePillTextActive: {
    color: '#FFFFFF',
  },
  customClockCard: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  clockDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAECEF',
    gap: 6,
  },
  clockDigitBlock: {
    alignItems: 'center',
    width: 36,
  },
  clockArrow: {
    padding: 2,
  },
  clockDigit: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3036',
  },
  clockDivider: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6F7983',
    marginBottom: 2,
  },
  periodSegment: {
    gap: 2,
    marginLeft: 4,
  },
  periodBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
  },
  periodBtnActive: {
    backgroundColor: '#2C3036',
  },
  periodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6F7983',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  modalFixedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF1F1',
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E06D6D',
  },
  modalSaveBtn: {
    height: 48,
    backgroundColor: '#2C3036',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnFull: {
    width: '100%',
  },
  modalSaveBtnFlex: {
    flex: 1,
  },
  modalSaveBtnDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
