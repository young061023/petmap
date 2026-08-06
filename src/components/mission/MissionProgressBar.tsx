import { StyleSheet, View } from 'react-native';

import { missionColors } from '@/constants/missionTheme';

interface MissionProgressBarProps {
  value: number;
  accessibilityLabel: string;
  color?: string;
  trackColor?: string;
  height?: number;
}

export function MissionProgressBar({
  value,
  accessibilityLabel,
  color = missionColors.primary,
  trackColor = missionColors.surface,
  height = 8,
}: MissionProgressBarProps) {
  const percentage = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const width = `${percentage}%` as `${number}%`;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={[styles.track, { height, backgroundColor: trackColor }]}
    >
      <View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
