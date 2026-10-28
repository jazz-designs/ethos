import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LogEntry, StatName, MoodType } from '../types';
import { MOOD_IMAGES, ACTIVITY_IMAGES } from '../assets';

interface ChroniclesScreenProps {
  logs: LogEntry[];
  onPressProfile?: () => void;
}

const MOOD_COLORS: Record<MoodType, string> = {
  worst: '#FFD5D8',
  bad: '#FCF2E8',
  neutral: '#E0D5FF',
  good: '#E9F6ED',
  excellent: '#E7F1FD',
};

const STAT_CONFIG: Record<StatName, { label: string; color: string; bg: string }> = {
  physique: { label: 'Physique', color: '#6F7983', bg: '#FFD5D8' },
  intelligence: { label: 'Intelligence', color: '#6F7983', bg: '#E7F1FD' },
  health: { label: 'Health', color: '#6F7983', bg: '#E9F6ED' },
  mental_health: { label: 'Mental Health', color: '#6F7983', bg: '#FCF2E8' },
};

// Helper to get formatted day number and month
const getDateInfo = (log: LogEntry, index: number) => {
  if (log.createdAt) {
    try {
      const d = new Date(log.createdAt);
      if (!isNaN(d.getTime())) {
        const dayNum = d.getDate();
        const monthStr = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        return { dayNum, monthStr };
      }
    } catch {}
  }
  const dayNum = Math.max(1, 10 - index > 0 ? 10 - index : log.day);
  return { dayNum, monthStr: 'JAN' };
};

// Helper to get caption as a clean 2-word phrase
const getCaption = (log: LogEntry) => {
  if (log.summary && log.summary.includes('•')) {
    return log.summary.trim();
  }
  if (log.summary) {
    if (log.summary.length <= 25) return log.summary.trim();
    const words = log.summary.replace(/[.,!?;]/g, '').split(/\s+/).slice(0, 2);
    return words.join(' • ');
  }
  if (log.activityScene) {
    const words = log.activityScene.replace(/character\s+/i, '').split(/\s+/).slice(0, 2);
    return words.join(' • ');
  }
  return 'Board • Worked out';
};

// Helper to get image source
const getImageSource = (log: LogEntry, index: number) => {
  if (log.imageUrl) {
    if (typeof log.imageUrl === 'string') {
      return { uri: log.imageUrl };
    }
    return log.imageUrl;
  }
  const fallbackImgs = [
    ACTIVITY_IMAGES.workout,
    ACTIVITY_IMAGES.dance,
    ACTIVITY_IMAGES.couch,
    ACTIVITY_IMAGES.first,
  ];
  return fallbackImgs[index % fallbackImgs.length];
};

// Individual Journal Entry Card with smooth Animated scale transition
interface JournalCardItemProps {
  log: LogEntry;
  index: number;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onLayout: (y: number) => void;
  onTouchStart: () => void;
}

