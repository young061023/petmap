import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { MissionProgressBar } from '@/components/mission/MissionProgressBar';
import { MissionCategoryIcon, MissionSymbol } from '@/components/mission/MissionSymbol';
import { missionColors, missionRadius, missionSpacing } from '@/constants/missionTheme';
import {
  formatMissionProgress,
  getMissionProgressRatio,
  getMissionStatus,
} from '@/features/missions/missionUtils';
import type { Mission, MissionStatus } from '@/types/mission';

interface MissionCardProps {
  mission: Mission;
  isClaiming: boolean;
  onPress: () => void;
  onClaim: () => void;
}

const statusPresentation: Record<MissionStatus, { label: string; background: string; color: string }> = {
  inProgress: {
    label: '진행 중',
    background: missionColors.surface,
    color: missionColors.body,
  },
  completed: {
    label: '완료',
    background: missionColors.primaryWeak,
    color: missionColors.primary,
  },
  claimed: {
    label: '보상 받음',
    background: missionColors.successWeak,
    color: missionColors.success,
  },
};

export function MissionCard({ mission, isClaiming, onPress, onClaim }: MissionCardProps) {
  const status = getMissionStatus(mission);
  const presentation = statusPresentation[status];
  const progressText = formatMissionProgress(mission);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={`${mission.title}, ${presentation.label}, ${progressText}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.cardContent, pressed && styles.pressedCard]}
      >
        <View style={styles.topRow}>
          <MissionCategoryIcon category={mission.category} />
          <View style={styles.titleArea}>
            <View style={styles.titleRow}>
              <Text numberOfLines={2} style={styles.title}>
                {mission.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: presentation.background }]}>
                <Text style={[styles.statusText, { color: presentation.color }]}>{presentation.label}</Text>
              </View>
            </View>
            <Text numberOfLines={2} style={styles.description}>
              {mission.description}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MissionSymbol name="clock" size={16} color={missionColors.muted} />
            <Text style={styles.deadline}>{mission.deadlineLabel}</Text>
          </View>
          <View style={styles.rewardBadge}>
            <MissionSymbol name="gift" size={16} color={missionColors.warning} />
            <Text style={styles.rewardText}>+{mission.rewardPoints}P</Text>
          </View>
        </View>

        <MissionProgressBar
          value={getMissionProgressRatio(mission)}
          accessibilityLabel={`${mission.title} 진행률 ${progressText}`}
          color={status === 'claimed' ? missionColors.success : missionColors.primary}
        />
        <Text style={styles.progressText}>{progressText}</Text>
      </Pressable>

      {status === 'completed' && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isClaiming }}
          disabled={isClaiming}
          onPress={onClaim}
          style={({ pressed }) => [
            styles.claimButton,
            pressed && styles.claimButtonPressed,
            isClaiming && styles.claimButtonDisabled,
          ]}
        >
          {isClaiming ? (
            <ActivityIndicator color={missionColors.onPrimary} />
          ) : (
            <Text style={styles.claimButtonText}>보상 받기</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: missionColors.border,
    borderRadius: missionRadius.card,
    backgroundColor: missionColors.canvas,
  },
  cardContent: {
    padding: missionSpacing.lg,
  },
  pressedCard: {
    backgroundColor: '#FAFBFC',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: missionSpacing.md,
  },
  titleArea: {
    minWidth: 0,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: missionSpacing.sm,
  },
  title: {
    minWidth: 0,
    flex: 1,
    color: missionColors.foreground,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  statusBadge: {
    minHeight: 24,
    justifyContent: 'center',
    paddingHorizontal: missionSpacing.sm,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    marginTop: missionSpacing.xs,
    color: missionColors.body,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: missionSpacing.sm,
    marginTop: missionSpacing.lg,
    marginBottom: missionSpacing.md,
  },
  metaItem: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: missionSpacing.sm,
  },
  deadline: {
    flexShrink: 1,
    color: missionColors.muted,
    fontSize: 13,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: missionSpacing.xs,
    paddingHorizontal: missionSpacing.sm,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: missionColors.warningWeak,
  },
  rewardText: {
    color: '#8A5A00',
    fontSize: 13,
    fontWeight: '700',
  },
  progressText: {
    marginTop: missionSpacing.sm,
    color: missionColors.body,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  claimButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: missionSpacing.lg,
    marginBottom: missionSpacing.lg,
    paddingHorizontal: missionSpacing.lg,
    borderRadius: 14,
    backgroundColor: missionColors.primary,
  },
  claimButtonPressed: {
    backgroundColor: missionColors.primaryPressed,
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonText: {
    color: missionColors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
