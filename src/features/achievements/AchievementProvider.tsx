import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useMissions } from '@/features/missions/MissionProvider';
import { achievementService } from '@/services/achievementService';
import type { PetSpot } from '@/services/petTourService';
import type { Achievement } from '@/types/achievement';

import { AchievementUnlockCelebration } from './AchievementUnlockCelebration';

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
  const [unlockQueue, setUnlockQueue] = useState<Achievement[]>([]);
  const [activeUnlock, setActiveUnlock] = useState<Achievement | null>(null);
  const knownUnlockedIds = useRef<Set<string> | null>(null);

  const dismissUnlock = useCallback(() => setActiveUnlock(null), []);

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const nextAchievements = await achievementService.getAchievements();
      const nextUnlockedIds = new Set(nextAchievements.filter((item) => item.unlocked).map((item) => item.id));

      if (knownUnlockedIds.current) {
        const newlyUnlocked = nextAchievements.filter(
          (item) => item.unlocked && !knownUnlockedIds.current?.has(item.id),
        );
        if (newlyUnlocked.length > 0) {
          setUnlockQueue((current) => [
            ...current,
            ...newlyUnlocked.filter((item) => !current.some((queued) => queued.id === item.id)),
          ]);
        }
      }

      knownUnlockedIds.current = nextUnlockedIds;
      setAchievements(nextAchievements);
    } catch (error) {
      console.warn('[achievements] refresh failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => { void refresh(); }, [refresh, missions]);

  useEffect(() => {
    if (status === 'authenticated') return;
    knownUnlockedIds.current = null;
    setUnlockQueue([]);
    setActiveUnlock(null);
  }, [status]);

  useEffect(() => {
    if (activeUnlock || unlockQueue.length === 0) return;
    setActiveUnlock(unlockQueue[0]);
    setUnlockQueue((current) => current.slice(1));
  }, [activeUnlock, unlockQueue]);

  const recordNearbyLocation = useCallback(async (latitude: number, longitude: number, spots: PetSpot[]) => {
    if (status !== 'authenticated' || spots.length === 0) return;
    const nearest = spots.map((spot) => ({ spot, distance: distanceMeters(latitude, longitude, spot.latitude, spot.longitude) })).sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.distance <= 120 && await achievementService.recordNearbyVisit(nearest.spot)) await refresh();
  }, [refresh, status]);

  const value = useMemo(() => ({ achievements, unlockedCount: achievements.filter((item) => item.unlocked).length, isLoading, refresh, recordNearbyLocation }), [achievements, isLoading, recordNearbyLocation, refresh]);
  return <AchievementContext.Provider value={value}>
    {children}
    <AchievementUnlockCelebration achievement={activeUnlock} onClose={dismissUnlock} />
  </AchievementContext.Provider>;
}

export function useAchievements(): AchievementContextValue {
  const value = useContext(AchievementContext);
  if (!value) throw new Error('useAchievements must be used inside AchievementProvider');
  return value;
}
