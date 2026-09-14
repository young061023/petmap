import type { RadialTabBarProps as BottomTabBarProps } from './RadialTabBar';
import { Map, Trophy, FileText, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

export function TravelTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabs = [{ name: 'index', label: '지도', Icon: Map }, { name: 'mission', label: '미션', Icon: Trophy }, { name: 'records', label: '기록', Icon: FileText }, { name: 'mypage', label: '마이', Icon: User }];
  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>{tabs.map(({ name, label, Icon }) => {
    const route = state.routes.find(item => item.name === name);
    if (!route) return null;
    const selected = state.routes[state.index]?.key === route.key;
    return <Pressable key={name} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} style={styles.item} onPress={() => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    }} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}><View style={[styles.pill, selected && styles.active]}><Icon size={22} color={selected ? colors.primary : colors.body} /><Text style={[styles.label, selected && styles.selected]}>{label}</Text></View></Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({ bar: { flexDirection: 'row', paddingTop: 7, paddingHorizontal: 12, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.canvas }, item: { flex: 1, alignItems: 'center' }, pill: { minWidth: 66, minHeight: 56, padding: 7, borderRadius: 17, alignItems: 'center', justifyContent: 'center', gap: 5 }, active: { backgroundColor: colors.primaryWeak }, label: { fontSize: 11, color: colors.body }, selected: { color: colors.primary, fontWeight: '700' } });
