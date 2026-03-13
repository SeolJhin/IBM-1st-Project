const API_PREFIX = '/api';
const ABSOLUTE_URL_RE = /^https?:\/\//i;
const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  device: 'device_id',
};

let refreshPromise = null;


export function withApiPrefix(path) {
  if (!path) return API_PREFIX;
  if (ABSOLUTE_URL_RE.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (
    normalizedPath === API_PREFIX ||
    normalizedPath.startsWith(`${API_PREFIX}/`)
  ) {
    return normalizedPath;
  }
  return `${API_PREFIX}${normalizedPath}`;
}

function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.access) || '';
}

function getRefreshContext() {
  return {
    refreshToken: localStorage.getItem(STORAGE_KEYS.refresh) || '',
    deviceId: localStorage.getItem(STORAGE_KEYS.device) || '',
  };
}

function setTokens({ accessToken, refreshToken, deviceId } = {}) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.access, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
  if (deviceId) localStorage.setItem(STORAGE_KEYS.device, deviceId);
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.access);
  localStorage.removeItem(STORAGE_KEYS.refresh);
}

function isAuthPath(path) {
  const text = String(path || '');
  return text.startsWith('/auth/');
}

function buildAuthHeaders(headers, auth) {
  const next = new Headers(headers || {});
  if (auth) {
    const token = getAccessToken();
    if (token) {
      // Always attach latest access token for retry requests too.
      next.set('Authorization', `Bearer ${token}`);
    }
  }
  return next;
}

async function doRefresh() {
  const { refreshToken, deviceId } = getRefreshContext();
  if (!refreshToken || !deviceId) return false;

  const res = await fetch(withApiPrefix('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ refreshToken, deviceId }),
  });

  if (res.status === 204) {
    clearTokens();
    return false;
  }

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  const api =
    payload && typeof payload === 'object' && 'success' in payload
      ? payload
      : null;

  if (!res.ok || (api && api.success === false)) {
    clearTokens();
    return false;
  }

  const data = api ? api.data : payload;
  if (!data || typeof data !== 'object' || !data.accessToken) {
    clearTokens();
    return false;
  }

  setTokens(data);
  return true;
}

export async function refreshAccessTokenOnce() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await doRefresh();
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function fetchWithAuthRetry(
  path,
  init = {},
  { auth = false, retryOnAuthError = true } = {}
) {
  const credentials = init.credentials ?? 'same-origin';

  const firstRes = await fetch(withApiPrefix(path), {
    ...init,
    credentials,
    headers: buildAuthHeaders(init.headers, auth),
  });

  const canRetry =
    retryOnAuthError && auth && firstRes.status === 401 && !isAuthPath(path);

  if (!canRetry) return firstRes;

  const refreshed = await refreshAccessTokenOnce();
  if (!refreshed) return firstRes;

  return fetch(withApiPrefix(path), {
    ...init,
    credentials,
    headers: buildAuthHeaders(init.headers, auth),
  });
}
