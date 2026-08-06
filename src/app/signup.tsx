import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';

function Agreement({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={styles.agreement}><View style={[styles.checkbox, checked && styles.checkboxChecked]}><Text style={styles.check}>{checked ? '✓' : ''}</Text></View><Text style={styles.agreementText}>{label}</Text></Pressable>;
}
export default function SignupScreen() {
  const { signUp } = useAuth(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [terms, setTerms] = useState(false); const [privacy, setPrivacy] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!name.trim() || !email.trim()) { setError('이름과 이메일을 입력해 주세요.'); return; }
    if (password.length < 8) { setError('비밀번호는 8자 이상 입력해 주세요.'); return; }
    if (password !== confirmation) { setError('비밀번호가 서로 일치하지 않아요.'); return; }
    if (!terms || !privacy) { setError('필수 약관에 동의해 주세요.'); return; }
    setLoading(true); setError('');
    try { const signedIn = await signUp({ name, email, password, passwordConfirmation: confirmation, acceptedTerms: terms, acceptedPrivacy: privacy }); if (signedIn) router.replace('/mypage'); else { Alert.alert('이메일을 확인해 주세요', '인증 메일의 링크를 누른 뒤 로그인해 주세요.'); router.replace('/login'); } }
    catch (caught) { setError(caught instanceof Error ? caught.message : '가입하지 못했어요.'); } finally { setLoading(false); }
  };
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ 뒤로</Text></Pressable><View><Text style={styles.title}>댕로컬 시작하기</Text><Text style={styles.subtitle}>반려견과 떠날 준비를 해볼까요?</Text></View><View style={styles.form}><FormField label="이름" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" placeholder="이름 입력" /><FormField label="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" placeholder="name@example.com" /><FormField label="비밀번호" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="8자 이상" /><FormField label="비밀번호 확인" value={confirmation} onChangeText={setConfirmation} secureTextEntry placeholder="한 번 더 입력" /><View style={styles.agreements}><Agreement checked={terms} label="[필수] 이용약관 동의" onPress={() => setTerms(!terms)} /><Agreement checked={privacy} label="[필수] 개인정보 처리방침 동의" onPress={() => setPrivacy(!privacy)} /></View>{error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}<PrimaryButton label="회원가입" onPress={() => void submit()} loading={loading} /></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, flex: { flex: 1 }, content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.xl }, back: { color: colors.body, fontSize: 16 }, title: { color: colors.text, fontSize: 28, fontWeight: '800' }, subtitle: { marginTop: spacing.sm, color: colors.body, fontSize: 16 }, form: { gap: spacing.lg }, agreements: { gap: spacing.md, paddingVertical: spacing.sm }, agreement: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, checkbox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 7, backgroundColor: colors.surface }, checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary }, check: { color: colors.surface, fontWeight: '800' }, agreementText: { color: colors.body, fontSize: 14 }, error: { color: colors.danger, fontSize: 14 } });
