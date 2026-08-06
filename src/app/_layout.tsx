import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { MissionProvider } from '@/features/missions/MissionProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MissionProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="missions/index" />
            <Stack.Screen name="missions/[missionId]" />
          </Stack>
        </MissionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
