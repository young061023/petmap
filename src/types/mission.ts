export type MissionPeriod = 'daily' | 'weekly';

export type MissionCategory = 'walk' | 'place' | 'training' | 'bonding' | 'photo';

export type MissionStatus = 'inProgress' | 'completed' | 'claimed';

export type MissionFilter = 'all' | 'active' | 'done';

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  period: MissionPeriod;
  rewardPoints: number;
  progress: number;
  target: number;
  unit: string;
  deadlineLabel: string;
  instructions: string[];
  claimedAt?: string;
}

export interface MissionDashboard {
  points: number;
  streakDays: number;
  missions: Mission[];
}

export interface MissionClaimResult {
  missionId: string;
  claimedAt: string;
}
