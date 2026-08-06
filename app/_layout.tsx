import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    // Inject NanumSquareRound web font for web platform preview
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontId = 'nanum-square-round-font';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquareRound.css';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.innerHTML = `
          * {
            font-family: 'NanumSquareRound', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
          body, html {
            background-color: #FFE7FF !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: '#FFE7FF' }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFE7FF' },
        }}
      />
    </SafeAreaProvider>
  );
}
