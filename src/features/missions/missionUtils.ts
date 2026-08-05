import type { Mission, MissionFilter, MissionStatus } from '@/types/mission';

export function getMissionStatus(mission: Mission): MissionStatus {
  if (mission.claimedAt) {
    return 'claimed';
  }

  if (mission.progress >= mission.target) {
    return 'completed';
  }

  return 'inProgress';
}

export function getMissionProgressRatio(mission: Mission): number {
  if (mission.target <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, mission.progress / mission.target));
}

export function formatMissionProgress(mission: Mission): string {
  const progress = Number.isInteger(mission.progress)
    ? mission.progress.toString()
    : mission.progress.toFixed(1);
  const target = Number.isInteger(mission.target)
    ? mission.target.toString()
    : mission.target.toFixed(1);

  return `${progress} / ${target}${mission.unit}`;
}

export function matchesMissionFilter(mission: Mission, filter: MissionFilter): boolean {
  const status = getMissionStatus(mission);

  if (filter === 'active') {
    return status === 'inProgress';
  }

  if (filter === 'done') {
    return status !== 'inProgress';
  }

  return true;
}
