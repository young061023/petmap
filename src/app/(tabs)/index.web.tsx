import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { MapExplorer } from '@/components/MapExplorer';
import { colors } from '@/constants/theme';
export default function MapScreenWeb() {
  return <MapExplorer web><View style={styles.preview}><MapPin size={44} color={colors.primary} /><Text style={styles.title}>발자국 탐험 지도</Text><Text style={styles.message}>실시간 지도는 안드로이드 앱에서 만나보세요.</Text></View></MapExplorer>;
}
const styles = StyleSheet.create({ preview: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }, title: { fontSize: 20, fontWeight: '800', color: colors.text }, message: { textAlign: 'center', fontSize: 13, lineHeight: 21, color: colors.body } });
