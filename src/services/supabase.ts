import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const serverStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => undefined,
  removeItem: async (_key: string) => undefined,
};

// expo-secure-store backs onto iOS Keychain / Android Keystore-encrypted prefs,
// so the Supabase session (access + refresh token) isn't left as plaintext on
// disk the way AsyncStorage leaves it. SecureStore has no native equivalent on
// web, so that platform keeps using AsyncStorage (browser storage is already
// the best available option there).
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const sessionStorage =
  Platform.OS === 'web' && typeof window === 'undefined'
    ? serverStorage
    : Platform.OS === 'web'
      ? AsyncStorage
      : secureStoreAdapter;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase 환경변수가 없습니다. .env.example을 참고해 .env를 설정해 주세요.');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabasePublishableKey ?? 'placeholder-key',
  {
    auth: {
      storage: sessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
