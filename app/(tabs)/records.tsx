import { StyleSheet } from 'react-native';

import { Text, View } from '@/src/components/Themed';

export default function RecordsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>기록</Text>
      <Text>TODO: 산책/방문 기록 화면 구현</Text>
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
