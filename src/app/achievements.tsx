import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Medal } from 'lucide-react-native';

import { ACHIEVEMENT_CATEGORIES } from '@/constants/achievements';
import { colors, spacing } from '@/constants/theme';
import { useAchievements } from '@/features/achievements/AchievementProvider';
import type { AchievementCategory } from '@/types/achievement';

export default function AchievementsScreen() {
  const { achievements, unlockedCount, isLoading, refresh } = useAchievements();
  const [filter, setFilter] = useState<AchievementCategory>('exploration');

  useEffect(() => { void refresh(); }, [refresh]);
  const visible = useMemo(() => achievements
    .filter((achievement) => achievement.category === filter)
    .sort((left, right) => {
      if (left.unlocked !== right.unlocked) return left.unlocked ? -1 : 1;
      if (left.unlocked && right.unlocked) {
        return new Date(right.unlockedAt ?? 0).getTime() - new Date(left.unlockedAt ?? 0).getTime();
      }
      return 0;
    }), [achievements, filter]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>‹ 마이페이지</Text></Pressable>
        <View>
          <Text style={styles.title}>업적 배지</Text>
          <Text style={styles.subtitle}>{achievements.length}개 중 {unlockedCount}개를 획득했어요.</Text>
        </View>
        <View style={styles.summary}>
          <Medal size={34} color={colors.primary} />
          <View style={styles.summaryCopy}><Text style={styles.summaryValue}>{unlockedCount}</Text><Text style={styles.summaryLabel}>획득한 배지</Text></View>
          <Text style={styles.summaryPercent}>{achievements.length ? Math.round(unlockedCount / achievements.length * 100) : 0}%</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {ACHIEVEMENT_CATEGORIES.map((category) => <Pressable key={category.id} onPress={() => setFilter(category.id)} style={[styles.filter, filter === category.id && styles.filterActive]}><Text style={[styles.filterText, filter === category.id && styles.filterTextActive]}>{category.label}</Text></Pressable>)}
        </ScrollView>
        {isLoading ? <ActivityIndicator color={colors.primary} /> : <View style={styles.list}>
          {visible.map((achievement) => {
            const percent = Math.min(100, achievement.progress / achievement.target * 100);
            const BadgeIcon = achievement.unlocked ? achievement.icon : Lock;
            return <View key={achievement.id} style={[styles.card, achievement.unlocked && styles.cardUnlocked]}>
              <View style={[styles.badge, !achievement.unlocked && styles.badgeLocked]}><BadgeIcon size={28} color={achievement.unlocked ? colors.primary : colors.muted} /></View>
              <View style={styles.cardCopy}><View style={styles.cardHeading}><Text style={styles.name}>{achievement.name}</Text>{achievement.unlocked ? <Text style={styles.unlocked}>획득</Text> : null}</View><Text style={styles.description}>{achievement.description}</Text><View style={styles.progressRow}><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View><Text style={styles.progressText}>{achievement.progress}/{achievement.target}</Text></View></View>
            </View>;
          })}
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: spacing.xl, paddingBottom: 48, gap: spacing.xl },
  back: { color: colors.body, fontSize: 16 }, title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: spacing.sm, color: colors.body, fontSize: 15 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: 20, borderRadius: 24, backgroundColor: colors.primaryWeak },
  summaryCopy: { flex: 1 }, summaryValue: { color: colors.text, fontSize: 28, fontWeight: '800' },
  summaryLabel: { color: colors.body, fontSize: 13 }, summaryPercent: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  filters: { gap: spacing.sm }, filter: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.primaryFill }, filterText: { color: colors.body, fontSize: 13, fontWeight: '600' }, filterTextActive: { color: colors.onPrimary },
  list: { gap: spacing.md }, card: { flexDirection: 'row', gap: spacing.md, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, opacity: 0.72 },
  cardUnlocked: { borderColor: colors.primaryFill, opacity: 1 }, badge: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.primaryWeak },
  badgeLocked: { backgroundColor: colors.canvas }, cardCopy: { flex: 1, gap: 7 }, cardHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' }, unlocked: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  description: { color: colors.body, fontSize: 13, lineHeight: 19 }, progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressTrack: { flex: 1, height: 7, overflow: 'hidden', borderRadius: 4, backgroundColor: colors.border }, progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primaryFill },
  progressText: { minWidth: 40, textAlign: 'right', color: colors.body, fontSize: 11 },
});
