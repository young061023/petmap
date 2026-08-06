import { TimelineActivity, MissionItem, DailySummary } from '../types/record';

// Sample Pet Travel Photos
const PET_PARK_IMAGE = require('../../assets/pet_park_walk.jpg');
const PET_SUNSET_IMAGE = require('../../assets/pet_sunset_beach.jpg');

let initialActivities: TimelineActivity[] = [
  // 2026-08-04 (Today)
  {
    id: 'act-1',
    time: '08:30 AM',
    title: '아침 햇살 가득한 공원 산책 🐾',
    description: '알록달록 예쁜 꽃밭 사이로 신나게 뛰놀고 킁킁 노즈워크!',
    category: '산책',
    dateString: '2026-08-04',
    location: '중앙 반려견 공원',
    imageUrl: PET_PARK_IMAGE,
  },
  {
    id: 'act-2',
    time: '12:15 PM',
    title: '맛있는 달콤 닭가슴살 간식 🍗',
    description: '오전 산책 후 영양 듬뿍 수제 닭가슴살 칩 냠냠 맛나게 먹었어요.',
    category: '간식',
    dateString: '2026-08-04',
  },
  {
    id: 'act-3',
    time: '03:40 PM',
    title: '장난감 삑삑이 터그놀이 🧸',
    description: '거실에서 제일 좋아하는 최애 인형으로 20분 동안 신나게 놀아주기.',
    category: '놀이',
    dateString: '2026-08-04',
  },
  {
    id: 'act-4',
    time: '07:00 PM',
    title: '노을 빛 가득한 해변 스냅 📸',
    description: '핑크빛 노을이 지는 낭만 바닷가에서 몽이의 평생 소장용 인생샷 달성!',
    category: '여행',
    dateString: '2026-08-04',
    location: '해변 산책로',
    imageUrl: PET_SUNSET_IMAGE,
  },

  // 2026-08-03 (Yesterday)
  {
    id: 'act-5',
    time: '09:00 AM',
    title: '바닷가 애견 카페 탐방 🌊',
    description: '탁 트인 바다 뷰를 보며 뛰놀기! 인싸 강아지로 등극.',
    category: '여행',
    dateString: '2026-08-03',
    location: '오션뷰 펫카페',
    imageUrl: PET_SUNSET_IMAGE,
  },
  {
    id: 'act-6',
    time: '02:00 PM',
    title: '정기 건강검진 & 예방접종 🏥',
    description: '병원 다녀왔지만 얌전하게 주사 잘 맞아 장하다고 원장님이 칭찬해주셨어요.',
    category: '병원',
    dateString: '2026-08-03',
  },

  // 2026-08-05 (Tomorrow / Future)
  {
    id: 'act-8',
    time: '10:00 AM',
    title: '펫 페어 피크닉 예정 🧺',
    description: '새로운 예쁜 옷과 간식 쇼핑하러 가는 날!',
    category: '여행',
    dateString: '2026-08-05',
    imageUrl: PET_PARK_IMAGE,
  },
];

let mockMissions: Record<string, MissionItem[]> = {
  '2026-08-04': [
    { id: 'm-1', title: '하루 30분 산책 성공하기', completed: true },
    { id: 'm-2', title: '양치질 1분 깔끔하게 하기', completed: true },
    { id: 'm-3', title: '추억 사진 1장 기록하기', completed: true },
    { id: 'm-4', title: '빗질하고 발바닥 케어하기', completed: false },
  ],
  '2026-08-03': [
    { id: 'm-5', title: '하루 30분 산책 성공하기', completed: true },
    { id: 'm-6', title: '양치질 1분 깔끔하게 하기', completed: true },
    { id: 'm-7', title: '추억 사진 1장 기록하기', completed: false },
  ],
  '2026-08-05': [
    { id: 'm-8', title: '하루 30분 산책 성공하기', completed: false },
    { id: 'm-9', title: '양치질 1분 깔끔하게 하기', completed: false },
    { id: 'm-10', title: '추억 사진 1장 기록하기', completed: false },
  ],
};

export const recordService = {
  async getActivitiesByDate(dateString: string): Promise<TimelineActivity[]> {
    return initialActivities.filter((item) => item.dateString === dateString);
  },

  async addActivity(newActivity: Omit<TimelineActivity, 'id'>): Promise<TimelineActivity> {
    const activity: TimelineActivity = {
      ...newActivity,
      id: `act-${Date.now()}`,
    };
    initialActivities.unshift(activity);
    return activity;
  },

  async getMissionsByDate(dateString: string): Promise<MissionItem[]> {
    if (!mockMissions[dateString]) {
      mockMissions[dateString] = [
        { id: `m-${dateString}-1`, title: '하루 30분 산책 성공하기', completed: false },
        { id: `m-${dateString}-2`, title: '양치질 1분 깔끔하게 하기', completed: false },
        { id: `m-${dateString}-3`, title: '추억 사진 1장 기록하기', completed: false },
      ];
    }
    return mockMissions[dateString];
  },

  async toggleMission(dateString: string, missionId: string): Promise<MissionItem[]> {
    const list = mockMissions[dateString] || [];
    const item = list.find((m) => m.id === missionId);
    if (item) {
      item.completed = !item.completed;
    }
    return [...list];
  },

  async getDailySummary(dateString: string): Promise<DailySummary> {
    const activities = await this.getActivitiesByDate(dateString);
    const missions = await this.getMissionsByDate(dateString);
    const missionCompleted = missions.filter((m) => m.completed).length;

    return {
      dateString,
      recordCount: activities.length,
      missionTotal: missions.length,
      missionCompleted,
    };
  },
};
