import type { PetProfile, UserProfile } from '@/types/user';

import { supabase } from './supabase';

export const profileService = {
  async getPet(userId: string): Promise<PetProfile | undefined> {
    const { data, error } = await supabase.from('pets').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw new Error('반려동물 정보를 불러오지 못했어요.');
    if (!data) return undefined;
    return {
      id: data.id,
      name: data.name,
      breed: data.breed,
      size: data.size,
      birthDate: data.birth_date ?? undefined,
      imageUrl: data.image_url ?? undefined,
    };
  },

  async updatePet(profile: UserProfile, pet: Omit<PetProfile, 'id'>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('pets')
      .upsert({
        user_id: profile.id,
        name: pet.name,
        breed: pet.breed,
        size: pet.size,
        birth_date: pet.birthDate ?? null,
        image_url: pet.imageUrl ?? null,
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw new Error('반려동물 정보를 저장하지 못했어요.');
    return { ...profile, pet: { ...pet, id: data.id } };
  },

  async updatePetName(profile: UserProfile, name: string): Promise<UserProfile> {
    if (!profile.pet) throw new Error('반려동물 프로필을 먼저 등록해 주세요.');
    return this.updatePet(profile, { ...profile.pet, name });
  },
};
