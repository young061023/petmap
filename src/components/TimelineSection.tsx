import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  Animated,
} from 'react-native';
import { Plus, ChevronUp, ChevronDown, Calendar, Sparkles } from 'lucide-react-native';
import { TimelineActivity } from '../types/record';
import { ExplorerGuide } from './ExplorerBrand';
import { TimelineItem } from './TimelineItem';
import { theme } from '../theme/theme';

interface TimelineSectionProps {
  activities: TimelineActivity[];
  selectedDate: Date;
  onChangeDateByDay: (offset: number) => void;
  onOpenAddModal: () => void;
  petName: string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  activities,
  selectedDate,
  onChangeDateByDay,
  onOpenAddModal,
  petName,
}) => {
  const [pullMessage, setPullMessage] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showNotification = (msg: string) => {
    setPullMessage(msg);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setPullMessage(null));
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollY = contentOffset.y;

    if (scrollY < -55) {
      showNotification('◀ 이전 날짜의 타임라인으로 이동');
      onChangeDateByDay(-1);
      return;
    }

    const maxScrollY = contentSize.height - layoutMeasurement.height;
    if (maxScrollY > 0 && scrollY > maxScrollY + 55) {
      showNotification('다음 날짜의 타임라인으로 이동 ▶');
      onChangeDateByDay(1);
      return;
    }
  };

  const formattedDateHeader = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 타임라인`;

  return (
    <View style={styles.container}>
      {/* Toast Notification Banner */}
      {pullMessage && (
        <Animated.View style={[styles.pullBanner, { opacity: fadeAnim }]}>
          <Calendar size={13} color="#FFFFFF" />
          <Text style={styles.pullBannerText}>{pullMessage}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Sparkles size={16} color={theme.colors.pastelPinkDark} />
          <Text style={styles.sectionTitle}>{formattedDateHeader}</Text>
        </View>
        <Text style={styles.pullGuideText}>
          ↕ 위/아래로 당겨서 날짜 이동
        </Text>
      </View>

      {/* Scrollable Timeline */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
      >
        <View style={styles.pullHintTop}>
          <ChevronUp size={14} color={theme.colors.textLight} />
          <Text style={styles.pullHintText}>당겨서 이전 날짜 보기</Text>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
<ExplorerGuide title="첫 발자국을 남겨볼까요?" subtitle={`오른쪽 + 버튼으로 ${petName}과의 순간을 남겨요.`} />
          </View>
        ) : (
          activities.map((item, index) => (
            <TimelineItem
              key={item.id}
              activity={item}
              isFirst={index === 0}
              isLast={index === activities.length - 1}
            />
          ))
        )}

        <View style={styles.pullHintBottom}>
          <Text style={styles.pullHintText}>위로 당겨서 다음 날짜 보기</Text>
          <ChevronDown size={14} color={theme.colors.textLight} />
        </View>
      </ScrollView>

      {/* Pure Circle Floating Plus (+) Button at Bottom Center */}
      <Pressable
        style={({ pressed }) => [
          styles.floatingCircleBtn,
          pressed && styles.floatingBtnPressed,
        ]}
        onPress={onOpenAddModal}
        accessibilityRole="button"
        accessibilityLabel="기록 추가"
      >
        <Plus size={26} color={theme.colors.onPrimary} strokeWidth={2.8} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  pullBanner: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(60, 47, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.floating,
  },
  pullBannerText: {
    fontFamily: 'NanumSquareRound',
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: 'NanumSquareRound',
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  pullGuideText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 11,
    color: theme.colors.textSub,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 100,
  },
  pullHintTop: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  pullHintBottom: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 2,
  },
  pullHintText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 11,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 20,
  },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: theme.colors.primary, borderRadius: 24 },
  emptyActionText: { color: theme.colors.onPrimary, fontWeight: '700', fontSize: 13 },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: 'NanumSquareRound',
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: 'NanumSquareRound',
    fontSize: 13,
    color: theme.colors.textSub,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Bottom Center Pure Circle (+) Button
  floatingCircleBtn: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.textMain,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
