import { StyleSheet, Text, View } from 'react-native';

import { MissionProgressBar } from '@/components/mission/MissionProgressBar';
import { MissionSymbol } from '@/components/mission/MissionSymbol';
import { missionColors, missionSpacing } from '@/constants/missionTheme';

interface MissionOverviewProps {
  points: number;
  streakDays: number;
  completedCount: number;
  totalCount: number;
}

export function MissionOverview({
  points,
  streakDays,
  completedCount,
  totalCount,
}: MissionOverviewProps) {
  const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>미션</Text>
      <Text style={styles.subtitle}>반려동물과 함께 오늘도 한 걸음</Text>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <View style={styles.metricLabelRow}>
            <MissionSymbol name="star" size={18} color={missionColors.onPrimary} />
            <Text style={styles.metricLabel}>내 포인트</Text>
          </View>
          <Text style={styles.metricValue}>{points.toLocaleString('ko-KR')}P</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metric}>
          <View style={styles.metricLabelRow}>
            <MissionSymbol name="fire" size={18} color={missionColors.onPrimary} />
            <Text style={styles.metricLabel}>연속 달성</Text>
          </View>
          <Text style={styles.metricValue}>{streakDays}일</Text>
        </View>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>오늘의 달성률</Text>
        <Text style={styles.progressValue}>
          {completedCount}/{totalCount}
        </Text>
      </View>
      <MissionProgressBar
        value={completionRatio}
        accessibilityLabel={`오늘의 미션 ${totalCount}개 중 ${completedCount}개 달성`}
        color={missionColors.onPrimary}
        trackColor="rgba(255, 255, 255, 0.28)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: missionSpacing.xl,
    paddingTop: missionSpacing.lg,
    paddingBottom: missionSpacing.xxl,
    backgroundColor: missionColors.primary,
  },
  title: {
    color: missionColors.onPrimary,
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: missionSpacing.xs,
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 15,
    lineHeight: 22,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: missionSpacing.xl,
  },
  metric: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: missionSpacing.sm,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  metricValue: {
    marginTop: missionSpacing.sm,
    color: missionColors.onPrimary,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: missionSpacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: missionSpacing.xl,
    marginBottom: missionSpacing.sm,
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 13,
    fontWeight: '500',
  },
  progressValue: {
    color: missionColors.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
