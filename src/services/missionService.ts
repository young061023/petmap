import type {
  Mission,
  MissionCategory,
  MissionClaimResult,
  MissionDashboard,
  MissionPeriod,
} from '@/types/mission';

interface MissionTemplate {
  key: string;
  title: string;
  description: string;
  category: MissionCategory;
  rewardPoints: number;
  target: number;
  unit: string;
  instructions: string[];
}

const categoryOrder: readonly MissionCategory[] = [
  'walk',
  'place',
  'training',
  'bonding',
  'photo',
];

const dailyMissionPool: readonly MissionTemplate[] = [
  {
    key: 'pet-route-captain',
    title: '오늘은 네가 길잡이',
    description: '갈림길에서 반려동물이 고른 방향을 따라가 보세요.',
    category: 'walk',
    rewardPoints: 70,
    target: 3,
    unit: '번',
    instructions: [
      '안전한 갈림길에 도착하면 잠시 멈춰 주세요.',
      '반려동물이 먼저 향하는 방향으로 걸어 주세요.',
      '서로 다른 갈림길 세 곳을 지나면 완료돼요.',
    ],
  },
  {
    key: 'nonstop-ten',
    title: '10분 무정지 탐험',
    description: '익숙한 길을 새로운 리듬으로 끊김 없이 걸어 보세요.',
    category: 'walk',
    rewardPoints: 60,
    target: 10,
    unit: '분',
    instructions: [
      '안전하고 한적한 산책 구간을 골라 주세요.',
      '10분 동안 일정한 속도로 산책을 이어 가세요.',
      '신호 대기 시간은 자동으로 제외돼요.',
    ],
  },
  {
    key: 'right-turn-map',
    title: '오른쪽만 골라 걷기',
    description: '네 번의 교차로에서 오른쪽을 골라 뜻밖의 경로를 만들어요.',
    category: 'walk',
    rewardPoints: 80,
    target: 4,
    unit: '번',
    instructions: [
      '보행로가 있는 안전한 교차로에서만 진행해 주세요.',
      '교차로를 만날 때마다 오른쪽 길을 선택해 주세요.',
      '네 번 방향을 바꾸면 오늘의 경로가 완성돼요.',
    ],
  },
  {
    key: 'quiet-pocket',
    title: '소리 낮은 쉼터 찾기',
    description: '차 소리가 적고 반려동물이 편안해하는 장소를 발견해요.',
    category: 'place',
    rewardPoints: 90,
    target: 1,
    unit: '곳',
    instructions: [
      '지도에서 평소 가지 않던 녹지나 골목을 골라 주세요.',
      '반려동물이 편안히 머문 장소를 저장해 주세요.',
    ],
  },
  {
    key: 'open-new-block',
    title: '지도에 없던 한 블록 열기',
    description: '평소 경로에서 한 블록만 벗어나 새 길을 기록해 보세요.',
    category: 'place',
    rewardPoints: 80,
    target: 1,
    unit: '구간',
    instructions: [
      '기존 산책 기록과 겹치지 않는 가까운 길을 찾아 주세요.',
      '새 구간을 200m 이상 걸으면 완료돼요.',
    ],
  },
  {
    key: 'paw-texture-hunt',
    title: '발바닥 촉감 3종 찾기',
    description: '잔디, 흙길, 보도처럼 서로 다른 바닥을 탐험해요.',
    category: 'place',
    rewardPoints: 100,
    target: 3,
    unit: '종류',
    instructions: [
      '발에 안전한 바닥만 골라 주세요.',
      '서로 다른 바닥을 지날 때마다 지도에 표시해 주세요.',
      '세 가지 촉감을 만나면 완료돼요.',
    ],
  },
  {
    key: 'pace-remix',
    title: '산책 속도 리믹스',
    description: '천천히, 보통, 빠르게 세 가지 리듬을 맞춰 걸어요.',
    category: 'training',
    rewardPoints: 70,
    target: 3,
    unit: '단계',
    instructions: [
      '한적한 직선 구간을 선택해 주세요.',
      '각 속도를 2분씩 유지해 주세요.',
      '반려동물이 힘들어하면 즉시 속도를 낮춰 주세요.',
    ],
  },
  {
    key: 'name-eye-contact',
    title: '이름 부르면 눈맞춤',
    description: '산책 중 이름을 부르고 자연스럽게 시선을 맞춰 보세요.',
    category: 'training',
    rewardPoints: 60,
    target: 5,
    unit: '회',
    instructions: [
      '주변이 안전할 때 반려동물의 이름을 불러 주세요.',
      '눈을 마주치면 부드럽게 칭찬해 주세요.',
      '서로 다른 구간에서 다섯 번 성공하면 완료돼요.',
    ],
  },
  {
    key: 'calm-stop-signal',
    title: '차분한 멈춤 신호',
    description: '횡단보도 앞에서 함께 멈추는 습관을 연습해요.',
    category: 'training',
    rewardPoints: 80,
    target: 3,
    unit: '회',
    instructions: [
      '횡단보도에서 충분히 떨어진 안전한 위치에 멈춰 주세요.',
      '같은 짧은 신호를 사용해 기다림을 알려 주세요.',
      '차분하게 세 번 멈추면 완료돼요.',
    ],
  },
  {
    key: 'phone-free-walk',
    title: '10분 폰 없는 산책',
    description: '화면 대신 반려동물의 표정과 움직임에 집중해요.',
    category: 'bonding',
    rewardPoints: 70,
    target: 10,
    unit: '분',
    instructions: [
      '산책 기록을 시작한 뒤 휴대폰 화면을 꺼 주세요.',
      '10분 동안 반려동물의 속도와 시선을 관찰해 주세요.',
    ],
  },
  {
    key: 'sniff-treasure-hunt',
    title: '킁킁 보물찾기',
    description: '반려동물이 오래 머무는 냄새 포인트를 찾아봐요.',
    category: 'bonding',
    rewardPoints: 60,
    target: 4,
    unit: '곳',
    instructions: [
      '리드줄을 느슨하게 유지하고 탐색할 시간을 주세요.',
      '반려동물이 스스로 고른 냄새 포인트를 기록해 주세요.',
      '서로 다른 네 곳을 찾으면 완료돼요.',
    ],
  },
  {
    key: 'mood-before-after',
    title: '산책 전후 기분 스캔',
    description: '출발 전과 돌아온 뒤 반려동물의 기분 변화를 남겨요.',
    category: 'bonding',
    rewardPoints: 50,
    target: 2,
    unit: '회',
    instructions: [
      '출발 전에 표정, 꼬리, 움직임을 관찰해 주세요.',
      '산책 후 같은 항목을 다시 확인해 주세요.',
      '두 기록을 모두 남기면 완료돼요.',
    ],
  },
  {
    key: 'eye-level-photo',
    title: '같은 눈높이로 한 장',
    description: '반려동물의 시선 높이에서 오늘의 산책을 남겨요.',
    category: 'photo',
    rewardPoints: 70,
    target: 1,
    unit: '장',
    instructions: [
      '통행을 방해하지 않는 안전한 장소에 멈춰 주세요.',
      '반려동물의 눈높이에서 사진 한 장을 남겨 주세요.',
    ],
  },
  {
    key: 'walk-color-palette',
    title: '오늘의 산책 색 3개',
    description: '길에서 발견한 서로 다른 색을 사진으로 모아 보세요.',
    category: 'photo',
    rewardPoints: 90,
    target: 3,
    unit: '색',
    instructions: [
      '산책 중 눈에 띄는 색을 하나씩 찾아 주세요.',
      '서로 다른 색 세 가지를 촬영하면 완료돼요.',
    ],
  },
  {
    key: 'start-finish-photos',
    title: '산책의 시작과 끝',
    description: '출발할 때와 돌아왔을 때의 표정을 나란히 남겨요.',
    category: 'photo',
    rewardPoints: 80,
    target: 2,
    unit: '장',
    instructions: [
      '산책을 시작하기 전에 첫 사진을 남겨 주세요.',
      '같은 장소에서 돌아온 뒤 두 번째 사진을 남겨 주세요.',
    ],
  },
];

