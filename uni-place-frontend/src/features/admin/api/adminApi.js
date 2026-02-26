// src/features/admin/api/adminApi.js

const DEFAULT_BASE_URL = '';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
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

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => null);

  if (!res.ok || (payload && payload.success === false)) {
    throw new Error(payload?.message || '요청 실패');
  }

  return payload?.data ?? payload;
}

export const adminApi = {
  // ===== 대시보드 =====
  dashboard: () => request('/admin/dashboard', { auth: true }),

  // ===== 투어(방문) 예약 관리 =====
  // GET /admin/tour-reservations?page=1&size=10&sort=tourId&direct=DESC
  tourReservations: ({
    page = 1,
    size = 10,
    sort = 'tourId',
    direct = 'DESC',
  } = {}) => {
    const q = buildQuery({ page, size, sort, direct });
    return request(`/admin/tour-reservations${q}`, { auth: true });
  },

  // PUT /admin/tour-reservations/status/{tourId}?status=confirmed
  changeTourStatus: (tourId, status) =>
    request(`/admin/tour-reservations/status/${tourId}?status=${status}`, {
      method: 'PUT',
      auth: true,
    }),

  // ===== 공용공간 예약 관리 =====
  // GET /admin/space-reservations?buildingId=&spaceId=&userId=&date=&page=&size=
  spaceReservations: ({
    buildingId,
    spaceId,
    userId,
    date,
    page = 1,
    size = 10,
    sort = 'reservationId',
    direct = 'DESC',
  } = {}) => {
    const q = buildQuery({
      buildingId,
      spaceId,
      userId,
      date,
      page,
      size,
      sort,
      direct,
    });
    return request(`/admin/space-reservations${q}`, { auth: true });
  },

  // GET /admin/space-reservations/{reservationId}
  spaceReservationDetail: (reservationId) =>
    request(`/admin/space-reservations/${reservationId}`, { auth: true }),

  // PUT /admin/space-reservations/{reservationId}/confirm
  confirmSpaceReservation: (reservationId) =>
    request(`/admin/space-reservations/${reservationId}/confirm`, {
      method: 'PUT',
      auth: true,
    }),

  // PUT /admin/space-reservations/{reservationId}/end
  endSpaceReservation: (reservationId) =>
    request(`/admin/space-reservations/${reservationId}/end`, {
      method: 'PUT',
      auth: true,
    }),

  // PUT /admin/space-reservations/{reservationId}/cancel
  cancelSpaceReservation: (reservationId, reason) =>
    request(`/admin/space-reservations/${reservationId}/cancel`, {
      method: 'PUT',
      auth: true,
      body: reason ? { cancelReason: reason } : undefined,
    }),
};
