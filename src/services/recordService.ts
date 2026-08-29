import type { DailySummary, TimelineActivity } from '../types/record';

import { supabase } from './supabase';

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error('기록을 저장하려면 로그인이 필요해요.');
  return data.session.user.id;
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
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('user_id', userId)
      .eq('record_date', dateString)
      .order('record_time');
    if (error) throw new Error('기록을 불러오지 못했어요.');
    return (data ?? []).map(mapActivity);
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
        image_url: typeof newActivity.imageUrl === 'string' ? newActivity.imageUrl : null,
      })
      .select()
      .single();
    if (error) throw new Error('기록을 저장하지 못했어요.');
    return mapActivity(data);
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