const weeklyMissionPool: readonly MissionTemplate[] = [
  {
    key: 'three-time-zones',
    title: '세 시간대 산책 컬렉션',
    description: '아침, 낮, 저녁의 서로 다른 동네 분위기를 경험해요.',
    category: 'walk',
    rewardPoints: 240,
    target: 3,
    unit: '시간대',
    instructions: [
      '서로 다른 날에 아침, 낮, 저녁 산책을 기록해 주세요.',
      '각 산책을 10분 이상 진행하면 한 시간대로 인정돼요.',
    ],
  },
  {
    key: 'route-shape-collection',
    title: '경로 모양 세 개 만들기',
    description: '지도 위에 원, 세모, 지그재그처럼 다른 궤적을 남겨요.',
    category: 'walk',
    rewardPoints: 280,
    target: 3,
    unit: '개',
    instructions: [
      '안전한 보행로 안에서 경로 모양을 계획해 주세요.',
      '서로 다른 모양의 산책 기록 세 개를 저장해 주세요.',
    ],
  },
  {
    key: 'neighborhood-bingo',
    title: '우리 동네 산책 빙고',
    description: '공원, 흙길, 조용한 골목, 전망 포인트를 채워요.',
    category: 'place',
    rewardPoints: 260,
    target: 4,
    unit: '칸',
    instructions: [
      '이번 주 빙고에 표시된 장소 유형을 확인해 주세요.',
      '각 유형의 장소에서 10분 이상 산책해 주세요.',
      '네 칸을 채우면 완료돼요.',
    ],
  },
  {
    key: 'preference-map',
    title: '반려동물 취향 지도 만들기',
    description: '좋아하는 냄새, 쉼터, 놀이 장소를 지도에 모아요.',
    category: 'place',
    rewardPoints: 300,
    target: 5,
    unit: '곳',
    instructions: [
      '반려동물이 자주 머무는 장소를 관찰해 주세요.',
      '장소마다 좋아한 이유를 짧게 기록해 주세요.',
      '서로 다른 다섯 곳을 저장하면 완료돼요.',
    ],
  },
  {
    key: 'stop-signal-master',
    title: '멈춤 신호 마스터',
    description: '일주일 동안 안전한 멈춤 습관을 차근차근 만들어요.',
    category: 'training',
    rewardPoints: 280,
    target: 20,
    unit: '회',
    instructions: [
      '산책마다 같은 멈춤 신호를 사용해 주세요.',
      '차분히 멈춘 순간을 기록해 누적해 주세요.',
    ],
  },
  {
    key: 'rhythm-walk-days',
    title: '리듬 산책 4일',
    description: '네 번의 산책에서 속도 변화를 놀이처럼 연습해요.',
    category: 'training',
    rewardPoints: 250,
    target: 4,
    unit: '일',
    instructions: [
      '하루 한 번 천천히, 보통, 빠르게 걷기를 섞어 주세요.',
      '각 산책을 15분 이상 진행하면 하루로 인정돼요.',
    ],
  },
  {
    key: 'mood-observation-log',
    title: '기분 관찰 로그',
    description: '산책 전후의 표정과 행동 변화를 일주일 동안 모아요.',
    category: 'bonding',
    rewardPoints: 220,
    target: 5,
    unit: '회',
    instructions: [
      '산책 전후 반려동물의 기분을 한 단어로 남겨 주세요.',
      '서로 다른 날 다섯 번 기록하면 완료돼요.',
    ],
  },
  {
    key: 'pet-led-days',
    title: '반려동물 주도 산책 3일',
    description: '목적지를 정하지 않고 반려동물의 선택을 따라가요.',
    category: 'bonding',
    rewardPoints: 260,
    target: 3,
    unit: '일',
    instructions: [
      '안전한 구역 안에서 반려동물이 방향을 고르게 해 주세요.',
      '하루 15분 이상 진행하면 한 번으로 인정돼요.',
    ],
  },
  {
    key: 'weekly-color-palette',
    title: '일주일 산책 색 팔레트',
    description: '매일 다른 색을 발견해 한 주의 팔레트를 완성해요.',
    category: 'photo',
    rewardPoints: 230,
    target: 5,
    unit: '색',
    instructions: [
      '산책 중 그날을 대표하는 색을 촬영해 주세요.',
      '서로 다른 다섯 색을 모으면 완료돼요.',
    ],
  },
  {
    key: 'same-place-different-face',
    title: '같은 장소, 다른 표정',
    description: '좋아하는 장소를 다시 찾아 매번 다른 순간을 남겨요.',
    category: 'photo',
    rewardPoints: 250,
    target: 3,
    unit: '장',
    instructions: [
      '반려동물이 좋아하는 장소 한 곳을 선택해 주세요.',
      '서로 다른 날 같은 장소에서 사진을 남겨 주세요.',
      '세 장을 모으면 완료돼요.',
    ],
  },
];

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }

  return hash >>> 0;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getWeekRotationKey(date: Date): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);

  return formatLocalDate(monday);
}

