import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

interface FormFieldProps extends TextInputProps { label: string; error?: string; }
export function FormField({ label, error, ...props }: FormFieldProps) {
  return <View style={styles.wrapper}><Text style={styles.label}>{label}</Text><TextInput autoCapitalize="none" placeholderTextColor={colors.muted} style={[styles.input, Boolean(error) && styles.inputError]} {...props} />{error ? <Text style={styles.error}>{error}</Text> : null}</View>;
}
const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm }, label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  input: { height: 52, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.text, backgroundColor: colors.surface, fontSize: 16 },
  inputError: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 13 },
});
