import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

const SUPPORT_EMAIL = 'support@daenglocal.app';

export default function CustomerSupportScreen() {
  const contactSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[댕로컬 문의]')}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('메일 앱을 열 수 없어요', `문의 내용을 ${SUPPORT_EMAIL}로 보내 주세요.`);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>‹ 마이페이지</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>고객센터</Text>
          <Text style={styles.subtitle}>궁금한 점이나 도움이 필요한 내용을 댕로컬 팀에 보내 주세요.</Text>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>도움이 더 필요한가요?</Text>
          <Text style={styles.answer}>이메일로 문의를 보내주시면 확인 후 답변해 드릴게요.</Text>
          <Text style={styles.email}>{SUPPORT_EMAIL}</Text>
          <Pressable accessibilityRole="button" onPress={() => void contactSupport()} style={styles.button}>
            <Text style={styles.buttonText}>이메일 문의하기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: spacing.xl, paddingBottom: 48, gap: spacing.xl },
  back: { color: colors.body, fontSize: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: spacing.sm, color: colors.body, fontSize: 15, lineHeight: 22 },
  sectionTitle: { padding: 20, color: colors.text, fontSize: 17, fontWeight: '700' },
  answer: { marginTop: spacing.sm, color: colors.body, fontSize: 14, lineHeight: 22 },
  contactCard: { paddingBottom: 20, borderRadius: 22, backgroundColor: colors.primaryWeak },
  email: { paddingHorizontal: 20, marginTop: spacing.sm, color: colors.primary, fontSize: 14, fontWeight: '700' },
  button: { minHeight: 48, marginHorizontal: 20, marginTop: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.primaryFill },
  buttonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
});
