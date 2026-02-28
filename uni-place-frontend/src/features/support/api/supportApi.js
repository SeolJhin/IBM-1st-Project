// src/features/support/api/supportApi.js
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

export const supportApi = {
  // ===== FAQ =====
  getFaqs: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'faqId', direct: 'DESC' };
    return request(`/faqs${buildQuery({ ...defaults, ...params })}`);
  },

  getFaqDetail: (faqId) => request(`/faqs/${faqId}`),

  // ===== Notice =====
  getNotices: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'noticeId', direct: 'DESC' };
    return request(`/notices${buildQuery({ ...defaults, ...params })}`);
  },
  getNoticeDetail: (noticeId) => request(`/notices/${noticeId}`),

  // ===== QnA =====
  getQnas: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'qnaId', direct: 'DESC' };
    return request(`/qna${buildQuery({ ...defaults, ...params })}`, {
      auth: true,
    });
  },
  getQnaDetail: (qnaId) => request(`/qna/${qnaId}`, { auth: true }),
  getQnaReplies: (qnaId) => request(`/qna/${qnaId}/replies`, { auth: true }),
  createQna: (body) => request('/qna', { method: 'POST', body, auth: true }),
  updateQna: (qnaId, body) =>
    request(`/qna/${qnaId}`, { method: 'PUT', body, auth: true }),
  deleteQna: (qnaId) =>
    request(`/qna/${qnaId}`, { method: 'DELETE', auth: true }),

  // ===== Complains =====
  getMyComplains: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'compId', direct: 'DESC' };
    return request(`/complains/me${buildQuery({ ...defaults, ...params })}`, {
      auth: true,
    });
  },
  getComplainDetail: (compId) =>
    request(`/complains/${compId}`, { auth: true }),
  createComplain: (body) =>
    request('/complains', { method: 'POST', body, auth: true }),
  updateComplain: (compId, body) =>
    request(`/complains/${compId}`, { method: 'PUT', body, auth: true }),
  deleteComplain: (compId) =>
    request(`/complains/${compId}`, { method: 'DELETE', auth: true }),
};
