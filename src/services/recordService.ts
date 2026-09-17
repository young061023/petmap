import AsyncStorage from '@react-native-async-storage/async-storage';
import { copyAsync, documentDirectory, makeDirectoryAsync } from 'expo-file-system/legacy';

import type { DailySummary, LocalRecordMedia, TimelineActivity } from '../types/record';

import { supabase } from './supabase';

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error('기록을 저장하려면 로그인이 필요해요.');
  return data.session.user.id;
}

type LocalMediaIndex = Record<string, LocalRecordMedia>;

const mediaIndexKey = (userId: string) => `petmap:record-media:${userId}`;

async function readLocalMediaIndex(userId: string): Promise<LocalMediaIndex> {
  const value = await AsyncStorage.getItem(mediaIndexKey(userId));
  return value ? JSON.parse(value) as LocalMediaIndex : {};
}

async function persistLocalMedia(userId: string, recordId: string, media: LocalRecordMedia): Promise<LocalRecordMedia> {
  if (!documentDirectory) throw new Error('앱 저장공간을 사용할 수 없어요.');
  const directory = `${documentDirectory}records/${userId}/`;
  await makeDirectoryAsync(directory, { intermediates: true });
  const sourceExtension = media.uri.split('?')[0].split('.').pop()?.toLowerCase();
  const extension = media.type === 'video'
    ? (sourceExtension && ['mov', 'mp4', 'm4v'].includes(sourceExtension) ? sourceExtension : 'mov')
    : (sourceExtension && ['jpg', 'jpeg', 'png'].includes(sourceExtension) ? sourceExtension : 'jpg');
  const stored = { ...media, uri: `${directory}${recordId}.${extension}` };
  await copyAsync({ from: media.uri, to: stored.uri });
  const index = await readLocalMediaIndex(userId);
  index[recordId] = stored;
  await AsyncStorage.setItem(mediaIndexKey(userId), JSON.stringify(index));
  return stored;
}

const mapActivity = (row: Record<string, unknown>): TimelineActivity => ({
  id: String(row.id),
  time: String(row.record_time),
  title: String(row.title),
  description: String(row.description ?? ''),
  category: row.category as TimelineActivity['category'],
  dateString: String(row.record_date),
  location: row.location ? String(row.location) : undefined,
  imageUrl: row.image_url ? String(row.image_url) : undefined,
});

export const recordService = {
  async getActivitiesByDate(dateString: string): Promise<TimelineActivity[]> {
    const userId = await getUserId();
    const [{ data, error }, mediaIndex] = await Promise.all([
      supabase
        .from('records')
        .select('*')
        .eq('user_id', userId)
        .eq('record_date', dateString)
        .order('record_time'),
      readLocalMediaIndex(userId),
    ]);
    if (error) throw new Error('기록을 불러오지 못했어요.');
    return (data ?? []).map((row) => {
      const activity = mapActivity(row);
      return { ...activity, media: mediaIndex[activity.id] };
    });
  },

  async addActivity(newActivity: Omit<TimelineActivity, 'id'>): Promise<TimelineActivity> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('records')
      .insert({
        user_id: userId,
        record_date: newActivity.dateString,
        record_time: newActivity.time,
        title: newActivity.title,
        description: newActivity.description,
        category: newActivity.category,
        location: newActivity.location ?? null,
        image_url: null,
      })
      .select()
      .single();
    if (error) throw new Error('기록을 저장하지 못했어요.');
    const activity = mapActivity(data);
    if (!newActivity.media) return activity;
    const media = await persistLocalMedia(userId, activity.id, newActivity.media);
    return { ...activity, media };
  },

  async getLocalMediaIndex(): Promise<LocalMediaIndex> {
    return readLocalMediaIndex(await getUserId());
  },

  async getDailySummary(dateString: string): Promise<DailySummary> {
    const userId = await getUserId();
    const [activities, missionResult] = await Promise.all([
      this.getActivitiesByDate(dateString),
      supabase.from('user_missions').select('progress,target').eq('user_id', userId).eq('assigned_date', dateString),
    ]);
    if (missionResult.error) throw new Error('일일 요약을 불러오지 못했어요.');
    const missions = missionResult.data ?? [];
    return {
      dateString,
      recordCount: activities.length,
      missionTotal: missions.length,
      missionCompleted: missions.filter((mission) => mission.progress >= mission.target).length,
    };
  },
};
