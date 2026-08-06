import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/components/useColorScheme';
import { useClientOnlyValue } from '@/src/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '지도',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'map', android: 'map', web: 'map' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '기록',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'pawprint', android: 'pets', web: 'pets' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: '미션',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'checkmark.seal', android: 'task_alt', web: 'task_alt' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'person.circle', android: 'account_circle', web: 'account_circle' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
