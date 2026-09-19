import { Puppy } from '@/components/ExplorerBrand';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAchievements } from '@/features/achievements/AchievementProvider';
import { useCharacterStore, type CharacterType } from '@/store/useCharacterStore';

function Stat({ value, label }: { value: number; label: string }) { const { unlockedCount } = useAchievements(); const displayedValue = label === '배지' ? unlockedCount : value; return <View style={styles.stat}><Text style={styles.statValue}>{displayedValue.toLocaleString()}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const CHARACTER_OPTIONS: { type: CharacterType; label: string; emoji: string; image?: number }[] = [{ type: 'dog', label: '강아지', emoji: '🐶', image: require('../../../assets/design/dog-wink.png') }, { type: 'cat', label: '고양이', emoji: '🐱', image: require('../../../assets/design/cat-wink.png') }, { type: 'fox', label: '여우', emoji: '🦊', image: require('../../../assets/design/fox-wink.png') }];
function CharacterPicker() {
  const character = useCharacterStore((state) => state.character);
  const setCharacter = useCharacterStore((state) => state.setCharacter);
  const [pickerVisible, setPickerVisible] = useState(false);
  const selected = CHARACTER_OPTIONS.find((opt) => opt.type === character) ?? CHARACTER_OPTIONS[0];

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="지도 캐릭터 변경" onPress={() => setPickerVisible(true)} style={styles.characterCard}>
      <Text style={styles.cardEyebrow}>지도 캐릭터</Text>
      <View style={styles.characterHero}>
        {selected.image ? <Image source={selected.image} style={styles.characterHeroImage} /> : <Text style={styles.characterHeroEmoji}>{selected.emoji}</Text>}
        <View style={{ flex: 1 }}>
          <Text style={styles.characterHeroLabel}>{selected.label}</Text>
          <Text style={styles.characterHeroHint}>눌러서 변경</Text>
        </View>
      </View>
    </Pressable>
    <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
      <Pressable style={styles.pickerBackdrop} onPress={() => setPickerVisible(false)} />
      <View style={styles.pickerSheet}>
        <Text style={styles.pickerTitle}>지도 캐릭터 선택</Text>
        <View style={styles.characterRow}>
          {CHARACTER_OPTIONS.map((opt) => <Pressable key={opt.type} accessibilityRole="button" accessibilityState={{ selected: character === opt.type }} onPress={() => { setCharacter(opt.type); setPickerVisible(false); }} style={[styles.characterOption, character === opt.type && styles.characterOptionActive]}>{opt.image ? <Image source={opt.image} style={styles.characterOptionImage} /> : <Text style={styles.characterEmoji}>{opt.emoji}</Text>}<Text style={[styles.characterLabel, character === opt.type && styles.characterLabelActive]}>{opt.label}</Text></Pressable>)}
        </View>
      </View>
    </Modal>
  </>;
}
function ModelCredits() {
  return <View style={styles.credits}>
    <Text style={styles.creditsTitle}>3D 캐릭터 모델 출처</Text>
    <Text style={styles.creditsLine}>여우 · "Low Poly Fox" by PixelMannen, tomkranis, AsoboStudio (CC BY 4.0)</Text>
    <Text style={styles.creditsLine}>강아지 · "Dog Puppy" by kenchoo (CC BY 4.0)</Text>
    <Text style={styles.creditsLine}>고양이 · "Cute Cat" by kenchoo (CC BY 4.0)</Text>
  </View>;
}
function Menu({ label, onPress }: { label: string; onPress?: () => void }) {
  const handlePress = onPress ?? (label === '획득 배지'
    ? () => router.push('/achievements')
    : label === '개인정보 및 위치정보 설정'
    ? () => router.push('/privacy-settings')
    : label === '고객센터'
      ? () => router.push('/customer-support')
      : undefined);
  return <Pressable accessibilityRole="button" onPress={handlePress} style={styles.menu}><Text style={styles.menuLabel}>{label}</Text><Text style={styles.chevron}>›</Text></Pressable>;
}

export default function MyPageScreen() {
  const { status, profile, signOut } = useAuth(); const [loading, setLoading] = useState(false);
  if (status === 'unauthenticated') return <Redirect href="/login" />;
  if (!profile) return null;
  const logout = () => Alert.alert('로그아웃할까요?', '다시 이용하려면 로그인이 필요해요.', [{ text: '취소', style: 'cancel' }, { text: '로그아웃', style: 'destructive', onPress: async () => { setLoading(true); try { await signOut(); router.replace('/login'); } finally { setLoading(false); } } }]);
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.profile}><View style={styles.avatar}><Puppy size={64} /></View><View style={styles.profileCopy}><Text style={styles.name}>{profile.name}</Text><Text style={styles.email}>{profile.email}</Text></View></View><View style={styles.petCard}><View><Text style={styles.cardEyebrow}>나의 반려동물</Text><Text style={styles.petName}>{profile.pet ? profile.pet.name : '반려동물을 등록해 주세요'}</Text>{profile.pet ? <Text style={styles.petMeta}>{profile.pet.breed} · {profile.pet.size === 'small' ? '소형견' : profile.pet.size === 'medium' ? '중형견' : '대형견'}</Text> : null}</View><Pressable onPress={() => router.push('/pet-profile')} style={styles.editButton}><Text style={styles.editLabel}>{profile.pet ? '수정' : '등록'}</Text></Pressable></View><CharacterPicker /><View style={styles.activity}><Text style={styles.cardEyebrow}>나의 활동</Text><View style={styles.stats}><Stat value={profile.badgeCount} label="배지" /><Stat value={profile.completedMissionCount} label="완료 미션" /><Stat value={profile.visitedRegionCount} label="방문 지역" /></View></View><View style={styles.menuGroup}><Menu label="획득 배지" /><Menu label="개인정보 및 위치정보 설정" /><Menu label="고객센터" /></View><PrimaryButton label="로그아웃" variant="weak" loading={loading} onPress={logout} /><Pressable><Text style={styles.withdraw}>회원 탈퇴</Text></Pressable><ModelCredits /></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: spacing.xl, paddingBottom: 24, gap: spacing.xl }, profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg }, avatar: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryWeak }, avatarText: { fontSize: 28 }, profileCopy: { flex: 1 }, name: { color: colors.text, fontSize: 21, fontWeight: '700' }, email: { marginTop: 4, color: colors.muted, fontSize: 14 }, petCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: 20, backgroundColor: '#EDF3EF' }, cardEyebrow: { color: colors.body, fontSize: 13, fontWeight: '600' }, petName: { marginTop: 5, color: colors.text, fontSize: 18, fontWeight: '700' }, petMeta: { marginTop: 4, color: colors.body, fontSize: 13 }, editButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surface }, editLabel: { color: colors.accent, fontWeight: '700' }, characterCard: { padding: spacing.lg, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, characterHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }, characterHeroEmoji: { fontSize: 44 }, characterHeroImage: { width: 92, height: 92, resizeMode: 'contain' }, characterHeroLabel: { color: colors.text, fontSize: 17, fontWeight: '700' }, characterHeroHint: { marginTop: 2, color: colors.muted, fontSize: 12 }, pickerBackdrop: { flex: 1, backgroundColor: 'rgba(20,35,26,0.32)' }, pickerSheet: { padding: spacing.xl, paddingBottom: 34, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.surface }, pickerTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: spacing.sm }, characterRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }, characterOption: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: spacing.md, borderRadius: 16, backgroundColor: colors.primaryWeak, borderWidth: 1.5, borderColor: 'transparent' }, characterOptionActive: { backgroundColor: colors.primaryFill, borderColor: colors.primary }, characterEmoji: { fontSize: 32 }, characterOptionImage: { width: 68, height: 68, resizeMode: 'contain' }, characterLabel: { fontSize: 13, fontWeight: '600', color: colors.body }, characterLabelActive: { color: colors.onPrimary }, activity: { borderWidth: 1, borderColor: colors.border, padding: spacing.xl, borderRadius: 22, backgroundColor: colors.surface }, stats: { flexDirection: 'row', marginTop: spacing.lg }, stat: { flex: 1, alignItems: 'center' }, statValue: { color: colors.text, fontSize: 16, fontWeight: '700' }, statLabel: { marginTop: 5, color: colors.muted, fontSize: 12 }, menuGroup: { overflow: 'hidden', borderRadius: 20, backgroundColor: colors.surface }, menu: { minHeight: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, menuLabel: { flex: 1, color: colors.text, fontSize: 15 }, chevron: { color: colors.muted, fontSize: 24 }, withdraw: { textAlign: 'center', color: colors.muted, fontSize: 13, textDecorationLine: 'underline' }, credits: { alignItems: 'center', gap: 3, paddingTop: 4 }, creditsTitle: { color: colors.muted, fontSize: 11, fontWeight: '700' }, creditsLine: { color: colors.muted, fontSize: 10, textAlign: 'center' } });
