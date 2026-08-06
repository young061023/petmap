import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/AuthProvider';

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} /></AuthProvider></SafeAreaProvider>;
}
