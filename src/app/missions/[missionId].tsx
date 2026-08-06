import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MissionProgressBar } from '@/components/mission/MissionProgressBar';
import { MissionCategoryIcon, MissionSymbol } from '@/components/mission/MissionSymbol';
import { missionColors, missionRadius, missionSpacing } from '@/constants/missionTheme';
import { useMissions } from '@/features/missions/MissionProvider';
import {
  formatMissionProgress,
  getMissionProgressRatio,
  getMissionStatus,
} from '@/features/missions/missionUtils';

export default function MissionDetailScreen() {
  const params = useLocalSearchParams<{ missionId?: string | string[] }>();
  const missionId = Array.isArray(params.missionId) ? params.missionId[0] : params.missionId;
  const { missions, isLoading, errorMessage, claimingMissionId, claimReward } = useMissions();
  const mission = missions.find((item) => item.id === missionId);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={missionColors.primary} size="large" />
          <Text style={styles.loadingText}>미션을 불러오고 있어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!mission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <MissionSymbol name="lock" size={44} color={missionColors.muted} />
          <Text style={styles.notFoundTitle}>미션을 찾을 수 없어요</Text>
          <Text style={styles.notFoundDescription}>종료되었거나 존재하지 않는 미션이에요.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
          >
            <Text style={styles.secondaryButtonText}>미션 목록으로</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const status = getMissionStatus(mission);
  const progressText = formatMissionProgress(mission);
  const isClaiming = claimingMissionId === mission.id;
  const categoryLabel = {
    walk: '산책',
    place: '장소 탐험',
    training: '산책 훈련',
    bonding: '교감',
    photo: '산책 사진',
  }[mission.category];

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={8}
          onPress={goBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <MissionSymbol name="back" size={24} color={missionColors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>미션 상세</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <MissionCategoryIcon category={mission.category} size={64} />
          <Text style={styles.categoryLabel}>{categoryLabel}</Text>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.description}>{mission.description}</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeading}>
            <Text style={styles.progressTitle}>현재 진행률</Text>
            <Text style={styles.progressValue}>{progressText}</Text>
          </View>
          <MissionProgressBar
            value={getMissionProgressRatio(mission)}
            accessibilityLabel={`${mission.title} 진행률 ${progressText}`}
            color={status === 'claimed' ? missionColors.success : missionColors.primary}
            height={10}
          />
          <View style={styles.deadlineRow}>
            <MissionSymbol name="clock" size={17} color={missionColors.muted} />
            <Text style={styles.deadline}>{mission.deadlineLabel}</Text>
          </View>
        </View>

        <View style={styles.rewardSection}>
          <View style={styles.rewardIcon}>
            <MissionSymbol name="gift" size={26} color={missionColors.warning} />
          </View>
          <View style={styles.rewardCopy}>
            <Text style={styles.rewardLabel}>완료 보상</Text>
            <Text style={styles.rewardValue}>{mission.rewardPoints} 포인트</Text>
          </View>
          {status === 'claimed' && (
            <View style={styles.claimedBadge}>
              <MissionSymbol name="check" size={17} color={missionColors.success} />
              <Text style={styles.claimedText}>받음</Text>
            </View>
          )}
        </View>

        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>이렇게 달성해요</Text>
          {mission.instructions.map((instruction, index) => (
            <View key={instruction} style={styles.instructionRow}>
              <View style={[styles.stepNumber, status !== 'inProgress' && styles.completedStep]}>
                {status === 'inProgress' ? (
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                ) : (
                  <MissionSymbol name="check" size={20} color={missionColors.success} />
                )}
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>

        {errorMessage && (
          <Text accessibilityLiveRegion="polite" style={styles.errorMessage}>
            {errorMessage}
          </Text>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: status !== 'completed' || isClaiming }}
          disabled={status !== 'completed' || isClaiming}
          onPress={() => {
            void claimReward(mission.id);
          }}
          style={({ pressed }) => [
            styles.actionButton,
            status === 'claimed' && styles.claimedButton,
            status === 'inProgress' && styles.inProgressButton,
            pressed && status === 'completed' && styles.actionButtonPressed,
          ]}
        >
          {isClaiming ? (
            <ActivityIndicator color={missionColors.onPrimary} />
          ) : status === 'claimed' ? (
            <View style={styles.actionLabelRow}>
              <MissionSymbol name="check" size={22} color={missionColors.success} />
              <Text style={styles.claimedButtonText}>보상을 받았어요</Text>
            </View>
          ) : status === 'completed' ? (
            <Text style={styles.actionButtonText}>{mission.rewardPoints}P 보상 받기</Text>
          ) : (
            <Text style={styles.inProgressButtonText}>미션 진행 중</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: missionColors.canvas,
  },
  header: {
    width: '100%',
    maxWidth: 680,
    minHeight: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: missionSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: missionColors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  backButtonPressed: {
    backgroundColor: missionColors.surface,
  },
  headerTitle: {
    color: missionColors.foreground,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: missionSpacing.lg,
    paddingBottom: missionSpacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: missionSpacing.xxl,
    paddingBottom: missionSpacing.xl,
  },
  categoryLabel: {
    marginTop: missionSpacing.md,
    color: missionColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    marginTop: missionSpacing.sm,
    color: missionColors.foreground,
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: missionSpacing.sm,
    color: missionColors.body,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  progressSection: {
    padding: missionSpacing.lg,
    borderRadius: missionRadius.card,
    backgroundColor: missionColors.surface,
  },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: missionSpacing.lg,
    marginBottom: missionSpacing.md,
  },
  progressTitle: {
    color: missionColors.body,
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    color: missionColors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: missionSpacing.sm,
    marginTop: missionSpacing.md,
  },
  deadline: {
    color: missionColors.muted,
    fontSize: 13,
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: missionSpacing.lg,
    paddingVertical: missionSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: missionColors.border,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: missionColors.warningWeak,
  },
  rewardCopy: {
    flex: 1,
    marginLeft: missionSpacing.md,
  },
  rewardLabel: {
    color: missionColors.muted,
    fontSize: 13,
  },
  rewardValue: {
    marginTop: missionSpacing.xs,
    color: missionColors.foreground,
    fontSize: 18,
    fontWeight: '700',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: missionSpacing.xs,
    paddingHorizontal: missionSpacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: missionColors.successWeak,
  },
  claimedText: {
    color: missionColors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  instructionsSection: {
    paddingTop: missionSpacing.xl,
  },
  instructionsTitle: {
    marginBottom: missionSpacing.lg,
    color: missionColors.foreground,
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '700',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: missionSpacing.md,
    marginBottom: missionSpacing.lg,
  },
  stepNumber: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: missionColors.surface,
  },
  completedStep: {
    backgroundColor: missionColors.successWeak,
  },
  stepNumberText: {
    color: missionColors.body,
    fontSize: 13,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    paddingTop: 3,
    color: missionColors.body,
    fontSize: 15,
    lineHeight: 22,
  },
  errorMessage: {
    padding: missionSpacing.md,
    borderRadius: 8,
    color: '#B42318',
    backgroundColor: missionColors.coralWeak,
    fontSize: 14,
    lineHeight: 21,
  },
  bottomBar: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: missionSpacing.lg,
    paddingTop: missionSpacing.md,
    paddingBottom: missionSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: missionColors.border,
    backgroundColor: missionColors.canvas,
  },
  actionButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: missionSpacing.lg,
    borderRadius: missionRadius.button,
    backgroundColor: missionColors.primary,
  },
  actionButtonPressed: {
    backgroundColor: missionColors.primaryPressed,
  },
  actionButtonText: {
    color: missionColors.onPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  claimedButton: {
    backgroundColor: missionColors.successWeak,
  },
  inProgressButton: {
    backgroundColor: missionColors.surface,
  },
  actionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: missionSpacing.sm,
  },
  claimedButtonText: {
    color: missionColors.success,
    fontSize: 17,
    fontWeight: '700',
  },
  inProgressButtonText: {
    color: missionColors.muted,
    fontSize: 17,
    fontWeight: '700',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: missionSpacing.md,
    color: missionColors.muted,
    fontSize: 14,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: missionSpacing.xl,
  },
  notFoundTitle: {
    marginTop: missionSpacing.lg,
    color: missionColors.foreground,
    fontSize: 20,
    fontWeight: '700',
  },
  notFoundDescription: {
    marginTop: missionSpacing.sm,
    color: missionColors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: missionSpacing.xl,
    paddingHorizontal: missionSpacing.xl,
    borderRadius: 14,
    backgroundColor: missionColors.primaryWeak,
  },
  secondaryButtonPressed: {
    backgroundColor: '#D9EBFF',
  },
  secondaryButtonText: {
    color: missionColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
