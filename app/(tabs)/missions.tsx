import { StyleSheet } from 'react-native';

import { Text, View } from '@/src/components/Themed';

export default function MissionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>미션</Text>
      <Text>TODO: 미션 목록/진행 화면 구현</Text>
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
