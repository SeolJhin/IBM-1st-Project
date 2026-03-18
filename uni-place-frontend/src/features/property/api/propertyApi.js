// features/property/api/propertyApi.js
// UniPlace 서버 (BuildingController, RoomController, SpaceController) API
// - 모든 응답은 ApiResponse<T> 형태: { success, data, errorCode, message }
// - 페이지 응답은 PageResponse<T> 형태: { content, page, size, totalElements, totalPages }
// - 빌딩/객실/공용공간 조회용 엔드포인트 모음 (공개 API)
//
// [지원하는 엔드포인트 목록]
// GET /buildings                        → 빌딩 목록 (페이지)
// GET /buildings/{buildingId}           → 빌딩 상세
// GET /buildings/{buildingId}/rooms     → 빌딩별 객실 목록 (페이지)
// GET /buildings/{buildingId}/spaces    → 빌딩별 공용공간 목록 (페이지)
// GET /rooms                            → 객실 전체 목록 (페이지 + 필터)
// GET /rooms/{roomId}                   → 객실 상세
// GET /rooms/recommendations            → ✅ AI 추천 Top3 (신규)
// GET /spaces                           → 공용공간 전체 목록 (페이지 + 필터)
// GET /spaces/{spaceId}                 → 공용공간 상세

import { fetchWithAuthRetry } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

async function request(
  path,
  { method = 'GET', body, headers = {}, auth = false } = {}
) {
  const res = await fetchWithAuthRetry(
    path,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && getAccessToken()
          ? { Authorization: `Bearer ${getAccessToken()}` }
          : {}),
        ...headers,
      },
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    },
    { auth }
  );

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  const api =
    payload && typeof payload === 'object' && 'success' in payload
      ? payload
      : null;

  if (!res.ok || (api && api.success === false)) {
    const message =
      (api && api.message) ||
      (payload && payload.message) ||
      (typeof payload === 'string' ? payload : '요청에 실패했습니다.');
    const error = new Error(message);
    error.status = res.status;
    error.errorCode = api?.errorCode;
    error.data = payload;
    throw error;
  }

  return api ? api.data : payload;
}

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

export const propertyApi = {
  // ===== BuildingController (/buildings) =====

  /**
   * 빌딩 목록 조회 (페이지)
   */
  getBuildings: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'buildingId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/buildings${query}`);
  },

  /**
   * 빌딩 상세 조회
   */
  getBuildingDetail: (buildingId) => request(`/buildings/${buildingId}`),

  /**
   * 빌딩별 객실 목록 조회 (페이지)
   */
  getRooms: (buildingId, params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'roomId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/buildings/${buildingId}/rooms${query}`);
  },

  /**
   * 빌딩별 공용공간 목록 조회 (페이지)
   */
  getSpaces: (buildingId, params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'spaceId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/buildings/${buildingId}/spaces${query}`);
  },

  // ===== RoomController (/rooms) =====

  /**
   * 객실 전체 목록 조회 (페이지 + 다양한 필터)
   */
  getRoomsAll: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'roomId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/rooms${query}`);
  },

  /**
   * 객실 상세 조회
   */
  getRoomDetail: (roomId) => request(`/rooms/${roomId}`),

  // ✅ 신규: AI 추천 Top3 조회
  /**
   * AI 방 추천 Top3 조회
   * @returns {Promise<RoomRecommendationResponse[]>}
   *
   * RoomRecommendationResponse 필드:
   *   rankNo, roomId, buildingNm, buildingAddr,
   *   roomType, rentPrice, floor,
   *   aiReason, avgRating, reviewCount, contractCount,
   *   thumbnailUrl, generatedAt
   */
  getRecommendations: (params = {}) => {
    const query = buildQuery(params);
    return request(`/rooms/recommendations${query}`);
  },

  // ===== SpaceController (/spaces) =====

  /**
   * 공용공간 전체 목록 조회 (페이지 + 다양한 필터)
   */
  getSpacesAll: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'spaceId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/spaces${query}`);
  },

  /**
   * 공용공간 상세 조회
   */
  getSpaceDetail: (spaceId) => request(`/spaces/${spaceId}`),
};
