import { Platform } from 'react-native';

export const colors = {
  primary: '#A85335',
  primaryFill: '#F2B293',
  onPrimary: '#3C2F2A',
  primaryPressed: '#E7A17F',
  primaryWeak: '#FBECE3',
  accent: '#A85335',
  canvas: '#FFF9F5',
  surface: '#FFFFFF',
  text: '#3C2F2A',
  body: '#78675F',
  muted: '#78675F',
  border: '#EADDD4',
  danger: '#D92D20',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Colors = {
  light: { text: colors.text, background: colors.surface, backgroundElement: colors.canvas, backgroundSelected: colors.primaryWeak, textSecondary: colors.body },
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
