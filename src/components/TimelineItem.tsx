import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TimelineActivity } from '../types/record';
import { theme } from '../theme/theme';
import { MapPin, Camera, Dog, Utensils, HeartPulse, Sparkles } from 'lucide-react-native';

interface TimelineItemProps {
  activity: TimelineActivity;
  isFirst: boolean;
  isLast: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  activity,
  isFirst,
  isLast,
}) => {
  // Muted category colors keep the existing activity distinctions.
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case '산책':
        return {
          bg: theme.colors.sageSoft,
          text: theme.colors.sageStrong,
          dot: theme.colors.pastelMint,
          icon: Dog,
        };
      case '간식':
        return {
          bg: theme.colors.sandSoft,
          text: theme.colors.sandStrong,
          dot: theme.colors.pastelYellow,
          icon: Utensils,
        };
      case '여행':
        return {
          bg: theme.colors.primarySoft,
          text: theme.colors.primaryStrong,
          dot: theme.colors.primary,
          icon: Camera,
        };
      case '병원':
        return {
          bg: theme.colors.blueSoft,
          text: theme.colors.blueStrong,
          dot: theme.colors.pastelLavender,
          icon: HeartPulse,
        };
      default:
        return {
          bg: theme.colors.primarySoft,
          text: theme.colors.primaryStrong,
          dot: theme.colors.sand,
          icon: Sparkles,
        };
    }
  };

  const catTheme = getCategoryTheme(activity.category);
  const IconComponent = catTheme.icon;

  return (
    <View style={styles.container}>
      {/* Left Column: Time */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{activity.time}</Text>
      </View>

      {/* Middle Column: Vertical Line & Node Circle */}
      <View style={styles.nodeColumn}>
        <View
          style={[
            styles.verticalLine,
            isFirst && styles.hiddenLine,
          ]}
        />
        <View style={[styles.nodeDot, { borderColor: catTheme.dot }]}>
          <View style={[styles.innerDot, { backgroundColor: catTheme.dot }]} />
        </View>
        <View
          style={[
            styles.verticalLine,
            isLast && styles.hiddenLine,
          ]}
        />
      </View>

      {/* Right Column: Natural Listing */}
      <View style={styles.contentColumn}>
        <View style={styles.headerRow}>
          <View style={[styles.categoryBadge, { backgroundColor: catTheme.bg }]}>
            <IconComponent size={11} color={catTheme.text} />
            <Text style={[styles.categoryText, { color: catTheme.text }]}>
              {activity.category}
            </Text>
          </View>
          {activity.location && (
            <View style={styles.locationTag}>
              <MapPin size={11} color={theme.colors.textSub} />
              <Text style={styles.locationText} numberOfLines={1}>
                {activity.location}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.titleText}>{activity.title}</Text>
        {activity.description ? (
          <Text style={styles.descriptionText}>{activity.description}</Text>
        ) : null}

        {/* Photo Sample Card */}
        {activity.imageUrl ? (
          <View style={styles.imageContainer}>
            <Image
              source={activity.imageUrl}
              style={styles.activityImage}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    minHeight: 88,
  },
  timeColumn: {
    width: 65,
    paddingTop: 4,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  timeText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.textSub,
    letterSpacing: -0.2,
  },
  nodeColumn: {
    width: 24,
    alignItems: 'center',
  },
  verticalLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: theme.colors.border,
  },
  hiddenLine: {
    backgroundColor: 'transparent',
  },
  nodeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    ...theme.shadows.gentle,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  categoryText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 11,
    fontWeight: '700',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 11,
    color: theme.colors.textSub,
  },
  titleText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
    lineHeight: 20,
    marginBottom: 4,
  },
  descriptionText: {
    fontFamily: 'NanumSquareRound',
    fontSize: 13,
    color: theme.colors.textSub,
    lineHeight: 18,
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  activityImage: {
    width: '100%',
    height: 150,
    borderRadius: theme.borderRadius.md,
  },
});
