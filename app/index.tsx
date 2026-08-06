import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../src/components/Header';
import { WeeklyCalendar } from '../src/components/WeeklyCalendar';
import { CombinedSheet } from '../src/components/CombinedSheet';

import { PetNameModal } from '../src/components/PetNameModal';
import { MissionsModal } from '../src/components/MissionsModal';
import { AddRecordModal } from '../src/components/AddRecordModal';

import { recordService } from '../src/services/recordService';
import { petService } from '../src/services/petService';
import { TimelineActivity, MissionItem, ActivityCategory } from '../src/types/record';
import { theme } from '../src/theme/theme';

export default function RecordPageScreen() {
  // State
  const [petName, setPetName] = useState<string>('몽이');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 7, 4)); // 2026-08-04 default
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [missions, setMissions] = useState<MissionItem[]>([]);

  // Modals visibility
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [missionsModalVisible, setMissionsModalVisible] = useState(false);
  const [addRecordModalVisible, setAddRecordModalVisible] = useState(false);

  // Format YYYY-MM-DD helper
  const formatDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Load Data for selected date
  const loadData = useCallback(async () => {
    const dateStr = formatDateString(selectedDate);
    const [acts, ms] = await Promise.all([
      recordService.getActivitiesByDate(dateStr),
      recordService.getMissionsByDate(dateStr),
    ]);
    setActivities(acts);
    setMissions(ms);
  }, [selectedDate]);

  useEffect(() => {
    petService.getPetInfo().then((info) => setPetName(info.name));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pet Name Save Handler
  const handleSavePetName = async (newName: string) => {
    const updated = await petService.updatePetName(newName);
    setPetName(updated.name);
  };

  // Date Shift Handler (+1 day or -1 day)
  const handleChangeDateByDay = (offset: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + offset);
    setSelectedDate(nextDate);
  };

  // Toggle Mission
  const handleToggleMission = async (missionId: string) => {
    const dateStr = formatDateString(selectedDate);
    const updatedMissions = await recordService.toggleMission(dateStr, missionId);
    setMissions(updatedMissions);
  };

  // Add Timeline Record
  const handleAddRecord = async (data: {
    title: string;
    description: string;
    category: ActivityCategory;
    time: string;
    location?: string;
  }) => {
    const dateStr = formatDateString(selectedDate);
    await recordService.addActivity({
      ...data,
      dateString: dateStr,
    });
    // Reload activities & summary
    loadData();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* 1. Header (Subtitle background removed) */}
        <Header
          petName={petName}
          onEditPetName={() => setPetModalVisible(true)}
        />

        {/* 2. In-place Expandable Calendar (Circle Date Indicator, In-place Expansion with '주간 보기' toggle) */}
        <WeeklyCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* 3 & 4 & 5. Combined Sheet (Frameless Stats + Timeline + Swipe Up to Fill Full Screen) */}
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

        {/* Modals */}
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
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
