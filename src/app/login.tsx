import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email.trim() || !password) { setError('이메일과 비밀번호를 입력해 주세요.'); return; }
    setLoading(true); setError('');
    try { await signIn({ email, password }); router.replace('/mypage'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : '로그인하지 못했어요.'); }
    finally { setLoading(false); }
  };
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.brand}><Text style={styles.logo}>댕로컬</Text><Text style={styles.tagline}>반려동물과 함께 떠나는{`\n`}미션형 로컬 여행</Text></View>
    <View style={styles.form}><FormField label="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" placeholder="name@example.com" /><FormField label="비밀번호" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="비밀번호 입력" />{error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}<PrimaryButton label="로그인" onPress={() => void submit()} loading={loading} /></View>
    <Text style={styles.footer}>처음 오셨나요? <Link href="/signup" style={styles.link}>회원가입</Link></Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, flex: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: 36 }, brand: { gap: spacing.md }, logo: { color: colors.primary, fontSize: 34, fontWeight: '800' }, tagline: { color: colors.text, fontSize: 24, lineHeight: 34, fontWeight: '700' }, form: { gap: spacing.lg }, error: { color: colors.danger, fontSize: 14 }, footer: { textAlign: 'center', color: colors.body }, link: { color: colors.primary, fontWeight: '700' } });
