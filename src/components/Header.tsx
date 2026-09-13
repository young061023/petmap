import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PawPrint, Edit2 } from 'lucide-react-native';
import { theme } from '../theme/theme';

interface HeaderProps {
  petName: string;
  onEditPetName: () => void;
}

export const Header: React.FC<HeaderProps> = ({ petName, onEditPetName }) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>여행 기록</Text>
        {/* Pastel apricot paw badge */}
        <View style={styles.pawBadge}>
          <PawPrint size={20} color={theme.colors.primaryStrong} fill={theme.colors.primarySoft} />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.subtitleRow,
          pressed && styles.subtitlePressed,
        ]}
        onPress={onEditPetName}
        accessibilityRole="button"
        accessibilityLabel="반려견 이름 변경"
      >
        <Text style={styles.subtitleText}>
          <Text style={styles.petNameHighlight}>{petName}</Text>이와 소중한 추억을 모아보세요
        </Text>
        <Edit2 size={13} color={theme.colors.textSub} style={styles.editIcon} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textMain,
    marginRight: 8,
  },
  pawBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.pastelSoftPink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  subtitlePressed: {
    opacity: 0.6,
  },
  subtitleText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSub,
  },
  petNameHighlight: {
    fontFamily: 'NanumSquareRound',
    fontWeight: '800',
    color: theme.colors.pastelPinkDark,
  },
  editIcon: {
    marginLeft: 6,
  },
});
