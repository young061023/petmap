import { Pressable, StyleSheet, Text, View } from 'react-native';

import { missionColors, missionRadius, missionSpacing } from '@/constants/missionTheme';

export interface MissionSegmentOption<T extends string> {
  value: T;
  label: string;
}

interface MissionSegmentedControlProps<T extends string> {
  accessibilityLabel: string;
  value: T;
  options: readonly MissionSegmentOption<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
}

export function MissionSegmentedControl<T extends string>({
  accessibilityLabel,
  value,
  options,
  onChange,
  compact = false,
}: MissionSegmentedControlProps<T>) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.container}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              compact && styles.compactSegment,
              isSelected && styles.selectedSegment,
              pressed && !isSelected && styles.pressedSegment,
            ]}
          >
            <Text style={[styles.label, compact && styles.compactLabel, isSelected && styles.selectedLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: missionSpacing.xs,
    width: '100%',
    padding: missionSpacing.xs,
    borderRadius: missionRadius.control,
    backgroundColor: missionColors.surface,
  },
  segment: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: missionSpacing.md,
    borderRadius: 8,
  },
  compactSegment: {
    minHeight: 38,
  },
  selectedSegment: {
    backgroundColor: missionColors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: missionColors.border,
  },
  pressedSegment: {
    backgroundColor: missionColors.border,
  },
  label: {
    color: missionColors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  compactLabel: {
    fontSize: 14,
  },
  selectedLabel: {
    color: missionColors.foreground,
  },
});
