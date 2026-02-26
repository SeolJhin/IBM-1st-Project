// features/property/api/propertyApi.js
// UniPlace 백엔드(BuildingController, RoomController, SpaceController) 기준
// - 모든 응답은 ApiResponse<T> 형태: { success, data, errorCode, message }
// - 페이지 응답은 PageResponse<T> 형태: { content, page, size, totalElements, totalPages }
// - 빌딩/객실/공용공간 조회는 인증 불필요 (공개 API)
//
// [엔드포인트 목록]
// GET /buildings                        → 빌딩 목록 (페이징)
// GET /buildings/{buildingId}           → 빌딩 상세
// GET /buildings/{buildingId}/rooms     → 빌딩별 객실 목록 (페이징)
// GET /buildings/{buildingId}/spaces    → 빌딩별 공용공간 목록 (페이징)
// GET /rooms                            → 객실 전체 목록 (페이징 + 필터)
// GET /rooms/{roomId}                   → 객실 상세
// GET /spaces                           → 공용공간 전체 목록 (페이징 + 필터)
// GET /spaces/{spaceId}                 → 공용공간 상세

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
   * BuildingSummaryResponse 필드:
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
   * BuildingDetailResponse 필드:
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
   * RoomSummaryResponse 필드:
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
   * SpaceResponse 필드:
   *   spaceId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   spaceNm, spaceFloor, spaceCapacity, spaceOptions, thumbnailFileId, thumbnailUrl
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
   *   buildingId?: number,        — 빌딩 ID 필터
   *   buildingNm?: string,        — 빌딩명 부분검색
   *   buildingAddr?: string,      — 주소 부분검색
   *   minParkingCapacity?: number,
   *   roomNo?: number,
   *   floor?: number,
   *   minRoomSize?: number,       maxRoomSize?: number,
   *   minDeposit?: number,        maxDeposit?: number,
   *   minRentPrice?: number,      maxRentPrice?: number,
   *   minManageFee?: number,      maxManageFee?: number,
   *   rentType?: string,          — RentType enum
   *   roomSt?: string,            — RoomStatus enum
   *   sunDirection?: string,      — SunDirection enum
   *   minRoomCapacity?: number,   maxRoomCapacity?: number,
   *   minRentMin?: number,        maxRentMin?: number,
   *   roomOptions?: string,       — 옵션 부분검색
   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   direct?: 'ASC'|'DESC'
   * }} params
   * @returns {Promise<PageResponse<RoomSummaryResponse>>}
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
   * RoomDetailResponse 필드:
   *   roomId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   roomNo, floor, roomSize, deposit, rentPrice, manageFee,
   *   rentType, roomSt, roomOptions, roomCapacity, rentMin, sunDirection, roomDesc,
   *   files: [{ fileId, fileUrl, ... }]
   */
  getRoomDetail: (roomId) => request(`/rooms/${roomId}`),

  // ===== SpaceController (/spaces) =====

  /**
   * 공용공간 전체 목록 조회 (페이징 + 검색 필터)
   * @param {{
   *   buildingId?: number,         — 빌딩 ID 필터
   *   buildingNm?: string,         — 빌딩명 부분검색
   *   buildingAddr?: string,       — 주소 부분검색
   *   minParkingCapacity?: number,
   *   spaceNm?: string,            — 공간명 부분검색
   *   spaceFloor?: number,         — 층수 정확히
   *   minSpaceCapacity?: number,   maxSpaceCapacity?: number,
   *   spaceOptions?: string,       — 옵션 부분검색
   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   direct?: 'ASC'|'DESC'
   * }} params
   * @returns {Promise<PageResponse<SpaceResponse>>}
   *
   * SpaceResponse 필드:
   *   spaceId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   spaceNm, spaceFloor, spaceCapacity, spaceOptions, thumbnailFileId, thumbnailUrl
   */
  getSpacesAll: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'spaceId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/spaces${query}`);
  },

  /**
   * 공용공간 상세 조회
   * @param {number} spaceId
   * @returns {Promise<SpaceDetailResponse>}
   *
   * SpaceDetailResponse 필드:
   *   spaceId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   spaceNm, spaceFloor, spaceCapacity, spaceOptions, spaceDesc,
   *   files: [{ fileId, fileUrl, ... }]
   */
  getSpaceDetail: (spaceId) => request(`/spaces/${spaceId}`),
};
