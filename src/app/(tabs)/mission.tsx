import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MissionScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">미션</ThemedText>
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
