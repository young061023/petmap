import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus, Clock, MapPin, Tag } from 'lucide-react-native';
import { ActivityCategory } from '../types/record';
import { theme } from '../theme/theme';

interface AddRecordModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    description: string;
    category: ActivityCategory;
    time: string;
    location?: string;
  }) => void;
}

const CATEGORIES: ActivityCategory[] = ['산책', '간식', '놀이', '여행', '병원', '기록'];

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('산책');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    return `${formattedHours}:${mins} ${ampm}`;
  });

  const handleSave = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim(),
      category,
      time,
      location: location.trim() || undefined,
    });
    // Reset state
    setTitle('');
    setDescription('');
    setLocation('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.plusBadge}>
                <Plus size={16} color={theme.colors.pastelPinkDark} />
              </View>
              <Text style={styles.headerTitle}>추억 기록하기</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={20} color={theme.colors.textSub} />
            </Pressable>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Category Selector */}
            <Text style={styles.label}>
              <Tag size={13} color={theme.colors.textSub} /> 카테고리
            </Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryChip,
                      selected && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Title Input */}
            <Text style={styles.label}>활동 제목</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 공원에서 신나는 노즈워크 🐾"
              placeholderTextColor={theme.colors.textLight}
              value={title}
              onChangeText={setTitle}
            />

            {/* Time & Location Row */}
            <View style={styles.rowTwo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  <Clock size={13} color={theme.colors.textSub} /> 시간
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="예: 09:30 AM"
                  placeholderTextColor={theme.colors.textLight}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  <MapPin size={13} color={theme.colors.textSub} /> 장소 (선택)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="예: 한강 공원"
                  placeholderTextColor={theme.colors.textLight}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Description Input */}
            <Text style={styles.label}>상세 메모 / 추억 이야기</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="오늘 하루 소중했던 경험을 기록해보세요."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </ScrollView>

          {/* Action Button */}
          <Pressable
            style={[
              styles.submitBtn,
              !title.trim() && styles.submitBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!title.trim()}
          >
            <Text style={styles.submitText}>저장하기</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '82%',
    ...theme.shadows.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.pastelPinkSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  formScroll: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
    marginBottom: 6,
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.pastelPinkSoft,
    borderColor: theme.colors.pastelPinkDark,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textSub,
  },
  categoryChipTextSelected: {
    color: theme.colors.pastelPinkDark,
    fontWeight: '800',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  multilineInput: {
    minHeight: 70,
  },
  submitBtn: {
    backgroundColor: theme.colors.pastelPinkDark,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.floating,
  },
  submitBtnDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
