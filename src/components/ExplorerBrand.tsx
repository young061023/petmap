import { Image, StyleSheet, Text, View } from 'react-native';
import { PawPrint } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export function Puppy({ size = 64 }: { size?: number }) {
  return <Image source={require('../../assets/design/puppy-apricot.png')} style={{ width: size, height: size }} resizeMode="contain" accessible={false} />;
}

export function ExplorerBrand({ label = '반려견과 로컬 여행' }: { label?: string }) {
  return <View style={styles.brand}><View style={styles.wordmark}><Text style={styles.logo}>PetMap</Text><PawPrint size={14} color={colors.primary} /></View><View style={styles.destination}><Puppy size={28} /><Text style={styles.label}>{label}</Text></View></View>;
}
export function ExplorerGuide({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.guide}><Puppy size={76} /><View style={styles.guideCopy}><Text style={styles.guideTitle}>{title}</Text><Text style={styles.guideSub}>{subtitle}</Text></View></View>;
}
const styles = StyleSheet.create({
  brand: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  wordmark: { flexDirection: 'row', alignItems: 'flex-start', gap: 2 }, logo: { fontSize: 18, letterSpacing: -0.5, fontWeight: '900', color: colors.primary },
  destination: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }, label: { fontSize: 11, fontWeight: '600', color: colors.body, flexShrink: 1 },
  guide: { marginHorizontal: 20, marginVertical: 12, padding: 12, borderRadius: 22, backgroundColor: colors.primaryWeak, flexDirection: 'row', alignItems: 'center', gap: 12 },
  guideCopy: { flex: 1 }, guideTitle: { color: colors.primary, fontSize: 16, fontWeight: '800', lineHeight: 23 }, guideSub: { color: colors.body, fontSize: 12, lineHeight: 19, marginTop: 4 },
});
