import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddRecordModal } from '@/components/AddRecordModal';
import { CombinedSheet } from '@/components/CombinedSheet';
import { Header } from '@/components/Header';
import { MissionsModal } from '@/components/MissionsModal';
import { PetNameModal } from '@/components/PetNameModal';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMissions } from '@/features/missions/MissionProvider';
import { recordService } from '@/services/recordService';
import { theme } from '@/theme/theme';
import type { ActivityCategory, MissionItem, TimelineActivity } from '@/types/record';

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RecordsScreen() {
  const { profile, updatePetName } = useAuth();
  const { missions: dashboardMissions, setCompleted } = useMissions();
  const petName = profile?.pet?.name ?? '반려견';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [missionsModalVisible, setMissionsModalVisible] = useState(false);
  const [addRecordModalVisible, setAddRecordModalVisible] = useState(false);

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

  const handleChangeDateByDay = (offset: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + offset);
    setSelectedDate(nextDate);
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
  }) => {
    await recordService.addActivity({ ...data, dateString: formatDateString(selectedDate) });
    await loadData();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Header petName={petName} onEditPetName={() => setPetModalVisible(true)} />
        <WeeklyCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <CombinedSheet
          recordCount={activities.length}
          missions={missions}
          onOpenMissions={() => setMissionsModalVisible(true)}
          activities={activities}
          selectedDate={selectedDate}
          onChangeDateByDay={handleChangeDateByDay}
          onOpenAddModal={() => setAddRecordModalVisible(true)}
          petName={petName}
        />
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
});
