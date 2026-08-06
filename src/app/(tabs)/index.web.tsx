import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MapScreenWeb() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">지도</ThemedText>
      <ThemedText style={styles.message}>
        지도는 MapLibre 네이티브 모듈을 사용해서 웹에서는 지원하지 않습니다. iOS/Android 기기에서 실행해주세요.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  message: {
    textAlign: 'center',
  },
});
