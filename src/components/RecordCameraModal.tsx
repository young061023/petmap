import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CameraView,
  type CameraMode,
  type CameraType,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import { Camera, RefreshCw, Video, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import type { LocalRecordMedia } from '@/types/record';

export function RecordCameraModal({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (media: LocalRecordMedia) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [mode, setMode] = useState<CameraMode>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);

  const capture = async () => {
    if (!cameraRef.current || !ready || recording) return;

    if (mode === 'picture') {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.82 });
      if (photo?.uri) {
        onCaptured({ type: 'photo', uri: photo.uri });
        onClose();
      }
      return;
    }

    if (!microphonePermission?.granted) {
      const permission = await requestMicrophonePermission();
      if (!permission.granted) return;
    }

    setRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 3 });
      if (video?.uri) {
        onCaptured({ type: 'video', uri: video.uri });
        onClose();
      }
    } finally {
      setRecording(false);
    }
  };

  const close = () => {
    if (recording) cameraRef.current?.stopRecording();
    setRecording(false);
    onClose();
  };

  const permissionReady = cameraPermission?.granted;

  // Rendered as an absolutely-positioned overlay inside AddRecordModal's own
  // already-open <Modal> rather than as a second, separate <Modal> — RN
  // silently fails to present a second native Modal while one is already
  // open on iOS, which is why "지금 촬영하기" used to do nothing at all.
  if (!visible) return null;

  return (
    <View style={styles.overlayRoot}>
      <View style={styles.screen}>
        {permissionReady ? (
          <CameraView
            ref={cameraRef}
            active={visible}
            facing={facing}
            mode={mode}
            style={StyleSheet.absoluteFill}
            onCameraReady={() => setReady(true)}
          />
        ) : null}

        <SafeAreaView style={styles.controls}>
          <View style={styles.topBar}>
            <Pressable accessibilityLabel="카메라 닫기" onPress={close} style={styles.roundButton}>
              <X size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.title}>{mode === 'picture' ? '사진 촬영' : '3초 영상 촬영'}</Text>
            <Pressable accessibilityLabel="카메라 전환" onPress={() => setFacing((current) => current === 'back' ? 'front' : 'back')} style={styles.roundButton}>
              <RefreshCw size={21} color="#FFFFFF" />
            </Pressable>
          </View>

          {!cameraPermission ? null : !cameraPermission.granted ? (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
              <Text style={styles.permissionText}>앨범은 사용하지 않고 지금 촬영한 사진과 영상만 기록에 추가해요.</Text>
              <Pressable onPress={() => void requestCameraPermission()} style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>카메라 권한 허용</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.bottomArea}>
              <View style={styles.modeSelector}>
                <Pressable disabled={recording} onPress={() => setMode('picture')} style={[styles.modeButton, mode === 'picture' && styles.modeButtonActive]}>
                  <Camera size={17} color={mode === 'picture' ? colors.text : '#FFFFFF'} />
                  <Text style={[styles.modeText, mode === 'picture' && styles.modeTextActive]}>사진</Text>
                </Pressable>
                <Pressable disabled={recording} onPress={() => setMode('video')} style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}>
                  <Video size={17} color={mode === 'video' ? colors.text : '#FFFFFF'} />
                  <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>영상 3초</Text>
                </Pressable>
              </View>
              <Pressable accessibilityLabel={mode === 'picture' ? '사진 촬영' : '3초 영상 촬영'} disabled={!ready || recording} onPress={() => void capture()} style={[styles.shutterOuter, recording && styles.recordingOuter]}>
                <View style={[styles.shutterInner, mode === 'video' && styles.videoShutter, recording && styles.recordingShutter]} />
              </Pressable>
              <Text style={styles.helper}>{recording ? '촬영 중 · 3초 후 자동 종료' : '촬영한 파일은 이 앱에만 저장돼요'}</Text>
            </View>
          )}
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, elevation: 100 },
  screen: { flex: 1, backgroundColor: '#14231A' },
  controls: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8 },
  roundButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: 'rgba(20,35,26,0.62)' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  permissionCard: { margin: 24, padding: 24, borderRadius: 24, backgroundColor: colors.surface },
  permissionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  permissionText: { marginTop: 10, color: colors.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  permissionButton: { marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: colors.primaryFill },
  permissionButtonText: { color: colors.onPrimary, fontWeight: '800', textAlign: 'center' },
  bottomArea: { alignItems: 'center', paddingBottom: 18 },
  modeSelector: { flexDirection: 'row', gap: 8, padding: 5, borderRadius: 22, backgroundColor: 'rgba(20,35,26,0.66)' },
  modeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  modeButtonActive: { backgroundColor: '#FFFFFF' },
  modeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: colors.text },
  shutterOuter: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 39, borderWidth: 4, borderColor: '#FFFFFF' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF' },
  videoShutter: { backgroundColor: '#E65F5C' },
  recordingOuter: { opacity: 0.8 },
  recordingShutter: { width: 34, height: 34, borderRadius: 8 },
  helper: { marginTop: 12, color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
