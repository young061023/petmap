import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  fetchMissionDashboard,
  getMillisecondsUntilNextMissionRotation,
  setMissionCompletion,
} from '@/services/missionService';
import type { Mission } from '@/types/mission';

interface MissionContextValue {
  missions: Mission[];
  streakDays: number;
  isLoading: boolean;
  errorMessage: string | null;
  setCompleted: (missionId: string, completed: boolean) => Promise<boolean>;
}

const MissionContext = createContext<MissionContextValue | undefined>(undefined);

export function MissionProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      setMissions([]);
      setIsLoading(status === 'loading');
      return;
    }

    setIsLoading(true);
    let isMounted = true;
    let rotationTimer: ReturnType<typeof setTimeout> | undefined;

    const loadDashboard = async () => {
      try {
        const dashboard = await fetchMissionDashboard();

        if (!isMounted) {
          return;
        }

        setMissions(dashboard.missions);
        setStreakDays(dashboard.streakDays);
        setErrorMessage(null);
      } catch {
        if (isMounted) {
          setErrorMessage('미션을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const scheduleRotation = () => {
      rotationTimer = setTimeout(async () => {
        await loadDashboard();

        if (isMounted) {
          scheduleRotation();
        }
      }, getMillisecondsUntilNextMissionRotation());
    };

    void loadDashboard();
    scheduleRotation();

    return () => {
      isMounted = false;
      if (rotationTimer) {
        clearTimeout(rotationTimer);
      }
    };
  }, [status]);

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
        streakDays,
        isLoading,
        errorMessage,
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
