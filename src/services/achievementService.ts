import AsyncStorage from '@react-native-async-storage/async-storage';

import { ACHIEVEMENT_DEFINITIONS } from '@/constants/achievements';
import { supabase } from '@/services/supabase';
import { recordService } from '@/services/recordService';
import type { Achievement, PlaceVisit } from '@/types/achievement';

type RecordRow = { id: string; record_date: string; record_time: string; image_url: string | null };
type MissionRow = { assigned_date: string; period: 'daily' | 'weekly'; progress: number; target: number };
type UnlockedMap = Record<string, string>;

const visitKey = (userId: string) => `petmap:visits:${userId}`;
const unlockedKey = (userId: string) => `petmap:achievements:${userId}`;

function localDateKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function longestDateStreak(dateStrings: string[]): number {
  const days = [...new Set(dateStrings)].map((value) => new Date(`${value}T12:00:00`).getTime()).sort((a, b) => a - b);
  let longest = 0;
  let current = 0;
  let previous: number | undefined;
  for (const day of days) {
    current = previous != null && Math.round((day - previous) / 86_400_000) === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = day;
  }
  return longest;
}

function maxCount(values: string[]): number {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Math.max(0, ...counts.values());
}

function isVideo(url: string | null): boolean {
  return !!url && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error('업적을 확인하려면 로그인이 필요해요.');
  return data.session.user.id;
}

async function readVisits(userId: string): Promise<PlaceVisit[]> {
  const value = await AsyncStorage.getItem(visitKey(userId));
  return value ? JSON.parse(value) as PlaceVisit[] : [];
}

export const achievementService = {
  async getAchievements(): Promise<Achievement[]> {
    const userId = await getUserId();
    const [recordsResult, missionsResult, visits, unlockedValue, localMediaIndex] = await Promise.all([
      supabase.from('records').select('id,record_date,record_time,image_url').eq('user_id', userId),
      supabase.from('user_missions').select('assigned_date,period,progress,target').eq('user_id', userId),
      readVisits(userId),
      AsyncStorage.getItem(unlockedKey(userId)),
      recordService.getLocalMediaIndex(),
    ]);
    if (recordsResult.error) throw new Error('기록 업적을 불러오지 못했어요.');
    if (missionsResult.error) throw new Error('미션 업적을 불러오지 못했어요.');

    const records = (recordsResult.data ?? []) as RecordRow[];
    const missions = (missionsResult.data ?? []) as MissionRow[];
    const completed = missions.filter((mission) => mission.progress >= mission.target);
    const uniquePlaces = new Set(visits.map((visit) => visit.placeId)).size;
    const visitsPerDay = maxCount(visits.map((visit) => localDateKey(visit.visitedAt)));
    const visitsPerPlace = maxCount(visits.map((visit) => visit.placeId));
    const recordStreak = longestDateStreak(records.map((record) => record.record_date));
    const photos = records.filter((record) => localMediaIndex[record.id]?.type === 'photo' || (!localMediaIndex[record.id] && !!record.image_url && !isVideo(record.image_url))).length;
    const videos = records.filter((record) => localMediaIndex[record.id]?.type === 'video' || (!localMediaIndex[record.id] && isVideo(record.image_url))).length;
    const morningVisit = visits.some((visit) => new Date(visit.visitedAt).getHours() < 12) ? 1 : 0;
    const eveningVisit = visits.some((visit) => new Date(visit.visitedAt).getHours() >= 18) ? 1 : 0;
    const coffeeAfterWalk = visits.some((cafe) => cafe.contentTypeId === '39' && visits.some((walk) => walk.contentTypeId !== '39' && new Date(cafe.visitedAt).getTime() - new Date(walk.visitedAt).getTime() > 0 && new Date(cafe.visitedAt).getTime() - new Date(walk.visitedAt).getTime() <= 7_200_000)) ? 1 : 0;
    const dailyGroups = new Map<string, MissionRow[]>();
    for (const mission of missions.filter((item) => item.period === 'daily')) {
      dailyGroups.set(mission.assigned_date, [...(dailyGroups.get(mission.assigned_date) ?? []), mission]);
    }
    const perfectDay = [...dailyGroups.values()].some((items) => items.length > 0 && items.every((item) => item.progress >= item.target)) ? 1 : 0;
    const progressById: Record<string, number> = {
      'first-step': uniquePlaces, 'neighborhood-explorer': uniquePlaces, 'travel-pioneer': uniquePlaces,
      'footprint-collector': uniquePlaces, 'national-pup': uniquePlaces,
      'mission-beginner': completed.length, 'mission-runner': completed.length, 'mission-master': completed.length,
      'embroidered-days': completed.length, 'perfect-day': perfectDay,
      'steady-traveler': completed.filter((mission) => mission.period === 'weekly').length,
      'first-memory': records.length, 'travel-diary': records.length, 'memory-storage': records.length,
      'hundred-memories': records.length, 'one-snapshot': photos, 'photo-collector': photos, videographer: videos,
      'wherever-paws-lead': visitsPerDay, 'back-again': visitsPerPlace, 'regular-begins': visitsPerPlace,
      'recording-today': recordStreak, 'steady-footprints': recordStreak,
      'coffee-after-walk': coffeeAfterWalk, 'rainy-indoor-trip': 0,
      'morning-walk': morningVisit, 'evening-walk': eveningVisit,
    };
    const unlocked: UnlockedMap = unlockedValue ? JSON.parse(unlockedValue) as UnlockedMap : {};
    const now = new Date().toISOString();
    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      if (!unlocked[definition.id] && (progressById[definition.id] ?? 0) >= definition.target) unlocked[definition.id] = now;
    }
    await AsyncStorage.setItem(unlockedKey(userId), JSON.stringify(unlocked));

    return ACHIEVEMENT_DEFINITIONS.map((definition) => ({
      ...definition,
      progress: Math.min(progressById[definition.id] ?? 0, definition.target),
      unlocked: !!unlocked[definition.id],
      unlockedAt: unlocked[definition.id],
    }));
  },

  async recordNearbyVisit(spot: { id: string; title: string; contentTypeId: string; latitude: number; longitude: number }): Promise<boolean> {
    const userId = await getUserId();
    const visits = await readVisits(userId);
    const today = localDateKey(new Date().toISOString());
    if (visits.some((visit) => visit.placeId === spot.id && localDateKey(visit.visitedAt) === today)) return false;
    visits.push({ placeId: spot.id, title: spot.title, contentTypeId: spot.contentTypeId, latitude: spot.latitude, longitude: spot.longitude, visitedAt: new Date().toISOString() });
    await AsyncStorage.setItem(visitKey(userId), JSON.stringify(visits));
    return true;
  },
};
