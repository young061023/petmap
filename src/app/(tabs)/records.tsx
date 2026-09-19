import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Plus } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { TravelRecordList } from '@/components/TravelRecordList';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddRecordModal } from '@/components/AddRecordModal';
import { MissionsModal } from '@/components/MissionsModal';
import { MonthlyCalendarModal } from '@/components/MonthlyCalendarModal';
import { PetNameModal } from '@/components/PetNameModal';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMissions } from '@/features/missions/MissionProvider';
import { useAchievements } from '@/features/achievements/AchievementProvider';
import { recordService } from '@/services/recordService';
import { theme } from '@/theme/theme';
import type { ActivityCategory, LocalRecordMedia, MissionItem, TimelineActivity } from '@/types/record';

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const WEEKDAY_KOR = ['일', '월', '화', '수', '목', '금', '토'];
function formatDateLabel(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_KOR[date.getDay()]})`;
}

export default function RecordsScreen() {
  const { profile, updatePetName } = useAuth();
  const { missions: dashboardMissions, setCompleted } = useMissions();
  const { refresh: refreshAchievements } = useAchievements();
  const petName = profile?.pet?.name ?? '반려견';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [missionsModalVisible, setMissionsModalVisible] = useState(false);
  const [addRecordModalVisible, setAddRecordModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    const date = formatDateString(selectedDate);
    try {
      const nextActivities = await recordService.getActivitiesByDate(date);
      setActivities(nextActivities);
    } catch {
      setActivities([]);
    }
  }, [selectedDate]);

  const missions: MissionItem[] = dashboardMissions
    .filter((mission) => mission.period === 'daily' && mission.assignedDate === formatDateString(selectedDate))
    .map((mission) => ({
      id: mission.id,
      title: mission.title,
      completed: mission.progress >= mission.target,
      category: mission.category,
    }));

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSavePetName = async (name: string) => {
    await updatePetName(name);
  };

  const handleToggleMission = async (missionId: string) => {
    const mission = missions.find((item) => item.id === missionId);
    if (mission) await setCompleted(missionId, !mission.completed);
  };

  const handleAddRecord = async (data: {
    title: string;
    description: string;
    category: ActivityCategory;
    time: string;
    location?: string;
    media?: LocalRecordMedia;
  }) => {
    await recordService.addActivity({ ...data, dateString: formatDateString(selectedDate) });
    await loadData();
    await refreshAchievements();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heading}>
            <Pressable accessibilityRole="button" accessibilityLabel="날짜 선택" style={styles.dateChip} onPress={() => setCalendarModalVisible(true)}>
              <Text style={styles.dateChipText}>{formatDateLabel(selectedDate)}</Text>
              <ChevronRight size={13} color={colors.primary} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="기록 추가" style={styles.add} onPress={() => setAddRecordModalVisible(true)}><Plus size={17} color={colors.primary} /><Text style={styles.addText}>기록</Text></Pressable>
          </View>
          <TravelRecordList activities={activities} />
          <Pressable accessibilityRole="button" style={styles.recordButton} onPress={() => setAddRecordModalVisible(true)}><Text style={styles.recordButtonText}>추억 기록하기</Text></Pressable>
          <Pressable accessibilityRole="button" style={styles.missionLink} onPress={() => setMissionsModalVisible(true)}><Text style={styles.addText}>오늘의 미션 {missions.filter(item => item.completed).length} / {missions.length} 완료 · 확인하기</Text></Pressable>
        </ScrollView>
        <PetNameModal
          visible={petModalVisible}
          currentName={petName}
          onClose={() => setPetModalVisible(false)}
          onSave={handleSavePetName}
        />
        <MissionsModal
          visible={missionsModalVisible}
          missions={missions}
          onClose={() => setMissionsModalVisible(false)}
          onToggleMission={handleToggleMission}
        />
        <AddRecordModal
          visible={addRecordModalVisible}
          onClose={() => setAddRecordModalVisible(false)}
          onAdd={handleAddRecord}
        />
        <MonthlyCalendarModal
          visible={calendarModalVisible}
          selectedDate={selectedDate}
          onClose={() => setCalendarModalVisible(false)}
          onSelectDate={setSelectedDate}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingTop: 25, paddingBottom: 20 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 1, paddingVertical: 6, paddingHorizontal: 4 },
  dateChipText: { fontSize: 13, color: colors.text, fontWeight: '700' },
  add: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 12, borderRadius: 16, backgroundColor: colors.primaryWeak },
  addText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  recordButton: { marginHorizontal: 20, marginTop: 18, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 15, backgroundColor: colors.primaryFill },
  recordButtonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  missionLink: { padding: 15, alignItems: 'center' },
});
