import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { CheckCircle2, Circle, X, Sparkles } from 'lucide-react-native';
import { MissionItem } from '../types/record';
import { theme } from '../theme/theme';

interface MissionsModalProps {
  visible: boolean;
  missions: MissionItem[];
  onClose: () => void;
  onToggleMission: (missionId: string) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  visible,
  missions,
  onClose,
  onToggleMission,
}) => {
  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={18} color={theme.colors.primaryMintDark} />
              <Text style={styles.headerTitle}>오늘의 반려견 미션</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={20} color={theme.colors.textSub} />
            </Pressable>
          </View>

          <Text style={styles.subTitle}>
            달성 완료: <Text style={styles.highlight}>{completedCount}</Text> / {missions.length}개
          </Text>

          <ScrollView style={styles.missionList} showsVerticalScrollIndicator={false}>
            {missions.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.missionRow,
                  item.completed && styles.missionRowCompleted,
                ]}
                onPress={() => onToggleMission(item.id)}
              >
                {item.completed ? (
                  <CheckCircle2 size={22} color={theme.colors.primaryMintDark} fill={theme.colors.pastelMintSoft} />
                ) : (
                  <Circle size={22} color={theme.colors.textLight} />
                )}
                <Text
                  style={[
                    styles.missionText,
                    item.completed && styles.missionTextCompleted,
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.confirmBtn} onPress={onClose}>
            <Text style={styles.confirmText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    ...theme.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  subTitle: {
    fontSize: 13,
    color: theme.colors.textSub,
    marginBottom: 16,
  },
  highlight: {
    fontWeight: '700',
    color: theme.colors.primaryMintDark,
  },
  missionList: {
    maxHeight: 240,
    marginBottom: 16,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
  },
  missionRowCompleted: {
    backgroundColor: theme.colors.pastelMintSoft,
  },
  missionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMain,
    flex: 1,
  },
  missionTextCompleted: {
    color: theme.colors.primaryMintDark,
    textDecorationLine: 'line-through',
  },
  confirmBtn: {
    backgroundColor: theme.colors.primaryMintDark,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
