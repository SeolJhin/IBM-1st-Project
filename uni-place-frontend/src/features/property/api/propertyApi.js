// features/property/api/propertyApi.js
// UniPlace 백엔드(BuildingController, RoomController) 기준
// - 모든 응답은 ApiResponse<T> 형태: { success, data, errorCode, message }
// - 페이지 응답은 PageResponse<T> 형태: { content, page, size, totalElements, totalPages }
// - 빌딩/객실 조회는 인증 불필요 (공개 API)
//
// [엔드포인트 목록]
// GET /buildings                        → 빌딩 목록 (페이징)
// GET /buildings/{buildingId}           → 빌딩 상세
// GET /buildings/{buildingId}/rooms     → 빌딩별 객실 목록 (페이징)
// GET /buildings/{buildingId}/spaces    → 빌딩별 공용공간 목록 (페이징)
// GET /rooms/{roomId}                   → 객실 상세 (RoomController 엔드포인트 확인 필요)

const DEFAULT_BASE_URL = ''; // 필요하면 Vite env로 교체: import.meta.env.VITE_API_BASE_URL

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

async function request(
  path,
  { method = 'GET', body, headers = {}, auth = false } = {}
) {
  const res = await fetch(`${DEFAULT_BASE_URL}${path}`, {
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
  });

  // 204 No Content
  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  // ApiResponse unwrap
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

  // ApiResponse면 data만 반환
  return api ? api.data : payload;
}

// ─── 쿼리 파라미터 빌더 ──────────────────────────────────────────────────────
// 예: buildQuery({ page: 1, size: 10, sort: 'buildingId', direct: 'DESC' })
//  → "?page=1&size=10&sort=buildingId&direct=DESC"
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
   * 빌딩 목록 조회 (페이징)
   * @param {{ page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' }} params
   * @returns {Promise<PageResponse<BuildingSummaryResponse>>}
   *
   * BuildingSummaryResponse 실제 필드 (BuildingSummaryResponse.java 기준):
   *   buildingId, buildingNm, buildingAddr, buildingDesc,
   *   landCategory, buildSize, buildingUsage, existElv, parkingCapacity,
   *   thumbFileId, thumbUrl
   */
  getBuildings: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'buildingId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/buildings${query}`);
  },

  /**
   * 빌딩 상세 조회
   * @param {number} buildingId
   * @returns {Promise<BuildingDetailResponse>}
   *
   * BuildingDetailResponse 실제 필드 (BuildingDetailResponse.java 기준):
   *   buildingId, buildingNm, buildingAddr, buildingDesc,
   *   landCategory, buildSize, buildingUsage, existElv, parkingCapacity,
   *   files: [{ fileId, fileUrl, ... }]
   */
  getBuildingDetail: (buildingId) => request(`/buildings/${buildingId}`),

  /**
   * 빌딩별 객실 목록 조회 (페이징)
   * @param {number} buildingId
   * @param {{ page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' }} params
   * @returns {Promise<PageResponse<RoomSummaryResponse>>}
   *
   * RoomSummaryResponse 실제 필드 (RoomSummaryResponse.java 기준):
   *   roomId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   roomNo, floor, roomSize, deposit, rentPrice, manageFee,
   *   rentType, roomSt, roomCapacity, rentMin, sunDirection,
   *   thumbnailFileId, thumbnailUrl
   */
  getRooms: (buildingId, params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'roomId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/buildings/${buildingId}/rooms${query}`);
  },

  /**
   * 빌딩별 공용공간 목록 조회 (페이징)
   * @param {number} buildingId
   * @param {{ page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' }} params
   * @returns {Promise<PageResponse<SpaceResponse>>}
   *
   * SpaceResponse 실제 필드 (SpaceResponse.java 확인 필요):
   *   spaceId, spaceName, spaceType, spaceDesc,
   *   spaceCapacity, spaceOpenTime, spaceCloseTime, files[]
   */
  getSpaces: (buildingId, params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'spaceId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/buildings/${buildingId}/spaces${query}`);
  },

  // ===== RoomController (/rooms) =====

  /**
   * 객실 전체 목록 조회 (페이징 + 검색 필터)
   * @param {{
   *   buildingId?: number,   — 특정 빌딩으로 필터 (선택)
   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   direct?: 'ASC'|'DESC'
   * }} params
   * @returns {Promise<PageResponse<RoomSummaryResponse>>}
   *
   * ⚠️ RoomSearchRequest.java 필드를 확인 후 필터 파라미터 추가 가능
   */
  getRoomsAll: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'roomId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/rooms${query}`);
  },

  /**
   * 객실 상세 조회
   * @param {number} roomId
   * @returns {Promise<RoomDetailResponse>}
   *
   * RoomDetailResponse 실제 필드 (RoomDetailResponse.java 기준):
   *   roomId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   roomNo, floor, roomSize, deposit, rentPrice, manageFee,
   *   rentType, roomSt, roomOptions, roomCapacity, rentMin, sunDirection, roomDesc,
   *   files: [{ fileId, fileUrl, ... }]
   */
  getRoomDetail: (roomId) => request(`/rooms/${roomId}`),
};
