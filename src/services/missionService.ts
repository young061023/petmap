import type {
  Mission,
  MissionCategory,
  MissionDashboard,
  MissionPeriod,
} from '@/types/mission';

import { supabase } from './supabase';

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

const dailyBaseMissionPool: readonly MissionTemplate[] = [
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

const weeklyBaseMissionPool: readonly MissionTemplate[] = [
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

const mission = (key: string, title: string, description: string, category: MissionCategory, target: number, unit: string, rewardPoints: number): MissionTemplate => ({
  key, title, description, category, target, unit, rewardPoints,
  instructions: [`${description}`, `목표 ${target}${unit}을 달성한 뒤 완료를 기록해 주세요.`],
});

const dailyAdditionalMissions: readonly MissionTemplate[] = [
  mission('open-petmap', '오늘 댕로컬 접속하기', '댕로컬에 접속해 오늘의 여행을 시작해요.', 'bonding', 1, '회', 30),
  mission('open-map-once', '지도 화면 열어보기', '지도를 열고 주변을 천천히 둘러봐요.', 'place', 1, '회', 30),
  mission('check-nearby', '현재 위치 주변 확인하기', '현재 위치 주변의 반려동물 동반 장소를 확인해요.', 'place', 1, '회', 40),
  mission('view-place-detail', '장소 상세정보 확인하기', '관심 있는 장소의 상세정보를 읽어봐요.', 'place', 1, '곳', 40),
  mission('check-pet-cafe', '반려동물 동반 카페 찾기', '지도에서 함께 갈 수 있는 카페를 확인해요.', 'place', 1, '곳', 50),
  mission('check-walk-place', '산책 장소 찾아보기', '오늘 가고 싶은 산책 장소를 한 곳 찾아봐요.', 'walk', 1, '곳', 50),
  mission('check-restaurant', '동반 음식점 찾아보기', '반려동물과 갈 수 있는 음식점을 확인해요.', 'place', 1, '곳', 50),
  mission('check-attraction', '동반 관광지 찾아보기', '함께 방문할 관광지를 지도에서 확인해요.', 'place', 1, '곳', 50),
  mission('check-lodging', '동반 숙소 찾아보기', '다음 여행을 위한 동반 숙소를 찾아봐요.', 'place', 1, '곳', 50),
  mission('tap-map-marker', '지도 마커 눌러보기', '지도 위 발바닥 마커를 눌러 장소를 확인해요.', 'place', 1, '개', 40),
  mission('search-place-once', '장소 검색 한 번 하기', '궁금한 장소를 검색창에서 찾아봐요.', 'place', 1, '회', 40),
  mission('pick-favorite-place', '마음에 드는 장소 고르기', '오늘 가고 싶은 장소를 한 곳 정해요.', 'bonding', 1, '곳', 40),
  mission('check-weather-plan', '날씨에 맞는 산책 계획', '오늘 날씨를 확인하고 안전한 산책 계획을 세워요.', 'walk', 1, '회', 40),
  mission('browse-three-places', '새로운 장소 3곳 둘러보기', '지도에서 처음 보는 장소 세 곳을 확인해요.', 'place', 3, '곳', 70),
  mission('check-recommendation', '추천 장소 확인하기', '주변 추천 장소 중 한 곳을 자세히 봐요.', 'place', 1, '곳', 50),
  mission('walk-fifteen', '15분 동네 산책', '반려동물과 가볍게 15분 동안 걸어요.', 'walk', 15, '분', 70),
  mission('walk-twenty', '20분 느긋한 산책', '서두르지 않고 20분 동안 함께 걸어요.', 'walk', 20, '분', 80),
  mission('new-alley', '새 골목 한 곳 탐험', '평소 지나지 않던 안전한 골목을 걸어봐요.', 'walk', 1, '곳', 60),
  mission('park-lap', '공원 한 바퀴 돌기', '가까운 공원에서 한 바퀴 산책해요.', 'walk', 1, '바퀴', 70),
  mission('tree-shade-break', '나무 그늘에서 쉬기', '산책 중 그늘에서 잠시 함께 쉬어요.', 'walk', 1, '회', 50),
  mission('water-break', '산책 중 물 마시기', '안전한 곳에서 반려동물에게 물을 챙겨줘요.', 'bonding', 1, '회', 40),
  mission('sniff-three', '냄새 포인트 3곳 찾기', '충분히 냄새를 맡을 수 있는 시간을 줘요.', 'bonding', 3, '곳', 60),
  mission('praise-five', '다섯 번 칭찬하기', '좋은 행동을 발견할 때마다 따뜻하게 칭찬해요.', 'bonding', 5, '회', 50),
  mission('eye-contact-three', '눈맞춤 3번 하기', '이름을 부르고 편안하게 눈을 맞춰요.', 'training', 3, '회', 50),
  mission('sit-three', '앉아 기다려 3번', '안전한 장소에서 짧게 기다리는 연습을 해요.', 'training', 3, '회', 60),
  mission('crosswalk-stop', '횡단보도 앞 멈추기', '횡단보도 앞에서 차분히 멈추는 연습을 해요.', 'training', 2, '회', 60),
  mission('name-response', '이름 반응 연습', '이름을 부르면 바라보는 연습을 해요.', 'training', 5, '회', 60),
  mission('slow-walk-five', '천천히 걷기 5분', '반려동물의 속도에 맞춰 느리게 걸어요.', 'walk', 5, '분', 50),
  mission('grass-step', '잔디길 걸어보기', '발에 안전한 잔디 구간을 찾아 걸어요.', 'place', 1, '곳', 50),
  mission('quiet-rest', '조용한 쉼터 발견', '차 소리가 적은 편안한 쉼터를 찾아요.', 'place', 1, '곳', 60),
  mission('sunset-photo', '노을과 함께 한 장', '저녁 산책의 빛을 사진으로 남겨요.', 'photo', 1, '장', 60),
  mission('paw-photo', '오늘의 발 사진', '귀여운 발이나 발자국을 사진으로 남겨요.', 'photo', 1, '장', 50),
  mission('smile-photo', '웃는 얼굴 한 장', '즐거운 표정을 사진으로 기록해요.', 'photo', 1, '장', 60),
  mission('favorite-object-photo', '좋아하는 물건과 사진', '좋아하는 장난감이나 물건과 함께 찍어요.', 'photo', 1, '장', 50),
  mission('record-memory', '오늘의 추억 기록', '오늘 함께한 순간을 여행 기록에 남겨요.', 'photo', 1, '개', 50),
  mission('write-three-lines', '세 줄 산책 일기', '산책에서 느낀 점을 세 줄로 기록해요.', 'bonding', 3, '줄', 50),
  mission('new-sound', '새로운 소리 관찰', '산책길에서 들린 새로운 소리를 함께 관찰해요.', 'bonding', 1, '개', 40),
  mission('calm-minute', '1분 차분히 머물기', '조용한 장소에서 함께 1분간 머물러요.', 'training', 1, '분', 40),
  mission('turn-practice', '방향 전환 연습', '안전한 길에서 좌우 방향 전환을 연습해요.', 'training', 4, '회', 60),
  mission('different-surface-two', '바닥 촉감 2종', '서로 다른 안전한 바닥 두 종류를 걸어봐요.', 'place', 2, '종류', 60),
  mission('bench-break', '벤치에서 잠깐 쉬기', '산책 중 벤치 근처에서 휴식해요.', 'walk', 1, '회', 40),
  mission('greeting-manners', '차분한 인사 연습', '다른 사람이나 반려견을 볼 때 차분히 지나가요.', 'training', 2, '회', 60),
  mission('toy-play-ten', '장난감 놀이 10분', '좋아하는 장난감으로 함께 놀아줘요.', 'bonding', 10, '분', 60),
  mission('brush-five', '빗질 5분 하기', '편안하게 빗질하며 몸 상태를 살펴요.', 'bonding', 5, '분', 50),
  mission('safe-route-save', '안전한 산책길 정하기', '차량 통행이 적은 산책길을 하나 골라요.', 'place', 1, '개', 50),
];

const weeklyAdditionalMissions: readonly MissionTemplate[] = [
  mission('visit-pet-cafe-weekly', '동반 카페 1곳 방문', '이번 주 반려동물 동반 카페를 방문해요.', 'place', 1, '곳', 180),
  mission('visit-walk-place-weekly', '산책 장소 1곳 방문', '이번 주 새로운 산책 장소를 방문해요.', 'walk', 1, '곳', 170),
  mission('visit-park-weekly', '동반 공원 1곳 방문', '반려동물과 함께 공원을 방문해요.', 'place', 1, '곳', 180),
  mission('visit-attraction-weekly', '동반 관광지 1곳 방문', '함께 즐길 수 있는 관광지를 방문해요.', 'place', 1, '곳', 200),
  mission('visit-restaurant-weekly', '동반 음식점 1곳 방문', '반려동물 동반 음식점을 방문해요.', 'place', 1, '곳', 200),
  mission('visit-local-shop', '지역 상점 1곳 방문', '동네의 작은 상점을 한 곳 발견해요.', 'place', 1, '곳', 180),
  mission('visit-coast-walk', '해변 또는 해안 산책', '안전한 해변이나 해안 산책로를 방문해요.', 'walk', 1, '곳', 220),
  mission('visit-first-place', '처음 가보는 장소 방문', '한 번도 방문하지 않은 장소를 찾아가요.', 'place', 1, '곳', 200),
  mission('visit-recommended-place', '추천 장소 1곳 방문', '앱의 추천 장소 중 한 곳을 방문해요.', 'place', 1, '곳', 190),
  mission('visit-nearby-place', '현재 위치 주변 장소 방문', '가까운 동반 장소 한 곳을 방문해요.', 'place', 1, '곳', 170),
  mission('visit-two-places', '서로 다른 장소 2곳 방문', '이번 주 두 곳에서 새로운 추억을 만들어요.', 'place', 2, '곳', 240),
  mission('visit-two-types', '서로 다른 종류 2곳 방문', '서로 다른 유형의 장소 두 곳을 방문해요.', 'place', 2, '종류', 240),
  mission('walk-and-cafe', '산책 장소와 카페 방문', '산책 후 동반 카페까지 이어서 방문해요.', 'place', 2, '곳', 260),
  mission('attraction-and-shop', '관광지와 지역 상점 방문', '관광지와 지역 상점을 각각 한 곳 방문해요.', 'place', 2, '곳', 260),
  mission('three-places-one-area', '한 지역에서 3곳 방문', '같은 지역의 서로 다른 장소 세 곳을 방문해요.', 'place', 3, '곳', 300),
  mission('walk-three-days', '주 3일 산책', '서로 다른 날에 세 번 산책해요.', 'walk', 3, '일', 220),
  mission('walk-five-days', '주 5일 산책', '이번 주 다섯 날을 함께 걸어요.', 'walk', 5, '일', 300),
  mission('total-sixty-minutes', '주간 산책 60분', '이번 주 누적 60분을 산책해요.', 'walk', 60, '분', 260),
  mission('three-parks', '공원 3곳 탐험', '서로 다른 공원 세 곳을 찾아가요.', 'place', 3, '곳', 300),
  mission('two-new-routes', '새 산책길 2개', '처음 걷는 산책 경로 두 개를 만들어요.', 'walk', 2, '개', 260),
  mission('training-four-days', '훈련 4일 이어가기', '짧은 기본 훈련을 서로 다른 날 네 번 해요.', 'training', 4, '일', 250),
  mission('eye-contact-twenty', '눈맞춤 20회', '일주일 동안 눈맞춤을 스무 번 연습해요.', 'training', 20, '회', 240),
  mission('calm-stop-ten', '차분한 멈춤 10회', '산책 중 안전한 멈춤을 열 번 연습해요.', 'training', 10, '회', 250),
  mission('bonding-five-days', '교감 시간 5일', '서로 다른 날에 교감 놀이를 진행해요.', 'bonding', 5, '일', 260),
  mission('five-memories', '추억 기록 5개', '이번 주의 소중한 순간을 다섯 개 남겨요.', 'photo', 5, '개', 250),
  mission('three-photos', '사진 3장 남기기', '서로 다른 날의 사진 세 장을 기록해요.', 'photo', 3, '장', 220),
  mission('morning-evening', '아침과 저녁 산책', '아침 산책과 저녁 산책을 각각 경험해요.', 'walk', 2, '시간대', 220),
  mission('weather-plan-three', '날씨 맞춤 계획 3회', '날씨에 맞춰 세 번 안전한 활동을 계획해요.', 'bonding', 3, '회', 210),
  mission('weekly-kindness', '칭찬 30회', '일주일 동안 좋은 행동을 서른 번 칭찬해요.', 'bonding', 30, '회', 240),
  mission('weekly-textures', '바닥 촉감 5종', '이번 주 안전한 바닥 촉감 다섯 가지를 경험해요.', 'place', 5, '종류', 270),
];

const dailyMissionPool: readonly MissionTemplate[] = [...dailyBaseMissionPool, ...dailyAdditionalMissions];
const weeklyMissionPool: readonly MissionTemplate[] = [...weeklyBaseMissionPool, ...weeklyAdditionalMissions];

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
  const shuffled = [...pool].sort((left, right) => hashString(`${rotationKey}:${left.key}`) - hashString(`${rotationKey}:${right.key}`));
  const shuffledCategories = [...categoryOrder].sort((left, right) => hashString(`${rotationKey}:${left}`) - hashString(`${rotationKey}:${right}`));
  const selected: MissionTemplate[] = [];

  for (const category of shuffledCategories) {
    const candidate = shuffled.find((template) => template.category === category && !selected.includes(template));
    if (candidate) selected.push(candidate);
    if (selected.length === count) return selected;
  }

  for (const template of shuffled) {
    if (!selected.includes(template)) selected.push(template);
    if (selected.length === count) break;
  }
  return selected;
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
  return {
    id: `${period}-${rotationKey}-${template.key}`,
    title: template.title,
    description: template.description,
    category: template.category,
    period,
    rewardPoints: template.rewardPoints,
    progress: 0,
    target: template.target,
    unit: template.unit,
    deadlineLabel: period === 'daily' ? '오늘 자정까지' : '일요일 자정까지',
    instructions: [...template.instructions],
    assignedDate: rotationKey,
  };
}

export function createMissionsForDate(referenceDate = new Date(), userSeed = ''): Mission[] {
  const dailyKey = formatLocalDate(referenceDate);
  const weeklyKey = getWeekRotationKey(referenceDate);
  const dailyTemplates = selectTemplates(dailyMissionPool, 3, `daily:${dailyKey}:${userSeed}`);
  const weeklyTemplates = selectTemplates(weeklyMissionPool, 5, `weekly:${weeklyKey}:${userSeed}`);

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
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.user) throw new Error('Authentication required');
  const userId = sessionData.session.user.id;

  const selectedMissions = createMissionsForDate(referenceDate, userId);
  const { error: assignmentError } = await supabase.rpc('ensure_rotating_missions', {
    p_missions: selectedMissions.map((missionItem) => ({
      id: missionItem.id,
      title: missionItem.title,
      description: missionItem.description,
      category: missionItem.category,
      period: missionItem.period,
      rewardPoints: missionItem.rewardPoints,
      target: missionItem.target,
      unit: missionItem.unit,
      deadlineLabel: missionItem.deadlineLabel,
      instructions: missionItem.instructions,
      assignedDate: missionItem.assignedDate,
    })),
  });
  if (assignmentError) throw new Error('Missions could not be prepared');

  const { data: missionRows, error: missionError } = await supabase
    .from('user_missions')
    .select('*')
    .eq('user_id', userId)
    .in('id', selectedMissions.map((missionItem) => missionItem.id))
    .order('period')
    .order('created_at');
  if (missionError) throw new Error('Missions could not be loaded');

  return {
    streakDays: 0,
    missions: (missionRows ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      period: row.period,
      rewardPoints: row.reward_points,
      progress: row.progress,
      target: row.target,
      unit: row.unit,
      deadlineLabel: row.deadline_label,
      instructions: row.instructions,
      assignedDate: row.assigned_date,
      claimedAt: row.claimed_at ?? undefined,
    })),
  };
}

export async function setMissionCompletion(missionId: string, completed: boolean): Promise<Mission> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.user) throw new Error('Authentication required');
  const userId = sessionData.session.user.id;
  const { data: current, error: readError } = await supabase
    .from('user_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('id', missionId)
    .single();
  if (readError) throw new Error('Mission not found');
  const { data, error } = await supabase
    .from('user_missions')
    .update({ progress: completed ? current.target : 0 })
    .eq('user_id', userId)
    .eq('id', missionId)
    .is('claimed_at', null)
    .select()
    .single();
  if (error) throw new Error('Mission could not be updated');
  return {
    id: data.id, title: data.title, description: data.description, category: data.category,
    period: data.period, rewardPoints: data.reward_points, progress: data.progress,
    target: data.target, unit: data.unit, deadlineLabel: data.deadline_label,
    instructions: data.instructions, assignedDate: data.assigned_date,
    claimedAt: data.claimed_at ?? undefined,
  };
}
