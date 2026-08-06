import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MissionCard } from '@/components/mission/MissionCard';
import { MissionEmptyState } from '@/components/mission/MissionEmptyState';
import { MissionOverview } from '@/components/mission/MissionOverview';
import { MissionSegmentedControl, type MissionSegmentOption } from '@/components/mission/MissionSegmentedControl';
import { missionColors, missionSpacing } from '@/constants/missionTheme';
import { useMissions } from '@/features/missions/MissionProvider';
import { getMissionStatus, matchesMissionFilter } from '@/features/missions/missionUtils';
import type { MissionFilter, MissionPeriod } from '@/types/mission';

const periodOptions: readonly MissionSegmentOption<MissionPeriod>[] = [
  { value: 'daily', label: '오늘' },
  { value: 'weekly', label: '이번 주' },
];
const filterOptions: readonly MissionSegmentOption<MissionFilter>[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '진행 중' },
  { value: 'done', label: '완료' },
];

export default function MissionScreen() {
  const { missions, points, streakDays, isLoading, errorMessage, claimingMissionId, claimReward } = useMissions();
  const [period, setPeriod] = useState<MissionPeriod>('daily');
  const [filter, setFilter] = useState<MissionFilter>('all');
  const dailyMissions = useMemo(() => missions.filter((mission) => mission.period === 'daily'), [missions]);
  const visibleMissions = useMemo(() => missions.filter((mission) => mission.period === period && matchesMissionFilter(mission, filter)), [filter, missions, period]);
  const completedDailyCount = dailyMissions.filter((mission) => getMissionStatus(mission) !== 'inProgress').length;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MissionOverview points={points} streakDays={streakDays} completedCount={completedDailyCount} totalCount={dailyMissions.length} />
        <View style={styles.content}>
          <MissionSegmentedControl accessibilityLabel="미션 기간" value={period} options={periodOptions} onChange={setPeriod} />
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{period === 'daily' ? '오늘의 미션' : '주간 미션'}</Text>
              <Text style={styles.sectionSubtitle}>{period === 'daily' ? '매일 자정에 새로운 미션으로 바뀌어요.' : '매주 월요일에 새로운 미션이 시작돼요.'}</Text>
            </View>
            <Text style={styles.missionCount}>{visibleMissions.length}개</Text>
          </View>
          <MissionSegmentedControl accessibilityLabel="미션 상태" value={filter} options={filterOptions} onChange={setFilter} compact />
          {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
          {isLoading ? (
            <View style={styles.loadingState}><ActivityIndicator color={missionColors.primary} size="large" /><Text style={styles.loadingText}>미션을 불러오고 있어요</Text></View>
          ) : visibleMissions.length ? (
            <View style={styles.missionList}>{visibleMissions.map((mission) => <MissionCard key={mission.id} mission={mission} isClaiming={claimingMissionId === mission.id} onPress={() => router.push({ pathname: '/missions/[missionId]', params: { missionId: mission.id } })} onClaim={() => void claimReward(mission.id)} />)}</View>
          ) : <MissionEmptyState />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: missionColors.canvas }, scrollContent: { paddingBottom: 40 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: missionSpacing.lg, paddingTop: missionSpacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: missionSpacing.lg, marginTop: missionSpacing.xxl, marginBottom: missionSpacing.lg },
  sectionTitle: { color: missionColors.foreground, fontSize: 22, lineHeight: 30, fontWeight: '700' },
  sectionSubtitle: { marginTop: missionSpacing.xs, color: missionColors.muted, fontSize: 14, lineHeight: 21 },
  missionCount: { flexShrink: 0, paddingTop: 4, color: missionColors.primary, fontSize: 14, fontWeight: '700' },
  errorMessage: { marginTop: missionSpacing.lg, padding: missionSpacing.md, borderRadius: 8, color: '#B42318', backgroundColor: missionColors.coralWeak, fontSize: 14, lineHeight: 21 },
  loadingState: { minHeight: 240, alignItems: 'center', justifyContent: 'center' }, loadingText: { marginTop: missionSpacing.md, color: missionColors.muted, fontSize: 14 },
  missionList: { gap: missionSpacing.md, marginTop: missionSpacing.lg },
});
