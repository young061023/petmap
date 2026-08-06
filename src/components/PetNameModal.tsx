import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PawPrint, X } from 'lucide-react-native';
import { theme } from '../theme/theme';

interface PetNameModalProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const PetNameModal: React.FC<PetNameModalProps> = ({
  visible,
  currentName,
  onClose,
  onSave,
}) => {
  const [inputName, setInputName] = useState(currentName);

  const handleSave = () => {
    if (inputName.trim()) {
      onSave(inputName.trim());
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <PawPrint size={18} color={theme.colors.pastelPinkDark} fill="#FFB7B2" />
              <Text style={styles.headerTitle}>반려견 이름 설정</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={20} color={theme.colors.textSub} />
            </Pressable>
          </View>

          <Text style={styles.description}>
            함께 여행하는 귀여운 아이의 이름을 입력해주세요 💕
          </Text>

          <TextInput
            style={styles.input}
            value={inputName}
            onChangeText={setInputName}
            placeholder="이름 입력 (예: 몽이, 초코)"
            placeholderTextColor={theme.colors.textLight}
            maxLength={12}
            autoFocus
          />

          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveText}>저장하기</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSub,
    marginBottom: 16,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.pastelPink,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.textMain,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    backgroundColor: theme.colors.pastelPinkDark,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSub,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
