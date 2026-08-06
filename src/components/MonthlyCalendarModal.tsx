import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { theme } from '../theme/theme';

interface MonthlyCalendarModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

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
          <View style={styles.header}>
            <View style={styles.monthHeaderRow}>
              <Pressable onPress={handlePrevMonth} style={styles.arrowBtn}>
                <ChevronLeft size={20} color={theme.colors.textMain} />
              </Pressable>
              <Text style={styles.monthTitle}>
                {year}년 {MONTH_NAMES_KOR[month]}
              </Text>
              <Pressable onPress={handleNextMonth} style={styles.arrowBtn}>
                <ChevronRight size={20} color={theme.colors.textMain} />
              </Pressable>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.textSub} />
            </Pressable>
          </View>

          {/* Weekday Labels Header */}
          <View style={styles.weekdayHeader}>
            {WEEKDAYS.map((w, idx) => (
              <Text
                key={w}
                style={[
                  styles.weekdayText,
                  idx === 0 && { color: '#E57373' }, // Sun
                  idx === 6 && { color: '#64B5F6' }, // Sat
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
                          selected && styles.dayTextSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </View>
                    {selected && <View style={styles.shortPointLine} />}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: StyleSheet.absoluteFill,
  modalSheet: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '75%',
    ...theme.shadows.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  arrowBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
  },
  closeBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 10,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSub,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: theme.colors.pastelPinkSoft,
    borderWidth: 1,
    borderColor: theme.colors.pastelPink,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textMain,
  },
  dayTextSelected: {
    fontWeight: '800',
    color: theme.colors.pastelPinkDark,
  },
  shortPointLine: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.selectedUnderline,
    marginTop: 2,
  },
});
