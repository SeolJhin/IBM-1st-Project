// features/property/api/propertyApi.js
// UniPlace 諛깆뿏??BuildingController, RoomController, SpaceController) 湲곗?
// - 紐⑤뱺 ?묐떟? ApiResponse<T> ?뺥깭: { success, data, errorCode, message }
// - ?섏씠吏 ?묐떟? PageResponse<T> ?뺥깭: { content, page, size, totalElements, totalPages }
// - 鍮뚮뵫/媛앹떎/怨듭슜怨듦컙 議고쉶???몄쬆 遺덊븘??(怨듦컻 API)
//
// [?붾뱶?ъ씤??紐⑸줉]
// GET /buildings                        ??鍮뚮뵫 紐⑸줉 (?섏씠吏?
// GET /buildings/{buildingId}           ??鍮뚮뵫 ?곸꽭
// GET /buildings/{buildingId}/rooms     ??鍮뚮뵫蹂?媛앹떎 紐⑸줉 (?섏씠吏?
// GET /buildings/{buildingId}/spaces    ??鍮뚮뵫蹂?怨듭슜怨듦컙 紐⑸줉 (?섏씠吏?
// GET /rooms                            ??媛앹떎 ?꾩껜 紐⑸줉 (?섏씠吏?+ ?꾪꽣)
// GET /rooms/{roomId}                   ??媛앹떎 ?곸꽭
// GET /spaces                           ??怨듭슜怨듦컙 ?꾩껜 紐⑸줉 (?섏씠吏?+ ?꾪꽣)
// GET /spaces/{spaceId}                 ??怨듭슜怨듦컙 ?곸꽭

import { fetchWithAuthRetry } from '../../../app/http/apiBase'; // ?꾩슂?섎㈃ Vite env濡?援먯껜: import.meta.env.VITE_API_BASE_URL

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

async function request(
  path,
  { method = 'GET', body, headers = {}, auth = false } = {}
) {
  const res = await fetchWithAuthRetry(path, {
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
  }, { auth });

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
      (typeof payload === 'string' ? payload : '?붿껌???ㅽ뙣?덉뒿?덈떎.');
    const error = new Error(message);
    error.status = res.status;
    error.errorCode = api?.errorCode;
    error.data = payload;
    throw error;
  }

  // ApiResponse硫?data留?諛섑솚
  return api ? api.data : payload;
}

// ??? 荑쇰━ ?뚮씪誘명꽣 鍮뚮뜑 ??????????????????????????????????????????????????????
// ?? buildQuery({ page: 1, size: 10, sort: 'buildingId', direct: 'DESC' })
//  ??"?page=1&size=10&sort=buildingId&direct=DESC"
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
   * 鍮뚮뵫 紐⑸줉 議고쉶 (?섏씠吏?
   * @param {{ page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' }} params
   * @returns {Promise<PageResponse<BuildingSummaryResponse>>}
   *
   * BuildingSummaryResponse ?꾨뱶:
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
   * 鍮뚮뵫 ?곸꽭 議고쉶
   * @param {number} buildingId
   * @returns {Promise<BuildingDetailResponse>}
   *
   * BuildingDetailResponse ?꾨뱶:
   *   buildingId, buildingNm, buildingAddr, buildingDesc,
   *   landCategory, buildSize, buildingUsage, existElv, parkingCapacity,
   *   files: [{ fileId, fileUrl, ... }]
   */
  getBuildingDetail: (buildingId) => request(`/buildings/${buildingId}`),

  /**
   * 鍮뚮뵫蹂?媛앹떎 紐⑸줉 議고쉶 (?섏씠吏?
   * @param {number} buildingId
   * @param {{ page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' }} params
   * @returns {Promise<PageResponse<RoomSummaryResponse>>}
   *
   * RoomSummaryResponse ?꾨뱶:
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
   * 鍮뚮뵫蹂?怨듭슜怨듦컙 紐⑸줉 議고쉶 (?섏씠吏?
   * @param {number} buildingId
   * @param {{ page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' }} params
   * @returns {Promise<PageResponse<SpaceResponse>>}
   *
   * SpaceResponse ?꾨뱶:
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
   * 媛앹떎 ?꾩껜 紐⑸줉 議고쉶 (?섏씠吏?+ 寃???꾪꽣)
   * @param {{
   *   buildingId?: number,        ??鍮뚮뵫 ID ?꾪꽣
   *   buildingNm?: string,        ??鍮뚮뵫紐?遺遺꾧???   *   buildingAddr?: string,      ??二쇱냼 遺遺꾧???   *   minParkingCapacity?: number,
   *   roomNo?: number,
   *   floor?: number,
   *   minRoomSize?: number,       maxRoomSize?: number,
   *   minDeposit?: number,        maxDeposit?: number,
   *   minRentPrice?: number,      maxRentPrice?: number,
   *   minManageFee?: number,      maxManageFee?: number,
   *   rentType?: string,          ??RentType enum
   *   roomSt?: string,            ??RoomStatus enum
   *   sunDirection?: string,      ??SunDirection enum
   *   minRoomCapacity?: number,   maxRoomCapacity?: number,
   *   minRentMin?: number,        maxRentMin?: number,
   *   roomOptions?: string,       ???듭뀡 遺遺꾧???   *   page?: number,
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
   * 媛앹떎 ?곸꽭 議고쉶
   * @param {number} roomId
   * @returns {Promise<RoomDetailResponse>}
   *
   * RoomDetailResponse ?꾨뱶:
   *   roomId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   roomNo, floor, roomSize, deposit, rentPrice, manageFee,
   *   rentType, roomSt, roomOptions, roomCapacity, rentMin, sunDirection, roomDesc,
   *   files: [{ fileId, fileUrl, ... }]
   */
  getRoomDetail: (roomId) => request(`/rooms/${roomId}`),

  // ===== SpaceController (/spaces) =====

  /**
   * 怨듭슜怨듦컙 ?꾩껜 紐⑸줉 議고쉶 (?섏씠吏?+ 寃???꾪꽣)
   * @param {{
   *   buildingId?: number,         ??鍮뚮뵫 ID ?꾪꽣
   *   buildingNm?: string,         ??鍮뚮뵫紐?遺遺꾧???   *   buildingAddr?: string,       ??二쇱냼 遺遺꾧???   *   minParkingCapacity?: number,
   *   spaceNm?: string,            ??怨듦컙紐?遺遺꾧???   *   spaceFloor?: number,         ??痢듭닔 ?뺥솗??   *   minSpaceCapacity?: number,   maxSpaceCapacity?: number,
   *   spaceOptions?: string,       ???듭뀡 遺遺꾧???   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   direct?: 'ASC'|'DESC'
   * }} params
   * @returns {Promise<PageResponse<SpaceResponse>>}
   *
   * SpaceResponse ?꾨뱶:
   *   spaceId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   spaceNm, spaceFloor, spaceCapacity, spaceOptions, thumbnailFileId, thumbnailUrl
   */
  getSpacesAll: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'spaceId', direct: 'DESC' };
    const query = buildQuery({ ...defaults, ...params });
    return request(`/spaces${query}`);
  },

  /**
   * 怨듭슜怨듦컙 ?곸꽭 議고쉶
   * @param {number} spaceId
   * @returns {Promise<SpaceDetailResponse>}
   *
   * SpaceDetailResponse ?꾨뱶:
   *   spaceId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
   *   spaceNm, spaceFloor, spaceCapacity, spaceOptions, spaceDesc,
   *   files: [{ fileId, fileUrl, ... }]
   */
  getSpaceDetail: (spaceId) => request(`/spaces/${spaceId}`),
};