function selectTemplates(
  pool: readonly MissionTemplate[],
  count: number,
  rotationKey: string,
): MissionTemplate[] {
  const categoryOffset = hashString(rotationKey) % categoryOrder.length;
  const rotatedCategories = categoryOrder.map(
    (_, index) => categoryOrder[(index + categoryOffset) % categoryOrder.length],
  );

  return rotatedCategories.slice(0, count).map((category) => {
    const candidates = pool.filter((template) => template.category === category);
    const candidateIndex = hashString(`${rotationKey}:${category}`) % candidates.length;
    return candidates[candidateIndex];
  });
}

function getPartialProgress(target: number, ratio: number): number {
  if (target <= 1) {
    return 0;
  }

  return Math.min(target - 1, Math.max(1, Math.round(target * ratio)));
}

function getDemoProgress(template: MissionTemplate, index: number, period: MissionPeriod): number {
  if (period === 'daily') {
    if (index === 1 || index === 2) {
      return template.target;
    }

    return getPartialProgress(template.target, index === 0 ? 0.45 : 0.25);
  }

  if (index === 2) {
    return template.target;
  }

  return getPartialProgress(template.target, index === 0 ? 0.4 : 0.65);
}

function createMission(
  template: MissionTemplate,
  period: MissionPeriod,
  rotationKey: string,
  index: number,
): Mission {
  const isPreclaimedDemoMission = period === 'daily' && index === 2;

  return {
    id: `${period}-${rotationKey}-${template.key}`,
    title: template.title,
    description: template.description,
    category: template.category,
    period,
    rewardPoints: template.rewardPoints,
    progress: getDemoProgress(template, index, period),
    target: template.target,
    unit: template.unit,
    deadlineLabel: period === 'daily' ? '오늘 자정까지' : '일요일 자정까지',
    instructions: [...template.instructions],
    claimedAt: isPreclaimedDemoMission ? `${rotationKey}T00:00:00.000Z` : undefined,
  };
}

