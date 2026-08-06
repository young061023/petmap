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
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={styles.emptyTitle}>기록된 추억이 없어요</Text>
            <Text style={styles.emptySub}>
              하단 + 버튼을 눌러 {petName}과의 순간을 기록해보세요!
            </Text>
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
        <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure White as requested!
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
    backgroundColor: 'rgba(44, 48, 54, 0.9)',
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
    alignItems: 'center',
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
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
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
    bottom: 20,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.pastelPinkDark, // #F4ADCF
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F4ADCF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
