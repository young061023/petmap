import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { missionColors } from '@/constants/missionTheme';
import type { MissionCategory } from '@/types/mission';

export type MissionSymbolName =
  | MissionCategory
  | 'back'
  | 'check'
  | 'clock'
  | 'fire'
  | 'gift'
  | 'lock'
  | 'star';

const symbolNames: Record<MissionSymbolName, SymbolViewProps['name']> = {
  walk: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  place: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  training: { ios: 'target', android: 'track_changes', web: 'track_changes' },
  bonding: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  photo: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  fire: {
    ios: 'flame.fill',
    android: 'local_fire_department',
    web: 'local_fire_department',
  },
  gift: { ios: 'gift.fill', android: 'redeem', web: 'redeem' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  star: { ios: 'star.circle.fill', android: 'stars', web: 'stars' },
};

const categoryColors: Record<MissionCategory, { background: string; foreground: string }> = {
  walk: { background: missionColors.primaryWeak, foreground: missionColors.primary },
  place: { background: missionColors.warningWeak, foreground: missionColors.warning },
  training: { background: missionColors.successWeak, foreground: missionColors.success },
  bonding: { background: missionColors.coralWeak, foreground: missionColors.coral },
  photo: { background: '#F3EDFF', foreground: '#7C4DFF' },
};

interface MissionSymbolProps {
  name: MissionSymbolName;
  size?: number;
  color?: string;
}

export function MissionSymbol({ name, size = 24, color = missionColors.body }: MissionSymbolProps) {
  return (
    <SymbolView
      name={symbolNames[name]}
      size={size}
      tintColor={color}
      style={{ width: size, height: size }}
    />
  );
}

interface MissionCategoryIconProps {
  category: MissionCategory;
  size?: number;
}

export function MissionCategoryIcon({ category, size = 48 }: MissionCategoryIconProps) {
  const colors = categoryColors[category];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.categoryIcon, { width: size, height: size, backgroundColor: colors.background }]}
    >
      <MissionSymbol name={category} size={Math.round(size * 0.5)} color={colors.foreground} />
    </View>
  );
}

const styles = StyleSheet.create({
  categoryIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexShrink: 0,
  },
});
