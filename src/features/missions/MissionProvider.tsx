import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { getMissionStatus } from '@/features/missions/missionUtils';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  claimMissionReward,
  fetchMissionDashboard,
  getMillisecondsUntilNextMissionRotation,
  setMissionCompletion,
} from '@/services/missionService';
import type { Mission } from '@/types/mission';

interface MissionContextValue {
  missions: Mission[];
  points: number;
  streakDays: number;
  isLoading: boolean;
  errorMessage: string | null;
  claimingMissionId: string | null;
  claimReward: (missionId: string) => Promise<boolean>;
  setCompleted: (missionId: string, completed: boolean) => Promise<boolean>;
}

const MissionContext = createContext<MissionContextValue | undefined>(undefined);

export function MissionProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [points, setPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const pendingClaims = useRef(new Set<string>());

  useEffect(() => {
    if (status !== 'authenticated') {
      setMissions([]);
      setIsLoading(status === 'loading');
      return;
    }

    setIsLoading(true);
    let isMounted = true;
    let rotationTimer: ReturnType<typeof setTimeout> | undefined;

    const loadDashboard = async (preservePoints: boolean) => {
      try {
        const dashboard = await fetchMissionDashboard();

        if (!isMounted) {
          return;
        }

        setMissions(dashboard.missions);
        if (!preservePoints) {
          setPoints(dashboard.points);
        }
        setStreakDays(dashboard.streakDays);
        setErrorMessage(null);
      } catch {
        if (isMounted) {
          setErrorMessage('미션을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (isMounted && !preservePoints) {
          setIsLoading(false);
        }
      }
    };

    const scheduleRotation = () => {
      rotationTimer = setTimeout(async () => {
        await loadDashboard(true);

        if (isMounted) {
          scheduleRotation();
        }
      }, getMillisecondsUntilNextMissionRotation());
    };

    void loadDashboard(false);
    scheduleRotation();

    return () => {
      isMounted = false;
      if (rotationTimer) {
        clearTimeout(rotationTimer);
      }
    };
  }, [status]);

  const claimReward = async (missionId: string): Promise<boolean> => {
    const mission = missions.find((item) => item.id === missionId);

    if (
      !mission ||
      getMissionStatus(mission) !== 'completed' ||
      pendingClaims.current.has(missionId)
    ) {
      return false;
    }

    pendingClaims.current.add(missionId);
    setClaimingMissionId(missionId);
    setErrorMessage(null);

    try {
      const result = await claimMissionReward(missionId);

      setMissions((currentMissions) =>
        currentMissions.map((item) =>
          item.id === result.missionId ? { ...item, claimedAt: result.claimedAt } : item,
        ),
      );
      setPoints((currentPoints) => currentPoints + mission.rewardPoints);
      return true;
    } catch (error) {
      console.error('Failed to claim mission reward:', error);
      setErrorMessage('보상을 받지 못했어요. 잠시 후 다시 시도해 주세요.');
      return false;
    } finally {
      pendingClaims.current.delete(missionId);
      setClaimingMissionId(null);
    }
  };

  const setCompleted = async (missionId: string, completed: boolean): Promise<boolean> => {
    try {
      const updated = await setMissionCompletion(missionId, completed);
      setMissions((current) => current.map((mission) => mission.id === updated.id ? updated : mission));
      return true;
    } catch {
      setErrorMessage('미션 상태를 저장하지 못했어요.');
      return false;
    }
  };

  return (
    <MissionContext.Provider
      value={{
        missions,
        points,
        streakDays,
        isLoading,
        errorMessage,
        claimingMissionId,
        claimReward,
        setCompleted,
      }}
    >
      {children}
    </MissionContext.Provider>
  );
}

export function useMissions(): MissionContextValue {
  const value = useContext(MissionContext);

  if (!value) {
    throw new Error('useMissions must be used inside MissionProvider');
  }

  return value;
}
