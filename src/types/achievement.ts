import type { ComponentType } from 'react';

export type AchievementCategory = 'exploration' | 'mission' | 'record' | 'special';

export type AchievementIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: AchievementIcon;
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
