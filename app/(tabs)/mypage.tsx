import { StyleSheet } from 'react-native';

import { Text, View } from '@/src/components/Themed';
import { useUserStore } from '@/src/store/useUserStore';

export default function MyPageScreen() {
  const user = useUserStore((state) => state.user);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인 / 마이페이지</Text>
      <Text>{user ? `${user.nickname ?? user.email} 님` : '로그인이 필요합니다.'}</Text>
      <Text>TODO: Supabase Auth 연동 (src/services/supabase.ts)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