const JournalCardItem: React.FC<JournalCardItemProps> = ({
  log,
  index,
  isActive,
  isExpanded,
  onToggle,
  onLayout,
  onTouchStart,
}) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.06 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.06 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [isActive]);

  const { dayNum, monthStr } = getDateInfo(log, index);
  const moodKey = (log.mood as MoodType) || 'good';
  const imageSource = getImageSource(log, index);
  const caption = getCaption(log);
  const rotationDegree = index % 2 === 0 ? '-2.5deg' : '2.5deg';

  return (
    <View
      onLayout={(e) => onLayout(e.nativeEvent.layout.y)}
      onTouchStart={onTouchStart}
    >
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          isActive && { zIndex: 10 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.entryCard,
            isActive && styles.entryCardSelected,
          ]}
          onPress={onToggle}
        >
          {/* ── Left Column: Compact Date + Mood Icon closely stacked ── */}
          <View style={styles.leftCol}>
            <View style={styles.dateGroup}>
              <Text style={styles.dayNumText}>{dayNum}</Text>
              <Text style={styles.monthText}>{monthStr}</Text>
            </View>

            {/* Mood icon right below date with tight, compact gap */}
            <View style={styles.moodIconWrap}>
              {MOOD_IMAGES[moodKey] && (
                <Image
                  source={MOOD_IMAGES[moodKey]}
                  style={styles.leftColMoodSvg}
                  contentFit="contain"
                />
              )}
            </View>
          </View>

          {/* Vertical Divider Line */}
          <View style={styles.verticalDivider} />

          {/* ── Right Section: Scaled-Down Tilted Card & Phrase ── */}
          <View style={styles.rightSection}>
            {/* Scaled-Down Tilted Image Area */}
            <View style={styles.tiltedCardContainer}>
              <View
                style={[
                  styles.tiltedCard,
                  { transform: [{ rotate: rotationDegree }] },
                ]}
              >
                <Image
                  source={imageSource}
                  style={styles.tiltedImage}
                  contentFit="cover"
                  contentPosition="top"
                  transition={200}
                />
              </View>
            </View>

            {/* Horizontal Divider Line */}
            <View style={styles.horizontalDivider} />

            {/* Bottom: Centered 2-Word Phrase */}
            <View style={styles.captionContainer}>
              <Text style={styles.captionText} numberOfLines={1}>
                {caption}
              </Text>
            </View>

            {/* Expanded Breakdown */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.horizontalDivider} />
                <Text style={styles.expandedEntryText}>"{log.text}"</Text>

                <View style={styles.scoresRow}>
                  {(['physique', 'intelligence', 'health', 'mental_health'] as StatName[]).map(
                    (stat) => {
                      const score = log.scores[stat] ?? 0;
                      const isPositive = score >= 0;
                      const meta = STAT_CONFIG[stat];

                      return (
                        <View
                          key={stat}
                          style={[styles.scoreChip, { backgroundColor: meta.bg }]}
                        >
                          <Text style={styles.scoreChipLabel}>{meta.label}</Text>
                          <Text
                            style={[
                              styles.scoreChipVal,
                              { color: isPositive ? '#48A868' : '#E06D6D' },
                            ]}
                          >
                            {isPositive ? `+${score}` : `${score}`}
                          </Text>
                        </View>
                      );
                    }
                  )}
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export const ChroniclesScreen: React.FC<ChroniclesScreenProps> = ({
  logs,
  onPressProfile,
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [activeCardDay, setActiveCardDay] = useState<number | null>(null);

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  // Week navigation: 0 = current week, 1 = 1 week ago, 2 = 2 weeks ago, etc.
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Refs for auto-scrolling journal to respective week/card
  const journalScrollRef = useRef<any>(null);
  const cardLayouts = useRef<Record<string, number>>({});

  // Helper to extract ISO date string (YYYY-MM-DD) from a log
  const getLogDateStr = (log: LogEntry) => {
    if (log.createdAt) {
      try {
        const d = new Date(log.createdAt);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      } catch {}
    }
    return null;
  };

  // Always keep all logs in view, sorted descending
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.day - a.day);
  }, [logs]);

  // Smoothly scroll journal list to the entries of a specific week
  const scrollToWeek = (offset: number) => {
    if (offset === 0) {
      journalScrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek - (offset * 7));
    sunday.setHours(0, 0, 0, 0);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);

    const startStr = sunday.toISOString().split('T')[0];
    const endStr = saturday.toISOString().split('T')[0];

    // Find first log in this week
    const logInWeek = sortedLogs.find((l) => {
      const dStr = getLogDateStr(l);
      if (!dStr) return false;
      return dStr >= startStr && dStr <= endStr;
    });

    if (logInWeek) {
      const dStr = getLogDateStr(logInWeek);
      const targetY = (dStr ? cardLayouts.current[dStr] : undefined) ?? cardLayouts.current[`log_${logInWeek.day}`];
      if (typeof targetY === 'number') {
        journalScrollRef.current?.scrollTo({ y: Math.max(0, targetY - 14), animated: true });
        return;
      }
    }

    // Fallback: find closest older log on or before this week's end
    const olderLog = sortedLogs.find((l) => {
      const dStr = getLogDateStr(l);
      if (!dStr) return false;
      return dStr <= endStr;
    });

    if (olderLog) {
      const dStr = getLogDateStr(olderLog);
      const targetY = (dStr ? cardLayouts.current[dStr] : undefined) ?? cardLayouts.current[`log_${olderLog.day}`];
      if (typeof targetY === 'number') {
        journalScrollRef.current?.scrollTo({ y: Math.max(0, targetY - 14), animated: true });
        return;
      }
    }
  };

  // Smooth left-to-right transition to show the previous week + scroll journal to that week
  const transitionToPrevWeek = () => {
    const nextOffset = weekOffset + 1;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setWeekOffset(nextOffset);
      scrollToWeek(nextOffset);
      slideAnim.setValue(-50);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Smooth right-to-left transition to show the next / newer week + scroll journal
  const transitionToNextWeek = () => {
    if (weekOffset === 0) return;
    const nextOffset = Math.max(0, weekOffset - 1);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setWeekOffset(nextOffset);
      scrollToWeek(nextOffset);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // PanResponder to track swipe gesture across the week strip
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        },
        onPanResponderMove: (_, gestureState) => {
          if (weekOffset === 0 && gestureState.dx < 0) {
            slideAnim.setValue(gestureState.dx * 0.2); // rubber-band resistance at current week
          } else {
            slideAnim.setValue(gestureState.dx * 0.5);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 40) {
            // Slid left-to-right past current week -> show previous week
            transitionToPrevWeek();
          } else if (gestureState.dx < -40 && weekOffset > 0) {
            // Slid right-to-left -> show next week
            transitionToNextWeek();
          } else {
            // Snap back
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
          }
        },
      }),
    [weekOffset, sortedLogs]
  );

  // Generate 7 days of the selected week (Sunday to Saturday)
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek - (weekOffset * 7));
    sunday.setHours(0, 0, 0, 0);

    const todayStr = now.toISOString().split('T')[0];
    const items = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;

      const matchedLog = logs.find((l) => {
        if (l.createdAt) {
          try {
            return new Date(l.createdAt).toISOString().split('T')[0] === dateStr;
          } catch {
            return false;
          }
        }
        return false;
      });

      items.push({
        dateStr,
        dayName,
        dayNum,
        isToday,
        matchedLog,
        mood: (matchedLog?.mood as MoodType) || undefined,
      });
    }
    return items;
  }, [logs, weekOffset]);

  // Handle selecting a date in the sliding strip: smoothly scroll to that section and scale up the card
  const handleSelectDate = (dateStr: string) => {
    if (selectedDateStr === dateStr) {
      setSelectedDateStr(null); // toggle off
      setActiveCardDay(null);
    } else {
      setSelectedDateStr(dateStr);
      const matched = sortedLogs.find((l) => getLogDateStr(l) === dateStr);
      if (matched) {
        setActiveCardDay(matched.day);
      }
      const targetY = cardLayouts.current[dateStr];
      if (typeof targetY === 'number' && journalScrollRef.current) {
        journalScrollRef.current.scrollTo({ y: Math.max(0, targetY - 14), animated: true });
      }
    }
  };



  return (
    <View style={styles.container}>
      {/* ── 1. Top Header Bar ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
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

      {/* ── 2. Sliding Date Strip (Discrete week with left-to-right transition, no header) ── */}
      <View style={styles.dateStripWrapper} {...panResponder.panHandlers}>
        {/* 7 Days Row with 60fps Native Animated slide */}
        <Animated.View
          style={[
            styles.weekDaysRow,
            {
              transform: [{ translateX: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {weekDays.map((item) => {
            const isSelected = selectedDateStr === item.dateStr;
            const moodBg = item.mood ? MOOD_COLORS[item.mood] : '#E2E4E8';

            return (
              <Pressable
                key={item.dateStr}
                style={[
                  styles.datePillItem,
                  isSelected && styles.datePillItemSelected,
                ]}
                onPress={() => handleSelectDate(item.dateStr)}
              >
                {/* Mood Squircle: Colored icon if logged, or gray with twin dots if empty */}
                <View style={[styles.moodSquircle, { backgroundColor: moodBg }]}>
                  {item.mood && MOOD_IMAGES[item.mood] ? (
                    <Image
                      source={MOOD_IMAGES[item.mood]}
                      style={styles.moodSquircleImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.emptyDotsRow}>
                      <View style={styles.emptyDotCircle} />
                      <View style={styles.emptyDotCircle} />
                    </View>
                  )}
                </View>

                {/* Day Name (e.g. "Wed") & Date Number (e.g. "14") */}
                <Text style={styles.dateDayName}>{item.dayName}</Text>
                <Text style={styles.dateDayNumber}>{item.dayNum}</Text>
              </Pressable>
            );
          })}
        </Animated.View>
      </View>

      {/* ── 3. Scaled-Down Journal Stream ── */}
      <ScrollView
        ref={journalScrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={40} color="#6F7983" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>Your Journal is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Check in with your mood and log your day to start your story.
            </Text>
          </View>
        ) : (
          sortedLogs.map((log, index) => (
            <JournalCardItem
              key={log.day}
              log={log}
              index={index}
              isActive={activeCardDay === log.day}
              isExpanded={expandedDays.has(log.day)}
              onToggle={() => toggleDay(log.day)}
              onLayout={(y) => {
                const logDateStr = getLogDateStr(log);
                if (logDateStr && cardLayouts.current[logDateStr] === undefined) {
                  cardLayouts.current[logDateStr] = y;
                }
                cardLayouts.current[`log_${log.day}`] = y;
              }}
              onTouchStart={() => setActiveCardDay(log.day)}
            />
          ))
        )}
      </ScrollView>
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
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.6,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  // ── Sliding Date Strip ──
  dateStripWrapper: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F4',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  datePillItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 1,
  },
  datePillItemSelected: {
    backgroundColor: '#EBEBEB',
  },
  moodSquircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  moodSquircleImg: {
    width: 42,
    height: 42,
  },
  emptyDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyDotCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3036',
    letterSpacing: -0.2,
  },
  dateDayNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C3036',
    marginTop: 2,
    letterSpacing: -0.3,
  },

  // ── Journal Scroll List ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 14,
    paddingBottom: 130,
    gap: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2C3036',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#6F7983',
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Scaled-Down Journal Entry Card ──
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  entryCardSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },

  // Left Column with tightly grouped Date + Mood
  leftCol: {
    width: 65,
    paddingVertical: 12,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14, // Tight gap between date and mood icon!
  },
  dateGroup: {
    alignItems: 'center',
    gap: 1,
  },
  dayNumText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3036',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  monthText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6F7983',
    letterSpacing: 0.6,
  },
  moodIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  leftColMoodSvg: {
    width: 48,
    height: 48,
  },

  verticalDivider: {
    width: 1,
    backgroundColor: '#ECEFF1',
  },

  // Right Section: Compact Tilted Card & Phrase
  rightSection: {
    flex: 1,
  },
  tiltedCardContainer: {
    height: 140, // Scaled down from 180!
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tiltedCard: {
    width: '84%',
    height: 130, // Scaled down from 160!
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tiltedImage: {
    width: '100%',
    height: '100%',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#ECEFF1',
    width: '100%',
  },
  captionContainer: {
    paddingVertical: 13, // Scaled down from 14
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F7983',
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  // Expanded content
  expandedContent: {
    padding: 12,
    gap: 10,
    backgroundColor: '#FAFBFC',
  },
  expandedEntryText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#2C3036',
    lineHeight: 18,
  },
  scoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2C3036',
  },
  scoreChipVal: {
    fontSize: 11,
    fontWeight: '800',
  },
});
