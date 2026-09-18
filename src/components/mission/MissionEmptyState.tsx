import { StyleSheet, Text, View } from 'react-native';

import { MissionSymbol } from '@/components/mission/MissionSymbol';
import { missionColors, missionSpacing } from '@/constants/missionTheme';

export function MissionEmptyState() {
  return (
    <View style={styles.container}>
      <MissionSymbol name="check" size={40} color={missionColors.success} />
      <Text style={styles.title}>조건에 맞는 미션이 없어요</Text>
      <Text style={styles.description}>다른 상태를 선택해 남은 미션을 확인해 보세요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: missionSpacing.xl,
    paddingVertical: 48,
  },
  title: {
    marginTop: missionSpacing.lg,
    color: missionColors.foreground,
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    marginTop: missionSpacing.sm,
    color: missionColors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
