import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export function WeeklyCalendar({ selectedDate, onSelectDate }: { selectedDate: Date; onSelectDate: (date: Date) => void }) {
  const [expanded, setExpanded] = useState(false);
  const year = selectedDate.getFullYear(), month = selectedDate.getMonth();
  const sunday = new Date(year, month, selectedDate.getDate() - selectedDate.getDay());
  const days: (Date | null)[] = expanded ? [...Array(new Date(year, month, 1).getDay()).fill(null), ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => new Date(year, month, i + 1))] : Array.from({ length: 7 }, (_, i) => new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i));
  const shift = (offset: number) => {
    const date = new Date(selectedDate);
    if (expanded) { date.setDate(1); date.setMonth(month + offset); date.setDate(Math.min(selectedDate.getDate(), new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())); }
    else date.setDate(date.getDate() + offset * 7);
    onSelectDate(date);
  };
  return <View style={styles.calendar}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel={expanded ? '이전 달' : '이전 주'} onPress={() => shift(-1)} style={styles.arrow}><ChevronLeft size={20} color={colors.text} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={expanded ? '주간 달력 보기' : '월간 달력 보기'} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}><Text style={styles.month}>{year}년 {month + 1}월</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={expanded ? '다음 달' : '다음 주'} onPress={() => shift(1)} style={styles.arrow}><ChevronRight size={20} color={colors.text} /></Pressable></View><View style={styles.grid}>{['일','월','화','수','목','금','토'].map(day => <Text key={day} style={styles.weekday}>{day}</Text>)}</View><View style={styles.grid}>{days.map((date, i) => {
    const selected = date?.toDateString() === selectedDate.toDateString();
    return <View key={i} style={styles.cell}>{date && <Pressable accessibilityRole="button" accessibilityLabel={`${date.getMonth() + 1}월 ${date.getDate()}일`} accessibilityState={{ selected }} onPress={() => onSelectDate(date)} style={[styles.day, selected && styles.active]}><Text style={[styles.number, selected && styles.selected]}>{date.getDate()}</Text></Pressable>}</View>;
  })}</View></View>;
}
const styles = StyleSheet.create({ calendar: { paddingHorizontal: 20, paddingBottom: 14 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, arrow: { padding: 10 }, month: { color: colors.text, fontSize: 16, fontWeight: '700', padding: 8 }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.2857%', textAlign: 'center', fontSize: 11, color: colors.body, marginBottom: 8 }, cell: { width: '14.2857%', alignItems: 'center', marginBottom: 3 }, day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, active: { backgroundColor: colors.primaryFill }, number: { fontSize: 14, color: colors.text }, selected: { fontWeight: '700', color: colors.onPrimary } });
