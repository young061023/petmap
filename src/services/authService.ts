import type { SignInInput, SignUpInput } from '@/types/auth';
import type { UserProfile } from '@/types/user';

import { supabase } from './supabase';

const mapProfile = (row: Record<string, unknown>, email: string): UserProfile => ({
  id: String(row.id),
  email,
  name: String(row.name ?? ''),
  pointBalance: Number(row.point_balance ?? 0),
  couponCount: Number(row.coupon_count ?? 0),
  badgeCount: Number(row.badge_count ?? 0),
  completedMissionCount: Number(row.completed_mission_count ?? 0),
  visitedRegionCount: Number(row.visited_region_count ?? 0),
});

export const authService = {
  async signUp(input: SignUpInput): Promise<UserProfile | null> {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: { data: { name: input.name.trim() } },
    });
    if (error) throw new Error(error.message);
    if (!data.user || !data.session) return null;
    return this.getProfile(data.user.id, data.user.email ?? input.email);
  },

  async signIn(input: SignInInput): Promise<UserProfile> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('email not confirmed')) {
        throw new Error('이메일 인증이 필요해요. 받은 메일의 인증 링크를 눌러 주세요.');
      }
      if (message.includes('invalid login credentials')) {
        throw new Error('이메일 또는 비밀번호를 확인해 주세요.');
      }
      throw new Error(`로그인하지 못했어요: ${error.message}`);
    }
    return this.getProfile(data.user.id, data.user.email ?? input.email);
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getProfile(userId: string, email: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profile_summaries')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error('프로필을 불러오지 못했어요.');
    return mapProfile(data, email);
  },
};
