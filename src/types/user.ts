export type DogSize = 'small' | 'medium' | 'large';

export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  size: DogSize;
  birthDate?: string;
  imageUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  pet?: PetProfile;
  pointBalance: number;
  couponCount: number;
  badgeCount: number;
  completedMissionCount: number;
  visitedRegionCount: number;
}
