import { useEffect } from 'react';
import { Clock, ImageIcon, FileText, MapPin } from 'lucide-react-native';
import { AppState, Image, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '@/constants/theme';
import type { LocalRecordMedia, TimelineActivity } from '@/types/record';

function RecordMedia({ media }: { media: LocalRecordMedia }) {
  // A silent, looping, non-interactive clip (like a GIF) rather than a
  // normal video player the user can tap to pause/scrub — matches how
  // apps like Setlog show a recorded moment as a short looping preview.
  const player = useVideoPlayer(media.type === 'video' ? media.uri : null, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  // Opening the camera to record a new clip claims the device's shared
  // AV session and iOS pauses every other active player (including these
  // list previews) for the duration — they don't resume on their own once
  // the camera session ends, which is why only the just-recorded clip kept
  // looping and every earlier one froze. Self-heal: any time this player
  // reports it stopped, and it wasn't told to, start it again.
  //
  // That listener alone still missed one case: if this screen is mounted
  // (or the app is foregrounded) while the AV session is still busy, the
  // initial play() from useVideoPlayer's setup can silently no-op — the
  // player never transitions from playing to paused, it just never starts,
  // so there's no playingChange event to react to. Cover that by also
  // retrying once the source has actually loaded (readyToPlay) and every
  // time the app comes back to the foreground.
  useEffect(() => {
    if (media.type !== 'video') return;
    const playingSubscription = player.addListener('playingChange', (event) => {
      if (!event.isPlaying) player.play();
    });
    const statusSubscription = player.addListener('statusChange', (event) => {
      if (event.status === 'readyToPlay') player.play();
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') player.play();
    });
    return () => {
      playingSubscription.remove();
      statusSubscription.remove();
      appStateSubscription.remove();
    };
  }, [media.type, player]);

  if (media.type === 'photo') return <Image source={{ uri: media.uri }} style={styles.photo} resizeMode="cover" />;
  return <VideoView player={player} style={styles.photo} contentFit="cover" nativeControls={false} pointerEvents="none" />;
}

export function TravelRecordList({ activities }: { activities: TimelineActivity[] }) {
  return <View style={styles.list}><View style={styles.summary}><ImageIcon size={18} color={colors.primary} /><Text style={styles.summaryText}>오늘의 추억 {activities.length}개</Text></View>{activities.length ? activities.map(activity => <View key={activity.id} style={styles.card}>{activity.media ? <RecordMedia media={activity.media} /> : activity.imageUrl ? <Image source={typeof activity.imageUrl === 'string' ? { uri: activity.imageUrl } : activity.imageUrl} style={styles.photo} resizeMode="cover" /> : null}<View style={styles.copy}><View style={styles.heading}><Text style={styles.title}>{activity.title}</Text><Text style={styles.category}>{activity.category}</Text></View><View style={styles.meta}><Clock size={13} color={colors.body} /><Text style={styles.metaText}>{activity.time}</Text>{activity.location ? <><MapPin size={13} color={colors.body} /><Text numberOfLines={1} style={styles.location}>{activity.location}</Text></> : null}</View>{activity.description ? <Text style={styles.description}>{activity.description}</Text> : null}</View></View>) : <View style={styles.empty}><View style={styles.emptyIcon}><FileText size={30} color={colors.primary} /></View><Text style={styles.emptyTitle}>첫 추억을 남겨보세요</Text><Text style={styles.emptyText}>반려견과 함께한 순간을 기록해 보세요.</Text></View>}</View>;
}
const styles = StyleSheet.create({ list: { gap: 12, paddingHorizontal: 20 }, summary: { flexDirection: 'row', gap: 9, padding: 16, borderRadius: 16, backgroundColor: colors.primaryWeak, alignItems: 'center' }, summaryText: { fontSize: 14, fontWeight: '700', color: colors.text }, card: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface }, photo: { width: '100%', height: 170 }, copy: { padding: 15, gap: 8 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text }, category: { color: colors.primary, fontSize: 11, backgroundColor: colors.primaryWeak, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 5 }, metaText: { fontSize: 12, color: colors.body }, location: { flex: 1, color: colors.body, fontSize: 12 }, description: { fontSize: 13, lineHeight: 21, color: colors.body }, empty: { alignItems: 'center', paddingVertical: 48, gap: 12 }, emptyIcon: { backgroundColor: colors.primaryWeak, padding: 18, borderRadius: 24 }, emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text }, emptyText: { fontSize: 13, color: colors.body } });
