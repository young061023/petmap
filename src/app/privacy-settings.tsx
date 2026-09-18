import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

type PermissionStatus = Location.PermissionStatus | 'loading';

const permissionLabels: Record<PermissionStatus, string> = {
  loading: '확인 중',
  granted: '허용됨',
  denied: '허용 안 됨',
  undetermined: '아직 선택하지 않음',
};

export default function PrivacySettingsScreen() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('loading');
  const [canAskAgain, setCanAskAgain] = useState(true);

  const refreshPermission = useCallback(async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(permission.status);
    setCanAskAgain(permission.canAskAgain);
  }, []);

  useEffect(() => {
    void refreshPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPermission();
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const manageLocationPermission = async () => {
    if (permissionStatus === 'undetermined' || (permissionStatus === 'denied' && canAskAgain)) {
      const permission = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(permission.status);
      setCanAskAgain(permission.canAskAgain);
      return;
    }
    await Linking.openSettings();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>‹ 마이페이지</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>개인정보 및 위치정보</Text>
          <Text style={styles.subtitle}>내 정보가 사용되는 범위와 위치 권한을 확인할 수 있어요.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>개인정보 이용 안내</Text>
          <Text style={styles.body}>이름과 이메일은 계정 식별에, 반려동물 정보는 맞춤 장소와 미션 추천에 사용됩니다.</Text>
          <Text style={styles.body}>위치정보는 주변 장소 탐색과 지도 표시를 위해 앱을 사용하는 동안에만 활용됩니다.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.cardTitle}>위치정보 권한</Text>
              <Text style={styles.body}>현재 상태 · {permissionLabels[permissionStatus]}</Text>
            </View>
            <View style={[styles.status, permissionStatus === 'granted' && styles.statusGranted]}>
              <Text style={styles.statusText}>{permissionStatus === 'granted' ? '사용 중' : '꺼짐'}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => void manageLocationPermission()} style={styles.button}>
            <Text style={styles.buttonText}>
              {permissionStatus === 'undetermined' || (permissionStatus === 'denied' && canAskAgain) ? '위치 권한 요청' : '앱 설정 열기'}
            </Text>
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
  card: { padding: 20, gap: spacing.md, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  body: { color: colors.body, fontSize: 14, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowCopy: { flex: 1, gap: spacing.xs },
  status: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.border },
  statusGranted: { backgroundColor: colors.primaryWeak },
  statusText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.primaryFill },
  buttonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
});
