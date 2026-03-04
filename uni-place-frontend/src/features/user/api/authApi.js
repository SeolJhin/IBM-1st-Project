import { fetchWithAuthRetry } from '../../../app/http/apiBase';
import { toKoreanMessage } from '../../../app/http/errorMapper';

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
    const rawMessage =
      (api && api.message) ||
      (payload && payload.message) ||
      (typeof payload === 'string' ? payload : null);
    const error = new Error(rawMessage || '요청에 실패했습니다.');
    error.status = res.status;
    error.errorCode = api?.errorCode;
    error.data = payload;
    // 한글 메시지로 변환하여 별도 필드에 저장 (UI에서 사용)
    error.koreanMessage = toKoreanMessage(error);
    throw error;
  }

  return api ? api.data : payload;
}

export const authApi = {
  signup: (data) =>
    request('/auth/signup', {
      method: 'POST',
      body: data,
    }),

  checkNickname: (nickname) =>
    request(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`),

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
      auth: true,
    }),

  logoutAll: () =>
    request('/auth/logout-all', {
      method: 'POST',
      auth: true,
    }),

  kakaoComplete: ({
    signupToken,
    userNm,
    userBirth,
    userTel,
    userNickname,
    userPwd,
  }) =>
    request('/auth/oauth2/kakao/complete', {
      method: 'POST',
      body: { signupToken, userNm, userBirth, userTel, userNickname, userPwd },
    }),

  googleComplete: ({
    signupToken,
    userNm,
    userBirth,
    userTel,
    userNickname,
    userPwd,
  }) =>
    request('/auth/oauth2/google/complete', {
      method: 'POST',
      body: { signupToken, userNm, userBirth, userTel, userNickname, userPwd },
    }),

  me: () => request('/users/me', { auth: true }),

  updateMe: (patch) =>
    request('/users/me', { method: 'PATCH', body: patch, auth: true }),

  deleteMe: () => request('/users/me', { method: 'DELETE', auth: true }),

  // ── 아이디 찾기
  findEmail: ({ userNm, userTel }) =>
    request('/auth/find-email', {
      method: 'POST',
      body: { userNm, userTel },
    }),

  // ── 비밀번호 재설정 요청 (메일 발송)
  requestPasswordReset: ({ userEmail }) =>
    request('/auth/reset-password/request', {
      method: 'POST',
      body: { userEmail },
    }),

  // ── 토큰 유효성 사전 확인
  verifyPasswordResetToken: (token) =>
    request(`/auth/reset-password/verify?token=${encodeURIComponent(token)}`),

  // ── 비밀번호 재설정 확정
  confirmPasswordReset: ({ token, newPassword }) =>
    request('/auth/reset-password/confirm', {
      method: 'POST',
      body: { token, newPassword },
    }),
};
