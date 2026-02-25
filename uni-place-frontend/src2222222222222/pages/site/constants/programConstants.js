/* ─────────────────────────────────────────
   공용 프로그램 상수
   모든 program 페이지에서 import해서 사용
   추후 백엔드 API로 교체
───────────────────────────────────────── */

export const SERVICE_CATEGORIES = [
  { label: "체험존 안내", path: "/program/experience" },
  { label: "세션 · 강연", path: "/program/session" },
  { label: "프로그램 안내", path: "/program/schedule" },
  { label: "콘테스트 안내", path: "/program/contest" },
  { label: "부스 안내", path: "/program/booth" },
];

export const SUBTITLE_MAP = {
  "/program/experience": "행사장에서 운영 중인 체험 부스를 한눈에 살펴보세요",
  "/program/session": "전문가 세션과 강연 일정을 미리 살펴보세요",
  "/program/schedule": "운영 중인 프로그램 일정과 내용을 살펴보세요",
  "/program/contest": "인기 콘테스트에 참여하고 투표해보세요",
  "/program/booth": "부스 운영 현황을 한눈에 살펴보세요",
};

/* ─────────────────────────────────────────
   샘플 행사 데이터 (추후 백엔드 API로 교체)
   ※ thumbnail 필드 필수!
───────────────────────────────────────── */
export const SAMPLE_EVENTS = [
  {
    id: "pet-festa-2025",
    name: "2025 펫 페스타 서울",
    description: "반려동물과 함께하는 최대 규모 반려인 축제",
    date: "2025.03.15 ~ 03.17",
    location: "서울 COEX 전시관",
    organizer: "한국반려동물협회",
    status: "live",
    participants: 2400,
    thumbnail:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=340&fit=crop",
    color: "#1a4fd6",
  },
  {
    id: "dog-show-busan",
    name: "부산 도그쇼 2025",
    description: "전국 반려견 대회와 전시, 체험 프로그램",
    date: "2025.04.05 ~ 04.06",
    location: "부산 BEXCO 제1전시관",
    organizer: "부산시 동물보호센터",
    status: "upcoming",
    participants: 0,
    thumbnail:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=340&fit=crop",
    color: "#8b5cf6",
  },
  {
    id: "cat-world-expo",
    name: "캣 월드 엑스포",
    description: "고양이 전문 박람회 및 입양 행사",
    date: "2025.05.10 ~ 05.12",
    location: "일산 KINTEX 제2전시관",
    organizer: "캣 러버스 코리아",
    status: "upcoming",
    participants: 0,
    thumbnail:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=340&fit=crop",
    color: "#ec4899",
  },
  {
    id: "pet-health-fair",
    name: "반려동물 건강박람회",
    description: "수의사 상담, 건강검진, 영양 세미나 등",
    date: "2025.02.01 ~ 02.02",
    location: "서울 양재 aT센터",
    organizer: "대한수의사회",
    status: "ended",
    participants: 1850,
    thumbnail:
      "https://images.unsplash.com/photo-1450778869180-cfe0f6b5ad95?w=600&h=340&fit=crop",
    color: "#10b981",
  },
];
