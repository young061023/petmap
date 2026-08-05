import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { missionColors } from '@/constants/missionTheme';
import { MissionProvider } from '@/features/missions/MissionProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MissionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: missionColors.canvas },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="missions/[missionId]" />
        </Stack>
      </MissionProvider>
    </SafeAreaProvider>
  );
}
