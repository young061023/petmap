import { StyleSheet, Text, View } from 'react-native';
import { Target } from 'lucide-react-native';
import { MissionProgressBar } from './MissionProgressBar';
import { missionColors as c } from '@/constants/missionTheme';

export function MissionOverview({ streakDays, completedCount, totalCount }: { streakDays: number; completedCount: number; totalCount: number }) {
  return <View style={styles.container}><View style={styles.summary}><Target size={30} color={c.primary} /><View style={styles.copy}><View style={styles.row}><Text style={styles.count}>{completedCount} / {totalCount}<Text style={styles.complete}> 완료</Text></Text></View><MissionProgressBar value={totalCount ? completedCount / totalCount : 0} accessibilityLabel={`오늘의 미션 ${totalCount}개 중 ${completedCount}개 완료`} color={c.primaryFill} trackColor={c.border} /><Text style={styles.streak}>연속 달성 {streakDays}일</Text></View></View></View>;
}
const styles = StyleSheet.create({ container: { paddingHorizontal: 20, paddingTop: 20 }, summary: { padding: 15, borderRadius: 18, backgroundColor: c.primaryWeak, flexDirection: 'row', alignItems: 'center', gap: 13 }, copy: { flex: 1, gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, count: { color: c.foreground, fontSize: 20, fontWeight: '800' }, complete: { fontSize: 13, fontWeight: '600' }, streak: { fontSize: 11, color: c.body } });
