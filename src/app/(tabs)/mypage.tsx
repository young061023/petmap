import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MyPageScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">마이페이지</ThemedText>
      <ThemedText type="small">TODO</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
