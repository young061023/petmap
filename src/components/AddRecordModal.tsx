import React, { Fragment, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  Image,
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
import { X, Plus, Tag, Camera, Video } from 'lucide-react-native';
import { ActivityCategory, type LocalRecordMedia } from '../types/record';
import { theme } from '../theme/theme';
import { RecordCameraModal } from './RecordCameraModal';

interface AddRecordModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    description: string;
    category: ActivityCategory;
    time: string;
    location?: string;
    media?: LocalRecordMedia;
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
  const [location, setLocation] = useState<string | null>(null);
  const [media, setMedia] = useState<LocalRecordMedia | undefined>();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [time, setTime] = useState('');

  // Time and location are captured automatically the moment the sheet opens
  // (rather than typed in) — a walk record should reflect where/when it
  // actually happened, not require the user to remember and type it.
  useEffect(() => {
    if (!visible) {
      setCameraVisible(false);
      return;
    }

    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    setTime(`${formattedHours}:${mins} ${ampm}`);

    setLocation(null);
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position =
          (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync());
        if (!position) return;
        const [place] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (cancelled || !place) return;
        const label = [place.city ?? place.region, place.district, place.street]
          .filter((part): part is string => !!part)
          .join(' ');
        if (label) setLocation(label);
      } catch {
        // Location is a nice-to-have on the record, not a requirement —
        // leave it blank rather than blocking or erroring the sheet.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim(),
      category,
      time,
      location: location ?? undefined,
      media,
    });
    // Reset state
    setTitle('');
    setDescription('');
    setMedia(undefined);
    onClose();
  };

  return (
    <Fragment>
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

            <Text style={styles.label}>사진 또는 3초 영상 (선택)</Text>
            {media ? (
              <View style={styles.mediaPreview}>
                {media.type === 'photo' ? (
                  <Image source={{ uri: media.uri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.videoPreview}>
                    <Video size={28} color={theme.colors.primary} />
                    <Text style={styles.videoPreviewTitle}>3초 영상 촬영 완료</Text>
                    <Text style={styles.videoPreviewText}>앱 전용 로컬 저장소에 저장됩니다.</Text>
                  </View>
                )}
                <Pressable accessibilityLabel="촬영 파일 삭제" onPress={() => setMedia(undefined)} style={styles.removeMedia}>
                  <X size={17} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setCameraVisible(true)} style={styles.cameraButton}>
                <Camera size={21} color={theme.colors.primary} />
                <View style={styles.cameraButtonCopy}>
                  <Text style={styles.cameraButtonTitle}>지금 촬영하기</Text>
                  <Text style={styles.cameraButtonText}>앨범 불러오기 없이 카메라만 사용해요</Text>
                </View>
              </Pressable>
            )}

            {/* Time & location are captured silently (see the effect above)
                and only surface later on the saved record itself — nothing
                to show or edit here keeps this sheet focused on the parts
                the user actually fills in. */}

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
      <RecordCameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCaptured={setMedia}
      />
    </Fragment>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 53, 44, 0.32)',
    justifyContent: 'flex-end',
  },
  backdrop: StyleSheet.absoluteFill,
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
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.pastelPinkDark,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textSub,
  },
  categoryChipTextSelected: {
    color: theme.colors.onPrimary,
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
  multilineInput: {
    minHeight: 70,
  },
  cameraButton: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, padding: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  cameraButtonCopy: { flex: 1 },
  cameraButtonTitle: { color: theme.colors.textMain, fontSize: 14, fontWeight: '700' },
  cameraButtonText: { marginTop: 3, color: theme.colors.textSub, fontSize: 11 },
  mediaPreview: { minHeight: 108, overflow: 'hidden', borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  previewImage: { width: '100%', height: 150 },
  videoPreview: { minHeight: 108, alignItems: 'center', justifyContent: 'center', padding: 16 },
  videoPreviewTitle: { marginTop: 7, color: theme.colors.textMain, fontSize: 14, fontWeight: '700' },
  videoPreviewText: { marginTop: 3, color: theme.colors.textSub, fontSize: 11 },
  removeMedia: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(20,35,26,0.72)' },
  submitBtn: {
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.onPrimary,
  },
});
