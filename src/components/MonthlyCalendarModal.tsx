import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '../theme/theme';

interface MonthlyCalendarModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

// The Setlog reference this was modeled on is dark, but a black sheet read
// as out of place against the rest of this (light-themed) app — kept its
// bottom-sheet layout (grabber bar, no close-X, chevron month nav) and just
// swapped back to the app's own light palette.
const palette = {
  sheet: theme.colors.cardBackground,
  border: theme.colors.border,
  chip: theme.colors.background,
  text: theme.colors.textMain,
  muted: theme.colors.textSub,
  sun: '#C4645F',
  sat: theme.colors.blueStrong,
  teal: theme.colors.primaryStrong,
  onTeal: theme.colors.onPrimary,
};

const MONTH_NAMES_KOR = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const MonthlyCalendarModal: React.FC<MonthlyCalendarModalProps> = ({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
}) => {
  const [currentViewDate, setCurrentViewDate] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days matrix
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sun

  const daysGrid: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(new Date(year, month, d));
  }

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.monthTitle}>
              {year}년 {MONTH_NAMES_KOR[month]}
            </Text>
            <View style={styles.monthNavRow}>
              <Pressable onPress={handlePrevMonth} style={styles.arrowBtn}>
                <ChevronLeft size={20} color={palette.teal} />
              </Pressable>
              <Pressable onPress={handleNextMonth} style={styles.arrowBtn}>
                <ChevronRight size={20} color={palette.text} />
              </Pressable>
            </View>
          </View>

          {/* Weekday Labels Header */}
          <View style={styles.weekdayHeader}>
            {WEEKDAYS.map((w, idx) => (
              <Text
                key={w}
                style={[
                  styles.weekdayText,
                  idx === 0 && { color: palette.sun },
                  idx === 6 && { color: palette.sat },
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* Month Days Grid */}
          <ScrollView contentContainerStyle={styles.gridContainer}>
            <View style={styles.grid}>
              {daysGrid.map((dayDate, index) => {
                if (!dayDate) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const selected = isSameDay(dayDate, selectedDate);
                const dayNum = dayDate.getDate();
                const weekday = dayDate.getDay();

                return (
                  <Pressable
                    key={dayDate.toISOString()}
                    style={styles.dayCell}
                    onPress={() => {
                      onSelectDate(dayDate);
                      onClose();
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
                          styles.dayText,
                          weekday === 0 && { color: palette.sun },
                          weekday === 6 && { color: palette.sat },
                          selected && styles.dayTextSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: StyleSheet.absoluteFill,
  modalSheet: {
    backgroundColor: palette.sheet,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    maxHeight: '75%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  arrowBtn: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: palette.chip,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    marginBottom: 10,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.muted,
    width: '14%',
    textAlign: 'center',
  },
  gridContainer: {
    paddingBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: palette.teal,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.text,
  },
  dayTextSelected: {
    fontWeight: '800',
    color: palette.onTeal,
  },
});