export function createMissionsForDate(referenceDate = new Date()): Mission[] {
  const dailyKey = formatLocalDate(referenceDate);
  const weeklyKey = getWeekRotationKey(referenceDate);
  const dailyTemplates = selectTemplates(dailyMissionPool, 4, `daily:${dailyKey}`);
  const weeklyTemplates = selectTemplates(weeklyMissionPool, 3, `weekly:${weeklyKey}`);

  return [
    ...dailyTemplates.map((template, index) => createMission(template, 'daily', dailyKey, index)),
    ...weeklyTemplates.map((template, index) => createMission(template, 'weekly', weeklyKey, index)),
  ];
}

export function getMillisecondsUntilNextMissionRotation(referenceDate = new Date()): number {
  const nextDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + 1,
    0,
    0,
    1,
  );

  return Math.max(1000, nextDay.getTime() - referenceDate.getTime());
}

export async function fetchMissionDashboard(referenceDate = new Date()): Promise<MissionDashboard> {
  await wait(250);

  return {
    points: 1250,
    streakDays: 7,
    missions: createMissionsForDate(referenceDate),
  };
}

export async function claimMissionReward(missionId: string): Promise<MissionClaimResult> {
  await wait(300);

  if (!createMissionsForDate().some((mission) => mission.id === missionId)) {
    throw new Error('Mission not found');
  }

  return {
    missionId,
    claimedAt: new Date().toISOString(),
  };
}
