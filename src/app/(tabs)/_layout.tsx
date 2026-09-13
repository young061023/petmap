import { Redirect, Tabs } from 'expo-router';
import { ClipboardList, Map, Target, User } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { RadialTabBar } from '@/components/RadialTabBar';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';

export default function TabLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.appFrame}><Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }} tabBar={(props) => <RadialTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: '지도',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '기록',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mission"
        options={{
          title: '미션',
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs></View>
  );
}

const styles = StyleSheet.create({
  appFrame: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: colors.canvas },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
