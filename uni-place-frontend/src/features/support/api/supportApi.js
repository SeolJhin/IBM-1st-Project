// src/features/support/api/supportApi.js
import { fetchWithAuthRetry } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

function normalizeSupportCode(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'SUP_GENERAL';

  const upper = raw.toUpperCase();
  if (upper === 'ALL') return 'ALL';
  if (upper === 'SUP_GENERAL' || upper === 'GENERAL') return 'SUP_GENERAL';
  if (upper === 'SUP_BILLING' || upper === 'BILLING') return 'SUP_BILLING';

  if (upper.startsWith('QNA_') || upper.startsWith('COMP_')) {
    if (upper.includes('PAY') || upper.includes('BILL')) return 'SUP_BILLING';
    return 'SUP_GENERAL';
  }

  return upper;
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
      (typeof payload === 'string' ? payload : '?붿껌???ㅽ뙣?덉뒿?덈떎.');
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
  createFaq: (body) =>
    request('/faqs', {
      method: 'POST',
      body: {
        ...body,
        code: normalizeSupportCode(body?.code),
      },
      auth: true,
    }),

  // ===== Notice =====
  getNotices: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'noticeId', direct: 'DESC' };
    return request(`/notices${buildQuery({ ...defaults, ...params })}`);
  },
  getNoticeDetail: (noticeId) => request(`/notices/${noticeId}`),
  createNotice: (body) =>
    request('/notices', {
      method: 'POST',
      body: {
        ...body,
        code: normalizeSupportCode(body?.code),
        importance: body?.importance ?? 'N',
        noticeSt: body?.noticeSt ?? 'notice',
      },
      auth: true,
    }),

  // ===== QnA =====
  getQnas: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'qnaId', direct: 'DESC' };
    const merged = { ...defaults, ...params };
    if (merged.code) {
      const normalized = normalizeSupportCode(merged.code);
      merged.code = normalized === 'ALL' ? '' : normalized;
    }
    return request(`/qna${buildQuery(merged)}`, {
      auth: true,
    });
  },
  getQnaDetail: (qnaId) => request(`/qna/${qnaId}`, { auth: true }),
  getQnaReplies: (qnaId) => request(`/qna/${qnaId}/replies`, { auth: true }),
  createQna: (body) =>
    request('/qna', {
      method: 'POST',
      body: { ...body, code: normalizeSupportCode(body?.code) },
      auth: true,
    }),
  createQnaAnswer: (qnaId, body) =>
    request(`/qna/${qnaId}/answer`, {
      method: 'POST',
      body,
      auth: true,
    }),
  updateQnaAnswer: (qnaId, body) =>
    request(`/qna/${qnaId}/answer`, {
      method: 'PUT',
      body,
      auth: true,
    }),
  updateQna: (qnaId, body) =>
    request(`/qna/${qnaId}`, { method: 'PUT', body, auth: true }),
  deleteQna: (qnaId) =>
    request(`/qna/${qnaId}`, { method: 'DELETE', auth: true }),

  // ===== Complains =====
  getMyComplains: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'compId', direct: 'DESC' };
    const merged = { ...defaults, ...params };
    if (merged.code) {
      const normalized = normalizeSupportCode(merged.code);
      merged.code = normalized === 'ALL' ? '' : normalized;
    }
    return request(`/complains/me${buildQuery(merged)}`, {
      auth: true,
    });
  },
  getComplainDetail: (compId) =>
    request(`/complains/${compId}`, { auth: true }),
  createComplain: (body) =>
    request('/complains', {
      method: 'POST',
      body: { ...body, code: normalizeSupportCode(body?.code) },
      auth: true,
    }),
  updateComplain: (compId, body) =>
    request(`/complains/${compId}`, { method: 'PUT', body, auth: true }),
  deleteComplain: (compId) =>
    request(`/complains/${compId}`, { method: 'DELETE', auth: true }),
};

