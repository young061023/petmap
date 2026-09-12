// 한국관광공사 반려동물 동반여행 정보(KorPetTourService2) 연동.
// https://www.data.go.kr 공공데이터포털에서 발급받은 서비스키를
// EXPO_PUBLIC_PET_TOUR_API_KEY로 설정해야 동작한다.

export type PetSpot = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  address: string;
  image: string | null;
  tel: string | null;
  contentTypeId: string;
  distance: number | null;
};

const PET_TOUR_API_KEY = process.env.EXPO_PUBLIC_PET_TOUR_API_KEY;
const PET_TOUR_BASE_URL = 'https://apis.data.go.kr/B551011/KorPetTourService2';

type RawPetTourItem = {
  contentid?: string;
  contenttypeid?: string;
  title?: string;
  addr1?: string;
  addr2?: string;
  mapx?: string;
  mapy?: string;
  firstimage?: string;
  tel?: string;
  dist?: string;
};

// GPS 좌표 주변의 반려동물 동반 가능 관광지를 조회한다.
export async function fetchNearbyPetSpots(
  latitude: number,
  longitude: number,
  { radius = 5000, numOfRows = 50 }: { radius?: number; numOfRows?: number } = {},
): Promise<PetSpot[]> {
  if (!PET_TOUR_API_KEY) {
    console.warn('반려동물 동반여행 API 키가 없습니다. .env의 EXPO_PUBLIC_PET_TOUR_API_KEY를 설정해 주세요.');
    return [];
  }

  const params = new URLSearchParams({
    serviceKey: PET_TOUR_API_KEY,
    numOfRows: String(numOfRows),
    pageNo: '1',
    MobileOS: 'ETC',
    MobileApp: 'petmap',
    _type: 'json',
    mapX: String(longitude),
    mapY: String(latitude),
    radius: String(radius),
    arrange: 'E', // 거리순 정렬
  });

  const response = await fetch(`${PET_TOUR_BASE_URL}/locationBasedList2?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`반려동물 동반여행 API 요청 실패: ${response.status}`);
  }

  const json = await response.json();
  const header = json?.response?.header;
  if (header?.resultCode !== '0000') {
    throw new Error(`반려동물 동반여행 API 오류: ${header?.resultMsg ?? 'unknown'}`);
  }

  const rawItems = json?.response?.body?.items?.item;
  const items: RawPetTourItem[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return items.reduce<PetSpot[]>((spots, item) => {
    const lat = Number(item.mapy);
    const lng = Number(item.mapx);
    if (!item.contentid || !Number.isFinite(lat) || !Number.isFinite(lng)) return spots;

    spots.push({
      id: item.contentid,
      title: item.title ?? '',
      latitude: lat,
      longitude: lng,
      address: [item.addr1, item.addr2].filter(Boolean).join(' '),
      image: item.firstimage || null,
      tel: item.tel || null,
      contentTypeId: item.contenttypeid ?? '',
      distance: item.dist ? Number(item.dist) : null,
    });
    return spots;
  }, []);
}
