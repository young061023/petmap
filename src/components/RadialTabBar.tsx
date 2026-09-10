import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PawPrint, X } from 'lucide-react-native';

import { colors } from '@/constants/theme';

type TabsProps = ComponentProps<typeof Tabs>;
export type RadialTabBarProps = NonNullable<TabsProps['tabBar']> extends (props: infer P) => unknown ? P : never;

// Pokémon GO-style speed-dial: a single floating center button that fans the
// other destinations out above it instead of a static row of tab buttons.
const FLOAT_MARGIN = 16; // gap between the button and the screen's bottom edge
const CENTER_SIZE = 60;
const ITEM_SIZE = 50;
const RADIUS = 104;
const ANGLE_STEP = 40; // degrees between adjacent fanned items

function fanOffset(index: number, count: number) {
  const spread = ANGLE_STEP * (count - 1);
  const angleDeg = -spread / 2 + index * ANGLE_STEP;
  const angleRad = (angleDeg * Math.PI) / 180;
  return { dx: RADIUS * Math.sin(angleRad), dy: -RADIUS * Math.cos(angleRad) };
}

export function RadialTabBar({ state, descriptors, navigation }: RadialTabBarProps) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  // Never leave the menu stuck open after a navigation happens some other way.
  useEffect(() => {
    setExpanded(false);
    progress.setValue(0);
  }, [state.index, progress]);

  const setExpandedAnimated = (next: boolean) => {
    setExpanded(next);
    Animated.spring(progress, { toValue: next ? 1 : 0, useNativeDriver: true, friction: 8, tension: 60 }).start();
  };

  const anchorBottom = insets.bottom + FLOAT_MARGIN;

  return (
    <View style={styles.bar} pointerEvents="box-none">
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const { dx, dy } = fanOffset(index, state.routes.length);

        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
          setExpandedAnimated(false);
        };

        return (
          <Animated.View
            key={route.key}
            pointerEvents={expanded ? 'auto' : 'none'}
            style={[
              styles.fanItem,
              { bottom: anchorBottom, opacity: progress, transform: [{ translateX }, { translateY }, { scale }] },
            ]}
          >
            {options.title ? (
              <View style={styles.fanLabelWrap}>
                <Text style={styles.fanLabel} numberOfLines={1}>{options.title}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={onPress}
              style={[styles.fanButton, isFocused && styles.fanButtonActive]}
              accessibilityRole="button"
              accessibilityLabel={typeof options.title === 'string' ? options.title : route.name}
            >
              {options.tabBarIcon?.({ focused: isFocused, color: isFocused ? colors.surface : colors.primary, size: 22 })}
            </Pressable>
          </Animated.View>
        );
      })}

      <Pressable
        onPress={() => setExpandedAnimated(!expanded)}
        style={[styles.centerButton, { bottom: anchorBottom }]}
        accessibilityRole="button"
        accessibilityLabel={expanded ? '메뉴 닫기' : '메뉴 열기'}
      >
        <Animated.View
          style={[styles.centerIconLayer, { opacity: progress.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' }) }]}
        >
          <PawPrint color={colors.surface} size={26} />
        </Animated.View>
        <Animated.View
          style={[styles.centerIconLayer, { opacity: progress.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: 'clamp' }) }]}
        >
          <X color={colors.surface} size={26} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    height: 0,
    overflow: 'visible',
  },
  centerButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: -CENTER_SIZE / 2,
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 2,
  },
  fanItem: {
    position: 'absolute',
    left: '50%',
    marginLeft: -ITEM_SIZE / 2,
    alignItems: 'center',
    zIndex: 1,
  },
  fanButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fanButtonActive: {
    backgroundColor: colors.primary,
  },
  fanLabelWrap: {
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(23,33,28,0.72)',
  },
  fanLabel: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
  centerIconLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
