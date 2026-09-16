import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { colors } from '@/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { AchievementProvider } from '@/features/achievements/AchievementProvider';
import { MissionProvider } from '@/features/missions/MissionProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.canvas, card: colors.surface, text: colors.text, primary: colors.primary, border: colors.border } }}>
        <AuthProvider>
          <MissionProvider>
            <AchievementProvider>
              <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="pet-profile" />
              <Stack.Screen name="privacy-settings" />
              <Stack.Screen name="customer-support" />
              <Stack.Screen name="achievements" />
              <Stack.Screen name="missions/[missionId]" />
              </Stack>
            </AchievementProvider>
          </MissionProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
