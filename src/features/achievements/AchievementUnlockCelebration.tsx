import { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Sparkles } from 'lucide-react-native';

import { colors } from '@/constants/theme';
import type { Achievement } from '@/types/achievement';

interface AchievementUnlockCelebrationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const PAWS = [
  { left: '11%', top: '18%', rotate: '-24deg', delay: 80 },
  { left: '76%', top: '17%', rotate: '22deg', delay: 180 },
  { left: '17%', top: '66%', rotate: '18deg', delay: 280 },
  { left: '79%', top: '70%', rotate: '-18deg', delay: 380 },
] as const;

export function AchievementUnlockCelebration({ achievement, onClose }: AchievementUnlockCelebrationProps) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.76)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.4)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const pawAnimations = useMemo(() => PAWS.map(() => new Animated.Value(0)), []);

  useEffect(() => {
    if (!achievement) return;

    backdrop.setValue(0);
    cardScale.setValue(0.76);
    cardOpacity.setValue(0);
    badgeScale.setValue(0.4);
    glow.setValue(0);
    pawAnimations.forEach((value) => value.setValue(0));

    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, damping: 13, stiffness: 145, mass: 0.8, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(badgeScale, { toValue: 1, damping: 8, stiffness: 170, useNativeDriver: true }),
      ]),
      Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: true }),
      ...pawAnimations.map((value, index) => Animated.sequence([
        Animated.delay(PAWS[index].delay),
        Animated.spring(value, { toValue: 1, damping: 8, stiffness: 130, useNativeDriver: true }),
      ])),
    ]).start();

    const timer = setTimeout(onClose, 4200);
    return () => clearTimeout(timer);
  }, [achievement, backdrop, badgeScale, cardOpacity, cardScale, glow, onClose, pawAnimations]);

  if (!achievement) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${achievement.name} 배지 획득. 닫기`} onPress={onClose} style={styles.fill}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
        <View pointerEvents="none" style={styles.scene}>
          {PAWS.map((paw, index) => (
            <Animated.Text
              key={`${paw.left}-${paw.top}`}
              style={[
                styles.floatingPaw,
                { left: paw.left, top: paw.top, transform: [{ rotate: paw.rotate }, { scale: pawAnimations[index] }] },
              ]}
            >
              🐾
            </Animated.Text>
          ))}

          <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
            <View style={styles.eyebrowRow}>
              <MapPin size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.eyebrow}>새로운 발자국!</Text>
              <Sparkles size={16} color={colors.primary} strokeWidth={2.5} />
            </View>

            <View style={styles.badgeStage}>
              <Animated.View style={[styles.glow, { opacity: glow }]} />
              <View style={styles.routeRing}>
                <View style={styles.routeDotTop} />
                <View style={styles.routeDotBottom} />
              </View>
              <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                <Text style={styles.badgeIcon}>{achievement.icon}</Text>
              </Animated.View>
            </View>

            <Text style={styles.acquired}>배지 획득</Text>
            <Text style={styles.name}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
            <View style={styles.divider} />
            <Text style={styles.dismiss}>화면을 눌러 계속하기</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20, 35, 26, 0.72)' },
  scene: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  floatingPaw: { position: 'absolute', color: '#DDE9E0', fontSize: 30, opacity: 0.72 },
  card: {
    width: '100%', maxWidth: 360, alignItems: 'center', paddingHorizontal: 26, paddingTop: 26, paddingBottom: 22,
    borderRadius: 32, borderWidth: 1, borderColor: '#CFE0D4', backgroundColor: '#FAFAF6',
    shadowColor: '#0F2417', shadowOpacity: 0.3, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 16,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.primaryWeak },
  eyebrow: { color: colors.primary, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  badgeStage: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  glow: { position: 'absolute', width: 154, height: 154, borderRadius: 77, backgroundColor: '#DCEADF' },
  routeRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderStyle: 'dashed', borderColor: '#87A691' },
  routeDotTop: { position: 'absolute', top: -5, left: 62, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  routeDotBottom: { position: 'absolute', bottom: -5, right: 28, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E7A977' },
  badge: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', backgroundColor: colors.primaryFill, shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  badgeIcon: { fontSize: 50 },
  acquired: { marginTop: 2, color: colors.primary, fontSize: 13, fontWeight: '900', letterSpacing: 1.6 },
  name: { marginTop: 8, color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  description: { marginTop: 9, color: colors.body, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  divider: { width: 42, height: 3, marginTop: 20, borderRadius: 2, backgroundColor: '#D8E4DB' },
  dismiss: { marginTop: 12, color: colors.muted, fontSize: 12, fontWeight: '600' },
});
