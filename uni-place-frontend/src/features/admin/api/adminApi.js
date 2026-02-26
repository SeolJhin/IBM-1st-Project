// src/features/admin/api/adminApi.js

const DEFAULT_BASE_URL = '';

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

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => null);

  if (!res.ok || (payload && payload.success === false)) {
    throw new Error(payload?.message || '요청 실패');
  }

  return payload?.data ?? payload;
}

export const adminApi = {
  dashboard: () => request('/admin/dashboard', { auth: true }),
};
