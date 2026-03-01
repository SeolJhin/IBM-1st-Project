// features/contract/api/contractApi.js
import { fetchWithAuthRetry } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const res = await fetchWithAuthRetry(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  }, { auth });

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  const api =
    payload && typeof payload === 'object' && 'success' in payload
      ? payload
      : null;

  if (!res.ok || (api && api.success === false)) {
    const message =
      api?.message ||
      (typeof payload === 'string' ? payload : '?붿껌???ㅽ뙣?덉뒿?덈떎.');
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return api ? api.data : payload;
}

async function multipartRequest(path, formData) {
  const res = await fetch(withApiPrefix(path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      // Content-Type은 브라우저가 자동으로 multipart/form-data + boundary 설정
    },
    credentials: 'same-origin',
    body: formData,
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  const api =
    payload && typeof payload === 'object' && 'success' in payload
      ? payload
      : null;

  if (!res.ok || (api && api.success === false)) {
    const message =
      api?.message ||
      (typeof payload === 'string' ? payload : '요청에 실패했습니다.');
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return api ? api.data : payload;
}

export const contractApi = {
  /** GET /contracts/me ????怨꾩빟 紐⑸줉 */
  myContracts: () => request('/contracts/me'),

  /** POST /contracts — 계약 신청 (multipart/form-data) */
  createContract: ({ signFile, ...fields }) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v));
    });
    if (signFile) formData.append('signFile', signFile);
    return multipartRequest('/contracts', formData);
  },
};

