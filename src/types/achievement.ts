export type AchievementCategory = 'exploration' | 'mission' | 'record' | 'special';

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  target: number;
}

export interface Achievement extends AchievementDefinition {
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface PlaceVisit {
  placeId: string;
  title: string;
  contentTypeId: string;
  latitude: number;
  longitude: number;
  visitedAt: string;
}
