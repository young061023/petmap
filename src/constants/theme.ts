import { Platform } from 'react-native';

export const colors = {
  primary: '#2F8F67',
  primaryPressed: '#247454',
  primaryWeak: '#EAF7F0',
  accent: '#FF8A4C',
  canvas: '#F7F8F6',
  surface: '#FFFFFF',
  text: '#17211C',
  body: '#4E5C54',
  muted: '#8A958E',
  border: '#E2E7E3',
  danger: '#D92D20',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Colors = {
  light: { text: colors.text, background: colors.surface, backgroundElement: '#F0F0F3', backgroundSelected: colors.primaryWeak, textSecondary: colors.body },
  dark: { text: '#FFFFFF', background: '#000000', backgroundElement: '#212225', backgroundSelected: '#2E3135', textSecondary: '#B0B4BA' },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'system-ui, sans-serif', serif: 'Georgia, serif', rounded: 'system-ui, sans-serif', mono: 'monospace' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
