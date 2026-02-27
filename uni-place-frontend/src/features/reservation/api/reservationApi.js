import { withApiPrefix } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

async function request(
  path,
  { method = 'GET', body, headers = {}, auth = false } = {}
) {
  const res = await fetch(withApiPrefix(path), {
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

export const reservationApi = {
  // ===== SpaceReservationController =====
  reservableSpaces: ({
    buildingId,
    date,
    page = 1,
    size = 10,
    sort = 'spaceId',
    direct = 'DESC',
  }) => {
    const q = buildQuery({ buildingId, date, page, size, sort, direct });
    // ✅ 수정: tenant/로그인 사용자만 접근하도록 막혀있을 수 있으니 토큰 포함
    return request(`/space-reservations/spaces${q}`, { auth: true });
  },

  createSpaceReservation: (body) =>
    request(`/space-reservations`, { method: 'POST', body, auth: true }),

  mySpaceReservations: ({
    page = 1,
    size = 10,
    sort = 'reservationId',
    direct = 'DESC',
  } = {}) => {
    const q = buildQuery({ page, size, sort, direct });
    return request(`/space-reservations/me${q}`, { auth: true });
  },

  cancelSpaceReservation: (reservationId) =>
    request(`/space-reservations/cancel/${reservationId}`, {
      method: 'PUT',
      auth: true,
    }),

  // ===== TourReservationController =====
  reservableRooms: ({
    buildingId,
    buildingNm,
    page = 1,
    size = 10,
    sort = 'roomId',
    direct = 'DESC',
  }) => {
    const q = buildQuery({ buildingId, buildingNm, page, size, sort, direct });
    return request(`/tour-reservations/rooms${q}`); // 공개 API 예상
  },

  reservableTourSlots: ({ buildingId, roomId, date }) => {
    const q = buildQuery({ buildingId, roomId, date });
    return request(`/tour-reservations/slots${q}`);
  },

  createTourReservation: (body) =>
    request(`/tour-reservations`, { method: 'POST', body }),

  lookupTourReservations: (
    body,
    { page = 1, size = 10, sort = 'tourId', direct = 'DESC' } = {}
  ) => {
    const q = buildQuery({ page, size, sort, direct });
    return request(`/tour-reservations/lookup${q}`, { method: 'POST', body });
  },

  cancelTourReservation: (tourId, body) =>
    request(`/tour-reservations/cancel/${tourId}`, { method: 'PUT', body }),
};
