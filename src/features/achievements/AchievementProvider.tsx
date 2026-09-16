import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useMissions } from '@/features/missions/MissionProvider';
import { achievementService } from '@/services/achievementService';
import type { PetSpot } from '@/services/petTourService';
import type { Achievement } from '@/types/achievement';

interface AchievementContextValue {
  achievements: Achievement[];
  unlockedCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  recordNearbyLocation: (latitude: number, longitude: number, spots: PetSpot[]) => Promise<void>;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function AchievementProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const { missions } = useMissions();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      setAchievements(await achievementService.getAchievements());
    } catch (error) {
      console.warn('[achievements] refresh failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => { void refresh(); }, [refresh, missions]);

  const recordNearbyLocation = useCallback(async (latitude: number, longitude: number, spots: PetSpot[]) => {
    if (status !== 'authenticated' || spots.length === 0) return;
    const nearest = spots.map((spot) => ({ spot, distance: distanceMeters(latitude, longitude, spot.latitude, spot.longitude) })).sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.distance <= 120 && await achievementService.recordNearbyVisit(nearest.spot)) await refresh();
  }, [refresh, status]);

  const value = useMemo(() => ({ achievements, unlockedCount: achievements.filter((item) => item.unlocked).length, isLoading, refresh, recordNearbyLocation }), [achievements, isLoading, recordNearbyLocation, refresh]);
  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>;
}

export function useAchievements(): AchievementContextValue {
  const value = useContext(AchievementContext);
  if (!value) throw new Error('useAchievements must be used inside AchievementProvider');
  return value;
}
