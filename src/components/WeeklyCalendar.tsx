import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  PanResponder,
  Animated,
} from 'react-native';
import { Calendar as CalendarIcon, ChevronUp, ChevronDown, CalendarDays } from 'lucide-react-native';
import { theme } from '../theme/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WeeklyCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const WEEKDAY_KOR_SUN = ['일', '월', '화', '수', '목', '금', '토'];

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Smooth accordion expand/collapse transition
  const toggleExpand = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setIsExpanded(!isExpanded);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  // Shift by days helper
  const shiftDateByDays = (days: number, message: string) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    onSelectDate(nextDate);
    showToast(message);
  };

  // Shift by month helper
  const shiftDateByMonths = (months: number, message: string) => {
    const nextDate = new Date(selectedDate);
    nextDate.setMonth(nextDate.getMonth() + months);
    onSelectDate(nextDate);
    showToast(message);
  };

  // PanResponder for horizontal swipe gestures (Left / Right drag)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;

        if (!isExpanded) {
          // WEEKLY MODE: Horizontal Drag -> Shift 1 week (±7 days)
          if (dx < -40) {
            // Drag Left -> Next Week (+7 days)
            shiftDateByDays(7, '1주 후로 이동 ▶');
          } else if (dx > 40) {
            // Drag Right -> Previous Week (-7 days)
            shiftDateByDays(-7, '◀ 1주 전으로 이동');
          }
        } else {
          // MONTHLY MODE: Horizontal Drag -> Shift 1 month (±1 month)
          if (dx < -40) {
            // Drag Left -> Next Month (+1 month)
            shiftDateByMonths(1, '1개월 후로 이동 ▶');
          } else if (dx > 40) {
            // Drag Right -> Previous Month (-1 month)
            shiftDateByMonths(-1, '◀ 1개월 전으로 이동');
          }
        }
      },
    })
  ).current;

  // Generate 7 days starting from Sunday
  const daysOfWeek = useMemo(() => {
    const curr = new Date(selectedDate);
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - curr.getDay());

    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      result.push(d);
    }
    return result;
  }, [selectedDate]);

  // Generate Month Grid Matrix
  const monthGrid = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const grid: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(new Date(year, month, d));
    }
    return grid;
  }, [selectedDate]);

  const year = selectedDate.getFullYear();
  const monthName = MONTH_NAMES[selectedDate.getMonth()];
  const headerDateString = `${monthName} ${year}`;

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <View style={styles.container}>
      {/* Toast Banner for Drag Gesture Feedback */}
      {toastMessage && (
        <Animated.View style={[styles.toastBanner, { opacity: fadeAnim }]}>
          <CalendarDays size={13} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Calendar Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.englishDateText}>{headerDateString}</Text>
        
        <Pressable
          style={({ pressed }) => [
            styles.toggleBtn,
            pressed && styles.btnPressed,
          ]}
          onPress={toggleExpand}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} color="#2C3036" />
              <Text style={styles.toggleBtnText}>주간 보기</Text>
            </>
          ) : (
            <>
              <CalendarIcon size={14} color="#2C3036" />
              <Text style={styles.toggleBtnText}>월간 보기</Text>
              <ChevronDown size={14} color="#2C3036" />
            </>
          )}
        </Pressable>
      </View>

      {/* Calendar Card with Horizontal Drag Gesture Support */}
      <View style={styles.calendarCard} {...panResponder.panHandlers}>
        {/* Swipe Drag Direction Indicator Hint */}
        <View style={styles.dragHintRow}>
          <Text style={styles.dragHintText}>
            {isExpanded ? '◀ 좌우 드래그: 1개월 이동 ▶' : '◀ 좌우 드래그: 1주일 이동 ▶'}
          </Text>
        </View>

        {!isExpanded ? (
          /* WEEKLY VIEW (Sun ~ Sat) */
          <View style={styles.weekRow}>
            {daysOfWeek.map((dayDate, index) => {
              const selected = isSameDay(dayDate, selectedDate);
              const dayNum = dayDate.getDate();
              const dayLabel = WEEKDAY_KOR_SUN[index];

              return (
                <Pressable
                  key={dayDate.toISOString()}
                  style={styles.dayItem}
                  onPress={() => onSelectDate(dayDate)}
                >
                  <Text
                    style={[
                      styles.weekdayLabel,
                      selected && styles.weekdayLabelSelected,
                      index === 0 && !selected && styles.sunLabel,
                      index === 6 && !selected && styles.satLabel,
                    ]}
                  >
                    {dayLabel}
                  </Text>
                  
                  {/* Circle Indicator for Selected Date (#F4ADCF) */}
                  <View
                    style={[
                      styles.dayCircle,
                      selected && styles.dayCircleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        selected && styles.dayNumSelected,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>

                  {/* Point Line (#BFC4FF) */}
                  {selected ? (
                    <View style={styles.pointLine} />
                  ) : (
                    <View style={styles.pointLinePlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          /* MONTHLY VIEW (In-place Smooth Expand) */
          <View style={styles.monthContainer}>
            <View style={styles.monthWeekdayHeader}>
              {WEEKDAY_KOR_SUN.map((w, idx) => (
                <Text
                  key={w}
                  style={[
                    styles.monthWeekdayText,
                    idx === 0 && { color: '#E57373' },
                    idx === 6 && { color: '#64B5F6' },
                  ]}
                >
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {monthGrid.map((dayDate, index) => {
                if (!dayDate) {
                  return <View key={`empty-${index}`} style={styles.monthDayCell} />;
                }

                const selected = isSameDay(dayDate, selectedDate);
                const dayNum = dayDate.getDate();

                return (
                  <Pressable
                    key={dayDate.toISOString()}
                    style={styles.monthDayCell}
                    onPress={() => {
                      onSelectDate(dayDate);
                    }}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        selected && styles.dayCircleSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          selected && styles.dayNumSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </View>
                    {selected && <View style={styles.pointLine} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.background, // #FFE7FF
    position: 'relative',
  },
  toastBanner: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(44, 48, 54, 0.88)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.floating,
  },
  toastText: {
    fontFamily: 'NanumSquareRound',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  englishDateText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: 0.5,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.pastelMint, // #B2F9E7
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(44, 165, 141, 0.25)',
    ...theme.shadows.gentle,
  },
  btnPressed: {
    opacity: 0.7,
  },
  toggleBtnText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2C3036',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 173, 207, 0.5)',
    ...theme.shadows.gentle,
  },
  dragHintRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  dragHintText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 10.5,
    color: theme.colors.textLight,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayLabel: {
    fontFamily: 'NanumSquareRound',
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textSub,
    marginBottom: 4,
  },
  sunLabel: {
    color: '#E57373',
  },
  satLabel: {
    color: '#64B5F6',
  },
  weekdayLabelSelected: {
    color: theme.colors.pastelPinkDark,
    fontWeight: '800',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayCircleSelected: {
    backgroundColor: theme.colors.pastelPinkDark, // #F4ADCF
    shadowColor: theme.colors.pastelPinkDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  dayNum: {
    fontFamily: 'NanumSquareRound',
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  dayNumSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pointLine: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: theme.colors.pastelLavender, // #BFC4FF
    marginTop: 2,
  },
  pointLinePlaceholder: {
    width: 14,
    height: 3.5,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  monthContainer: {
    paddingVertical: 4,
  },
  monthWeekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 8,
  },
  monthWeekdayText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.textSub,
    width: '14.28%',
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDayCell: {
    width: '14.28%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
});
