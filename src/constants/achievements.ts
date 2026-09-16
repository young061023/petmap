import type { AchievementDefinition } from '@/types/achievement';

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'exploration' as const, label: '탐험 업적' },
  { id: 'mission' as const, label: '미션 업적' },
  { id: 'record' as const, label: '기록 업적' },
  { id: 'special' as const, label: '특별 업적' },
];

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'first-step', category: 'exploration', name: '첫 발자국', description: '첫 번째 장소를 방문했어요!', icon: '🐾', target: 1 },
  { id: 'neighborhood-explorer', category: 'exploration', name: '동네 탐험가', description: '새로운 장소 5곳을 방문했어요!', icon: '🗺️', target: 5 },
  { id: 'travel-pioneer', category: 'exploration', name: '여행 개척자', description: '새로운 장소 10곳을 방문했어요!', icon: '🧭', target: 10 },
  { id: 'footprint-collector', category: 'exploration', name: '발자국 수집가', description: '30곳 이상의 장소를 방문했어요!', icon: '👣', target: 30 },
  { id: 'national-pup', category: 'exploration', name: '전국 댕댕이', description: '100곳 이상의 장소를 방문했어요!', icon: '🇰🇷', target: 100 },
  { id: 'mission-beginner', category: 'mission', name: '미션 입문자', description: '미션 10개를 완료했어요!', icon: '🎯', target: 10 },
  { id: 'mission-runner', category: 'mission', name: '미션 러너', description: '미션 50개를 완료했어요!', icon: '🏃', target: 50 },
  { id: 'mission-master', category: 'mission', name: '미션 마스터', description: '미션 100개를 완료했어요!', icon: '🏆', target: 100 },
  { id: 'embroidered-days', category: 'mission', name: '수놓아진 매일', description: '미션 500개를 완료했어요!', icon: '✨', target: 500 },
  { id: 'perfect-day', category: 'mission', name: '완벽한 하루', description: '하루의 모든 미션을 완료했어요!', icon: '🌟', target: 1 },
  { id: 'steady-traveler', category: 'mission', name: '꾸준한 여행자', description: '주간 미션을 4회 이상 완료했어요!', icon: '📅', target: 4 },
  { id: 'first-memory', category: 'record', name: '첫 번째 추억', description: '첫 여행 기록을 남겼어요!', icon: '📝', target: 1 },
  { id: 'travel-diary', category: 'record', name: '여행 일기장', description: '여행 기록을 10개 작성했어요!', icon: '📔', target: 10 },
  { id: 'memory-storage', category: 'record', name: '추억 저장소', description: '여행 기록을 30개 남겼어요!', icon: '🗃️', target: 30 },
  { id: 'hundred-memories', category: 'record', name: '100가지 추억 조각', description: '여행 기록을 100개 남겼어요!', icon: '💯', target: 100 },
  { id: 'one-snapshot', category: 'record', name: '찰칵 한 컷', description: '사진 기록을 10개 남겼어요!', icon: '📷', target: 10 },
  { id: 'photo-collector', category: 'record', name: '포토 수집가', description: '사진 기록을 50개 남겼어요!', icon: '🖼️', target: 50 },
  { id: 'videographer', category: 'record', name: '비디오그래퍼', description: '영상 기록을 10개 남겼어요!', icon: '🎥', target: 10 },
  { id: 'wherever-paws-lead', category: 'special', name: '발길이 닿는 대로', description: '하루에 3곳을 방문했어요!', icon: '🐕', target: 3 },
  { id: 'back-again', category: 'special', name: '다시 여기로', description: '같은 장소를 2회 방문했어요!', icon: '🔁', target: 2 },
  { id: 'regular-begins', category: 'special', name: '단골의 시작', description: '같은 장소를 5회 방문했어요!', icon: '💚', target: 5 },
  { id: 'recording-today', category: 'special', name: '오늘도 기록', description: '3일 연속 기록했어요!', icon: '🔥', target: 3 },
  { id: 'steady-footprints', category: 'special', name: '꾸준함의 발자국', description: '14일 연속 기록했어요!', icon: '🌱', target: 14 },
  { id: 'coffee-after-walk', category: 'special', name: '산책 후 커피 한잔', description: '산책 장소 방문 후 2시간 이내 반려동물 동반 카페를 방문했어요!', icon: '☕', target: 1 },
  { id: 'rainy-indoor-trip', category: 'special', name: '비 오는 날 실내 나들이', description: '비가 오는 날 실내 장소를 방문했어요!', icon: '🌧️', target: 1 },
  { id: 'morning-walk', category: 'special', name: '아침 산책 챌린지', description: '오전 시간대에 장소를 방문했어요!', icon: '🌅', target: 1 },
  { id: 'evening-walk', category: 'special', name: '선선한 저녁 산책', description: '오후 6시 이후 산책 장소를 방문했어요!', icon: '🌙', target: 1 },
];
