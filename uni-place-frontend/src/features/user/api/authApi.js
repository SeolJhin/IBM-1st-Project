// user/api/authApi.js
// UniPlace 백엔드(AuthController, ApiResponse) 기준
// - 모든 응답은 ApiResponse<T> 형태: { success, data, errorCode, message }
// - 인증이 필요한 요청은 Authorization: Bearer <accessToken> 헤더 사용
// - 로그인/리프레시/로그아웃에는 deviceId + refreshToken 관리 필요

import { withApiPrefix } from '../../../app/http/apiBase'; // 필요하면 Vite env로 교체: import.meta.env.VITE_API_BASE_URL

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
    // UniPlace는 JWT stateless라 cookie 불필요. 다만 프록시/배포환경에 따라 필요하면 include로 바꿔도 됨.
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

export const authApi = {
  // ===== AuthController (/auth) =====
  signup: (data) =>
    request('/auth/signup', {
      method: 'POST',
      body: data,
    }),

  login: ({ userEmail, userPwd, deviceId }) =>
    request('/auth/login', {
      method: 'POST',
      body: { userEmail, userPwd, deviceId },
    }),

  refresh: ({ refreshToken, deviceId }) =>
    request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken, deviceId },
    }),

  logout: ({ refreshToken, deviceId }) =>
    request('/auth/logout', {
      method: 'POST',
      body: { refreshToken, deviceId },
    }),

  kakaoComplete: ({ signupToken, userNm, userBirth, userTel }) =>
    request('/auth/oauth2/kakao/complete', {
      method: 'POST',
      body: { signupToken, userNm, userBirth, userTel },
    }),

  googleComplete: ({ signupToken, userNm, userBirth, userTel }) =>
    request('/auth/oauth2/google/complete', {
      method: 'POST',
      body: { signupToken, userNm, userBirth, userTel },
    }),

  // ===== UserController (/users) =====
  me: () => request('/users/me', { auth: true }),

  updateMe: (patch) =>
    request('/users/me', { method: 'PATCH', body: patch, auth: true }),

  deleteMe: () => request('/users/me', { method: 'DELETE', auth: true }),
};
