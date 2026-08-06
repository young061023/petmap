import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CircularGraph } from './CircularGraph';
import { MissionItem } from '../types/record';
import { theme } from '../theme/theme';
import { CheckCircle2, FileText } from 'lucide-react-native';

interface StatsSectionProps {
  recordCount: number;
  missions: MissionItem[];
  onOpenMissions: () => void;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  recordCount,
  missions,
  onOpenMissions,
}) => {
  const completedMissions = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length || 1;

  return (
    <View style={styles.container}>
      {/* Stat 1: Today's Record Count */}
      <View style={styles.statItem}>
        <View style={styles.statInfo}>
          <View style={styles.badgeRow}>
            <FileText size={13} color={theme.colors.pastelPinkDark} />
            <Text style={styles.statTitle}>오늘 기록한 횟수</Text>
          </View>
          <Text style={styles.statSubtext}>추억 스토리가 쌓여가는 중</Text>
        </View>
        <CircularGraph
          size={56}
          strokeWidth={5}
          value={recordCount}
          targetValue={5}
          color={theme.colors.pastelPinkDark} // #F4ADCF
          trackColor="#FFE7FF" // #FFE7FF
          unit="회"
        />
      </View>

      <View style={styles.divider} />

      {/* Stat 2: Completed Missions */}
      <Pressable
        style={({ pressed }) => [
          styles.statItem,
          pressed && styles.itemPressed,
        ]}
        onPress={onOpenMissions}
      >
        <View style={styles.statInfo}>
          <View style={styles.badgeRow}>
            <CheckCircle2 size={13} color="#2CA58D" />
            <Text style={styles.statTitle}>완료한 미션</Text>
          </View>
          <Text style={styles.statSubtext}>
            {completedMissions === totalMissions
              ? '오늘 미션 모두 완료! 🎉'
              : '터치하여 미션 체크'}
          </Text>
        </View>
        <CircularGraph
          size={56}
          strokeWidth={5}
          value={completedMissions}
          targetValue={totalMissions}
          color="#2CA58D"
          trackColor="#EAFDF7"
          unit="개"
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF', // Pure White as requested!
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  itemPressed: {
    opacity: 0.6,
  },
  statInfo: {
    flex: 1,
    paddingRight: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  statTitle: {
    fontFamily: 'NanumSquareRound',
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  statSubtext: {
    fontFamily: 'NanumSquareRound',
    fontSize: 11,
    color: theme.colors.textSub,
  },
});
