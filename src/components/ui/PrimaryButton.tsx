import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/theme';

interface PrimaryButtonProps { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; variant?: 'filled' | 'weak'; }

export function PrimaryButton({ label, onPress, disabled, loading, variant = 'filled' }: PrimaryButtonProps) {
  const inactive = disabled || loading;
  return <Pressable accessibilityRole="button" disabled={inactive} onPress={onPress} style={({ pressed }) => [styles.button, variant === 'weak' && styles.weak, pressed && !inactive && styles.pressed, inactive && styles.disabled]}>
    {loading ? <ActivityIndicator color={variant === 'filled' ? colors.surface : colors.primary} /> : <Text style={[styles.label, variant === 'weak' && styles.weakLabel]}>{label}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  weak: { backgroundColor: colors.primaryWeak }, pressed: { opacity: 0.82 }, disabled: { opacity: 0.45 },
  label: { color: colors.surface, fontSize: 17, fontWeight: '700' }, weakLabel: { color: colors.primary },
});
