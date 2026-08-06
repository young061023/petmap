export type ActivityCategory = '산책' | '간식' | '놀이' | '병원' | '여행' | '기록';

export interface TimelineActivity {
  id: string;
  time: string; // e.g. "09:30 AM" or "09:30"
  title: string;
  description: string;
  category: ActivityCategory;
  dateString: string; // e.g. "2026-08-04"
  location?: string;
  iconName?: string;
  imageUrl?: any; // Photo sample for timeline
}

export interface MissionItem {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
}

export interface DailySummary {
  dateString: string;
  recordCount: number;
  missionTotal: number;
  missionCompleted: number;
}
