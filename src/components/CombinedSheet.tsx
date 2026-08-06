import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Maximize2, Minimize2 } from 'lucide-react-native';
import { StatsSection } from './StatsSection';
import { TimelineSection } from './TimelineSection';
import { MissionItem, TimelineActivity } from '../types/record';
import { theme } from '../theme/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CombinedSheetProps {
  recordCount: number;
  missions: MissionItem[];
  onOpenMissions: () => void;
  activities: TimelineActivity[];
  selectedDate: Date;
  onChangeDateByDay: (offset: number) => void;
  onOpenAddModal: () => void;
  petName: string;
}

export const CombinedSheet: React.FC<CombinedSheetProps> = ({
  recordCount,
  missions,
  onOpenMissions,
  activities,
  selectedDate,
  onChangeDateByDay,
  onOpenAddModal,
  petName,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = (expand?: boolean) => {
    const nextState = expand !== undefined ? expand : !isFullScreen;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFullScreen(nextState);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30) {
          toggleFullScreen(true);
        } else if (gestureState.dy > 30) {
          toggleFullScreen(false);
        }
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.sheetContainer,
        isFullScreen && styles.sheetFullScreen,
      ]}
    >
      {/* Top Drag Handle Bar & Full Screen Toggle */}
      <View style={styles.handleContainer} {...panResponder.panHandlers}>
        <View style={styles.dragPill} />
        <View style={styles.handleRow}>
          <Text style={styles.handleHintText}>
            {isFullScreen ? '전체 화면 모드' : '위로 스와이프하여 전체 화면'}
          </Text>
          <Pressable
            style={styles.expandToggleBtn}
            onPress={() => toggleFullScreen()}
            hitSlop={10}
          >
            {isFullScreen ? (
              <View style={styles.toggleLabelRow}>
                <Minimize2 size={13} color={theme.colors.textSub} />
                <Text style={styles.toggleBtnText}>축소</Text>
              </View>
            ) : (
              <View style={styles.toggleLabelRow}>
                <Maximize2 size={13} color={theme.colors.textSub} />
                <Text style={styles.toggleBtnText}>전체화면</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Part 1: Frameless Statistics Section (White Background) */}
      <StatsSection
        recordCount={recordCount}
        missions={missions}
        onOpenMissions={onOpenMissions}
      />

      <View style={styles.sectionDivider} />

      {/* Part 2: Timeline Section (White Background) */}
      <TimelineSection
        activities={activities}
        selectedDate={selectedDate}
        onChangeDateByDay={onChangeDateByDay}
        onOpenAddModal={onOpenAddModal}
        petName={petName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure White as requested!
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    ...theme.shadows.soft,
  },
  sheetFullScreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderRadius: 0,
    paddingTop: 10,
    backgroundColor: '#FFFFFF', // Pure White as requested!
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  dragPill: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#DCD6CC',
    marginBottom: 6,
  },
  handleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  handleHintText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 11.5,
    color: theme.colors.textSub,
  },
  expandToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.pastelMint, // #B2F9E7
    borderWidth: 1,
    borderColor: 'rgba(44, 165, 141, 0.25)',
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleBtnText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 11,
    fontWeight: '800',
    color: '#2C3036',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(240, 236, 230, 0.7)',
    marginHorizontal: 20,
    marginVertical: 4,
  },
});
