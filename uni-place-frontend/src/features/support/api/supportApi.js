// src/features/support/api/supportApi.js
import { fetchWithAuthRetry, withApiPrefix } from '../../../app/http/apiBase';

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

  // COMP_*, QNA_* 는 그대로 백엔드로 전달 (서버에서 직접 처리)
  if (upper.startsWith('QNA_') || upper.startsWith('COMP_')) return upper;

  return upper;
}

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
        ...(auth && getAccessToken()
          ? { Authorization: `Bearer ${getAccessToken()}` }
          : {}),
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
    const message =
      (api && api.message) ||
      (payload && payload.message) ||
      (typeof payload === 'string'
        ? payload
        : '\uC694\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
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

// ===== 파일 업로드 유틸 =====
async function uploadFiles(fileParentType, fileParentId, files) {
  const formData = new FormData();
  formData.append('fileParentType', fileParentType);
  formData.append('fileParentId', String(fileParentId));
  files.forEach((f) => formData.append('files', f));

  const token = localStorage.getItem('access_token') || '';
  const res = await fetchWithAuthRetry(
    withApiPrefix('/files'),
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: 'same-origin',
    },
    { auth: true }
  );
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.message || '파일 업로드에 실패했습니다.');
  }
  return payload?.data ?? payload;
}

async function getFilesByParent(fileParentType, fileParentId) {
  const token = localStorage.getItem('access_token') || '';
  const res = await fetchWithAuthRetry(
    withApiPrefix(
      `/files?fileParentType=${fileParentType}&fileParentId=${fileParentId}`
    ),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'same-origin',
    },
    { auth: true }
  );
  const payload = await res.json().catch(() => null);
  if (!res.ok) return [];
  return payload?.data ?? payload ?? [];
}

export const supportApi = {
  // ===== 파일 =====
  uploadFiles,
  getFilesByParent,
  getFileViewUrl: (fileId) => withApiPrefix(`/files/${fileId}/view`),

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
  updateFaq: (faqId, body) =>
    request(`/faqs/${faqId}`, {
      method: 'PUT',
      body: {
        ...body,
        code: normalizeSupportCode(body?.code),
      },
      auth: true,
    }),
  deleteFaq: (faqId) =>
    request(`/faqs/${faqId}`, { method: 'DELETE', auth: true }),

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
  updateNotice: (noticeId, body) =>
    request(`/notices/${noticeId}`, {
      method: 'PUT',
      body: {
        ...body,
        code: body?.code ? normalizeSupportCode(body?.code) : body?.code,
      },
      auth: true,
    }),
  deleteNotice: (noticeId) =>
    request(`/notices/${noticeId}`, { method: 'DELETE', auth: true }),

  // ===== QnA =====
  getQnas: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'qnaId', direct: 'DESC' };
    const merged = { ...defaults, ...params };
    if (merged.code) {
      const normalized = normalizeSupportCode(merged.code);
      merged.code = normalized === 'ALL' ? '' : normalized;
    }
    return request(`/qna${buildQuery(merged)}`, { auth: true });
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
    request(`/qna/${qnaId}/answer`, { method: 'POST', body, auth: true }),
  updateQnaAnswer: (qnaId, body) =>
    request(`/qna/${qnaId}/answer`, { method: 'PUT', body, auth: true }),
  updateQna: (qnaId, body) =>
    request(`/qna/${qnaId}`, {
      method: 'PUT',
      body: {
        qnaTitle: body?.qnaTitle,
        qnaCtnt: body?.qnaCtnt,
      },
      auth: true,
    }),
  deleteQna: (qnaId) =>
    request(`/qna/${qnaId}`, { method: 'DELETE', auth: true }),

  // ===== Complains =====
  getComplains: (params = {}) => {
    const defaults = { page: 1, size: 10 };
    const merged = { ...defaults, ...params };
    if (merged.code) {
      const normalized = normalizeSupportCode(merged.code);
      merged.code = normalized === 'ALL' ? '' : normalized;
    }
    return request(`/complains${buildQuery(merged)}`, { auth: true });
  },
  getMyComplains: (params = {}) => {
    const defaults = { page: 1, size: 10 };
    const merged = { ...defaults, ...params };
    return request(
      `/complains/me${buildQuery({ page: merged.page, size: merged.size })}`,
      { auth: true }
    );
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
    request(`/complains/${compId}`, {
      method: 'PUT',
      body: {
        compTitle: body?.compTitle,
        compCtnt: body?.compCtnt,
      },
      auth: true,
    }),
  updateComplainStatus: (compId, compSt) =>
    request(`/complains/${compId}/status`, {
      method: 'PATCH',
      body: { compSt },
      auth: true,
    }),
  /** 관리자 답변 등록 - reply_ck='Y' + 상태 변경 + 답변 내용 저장 */
  createComplainReply: (compId, body) =>
    request(`/complains/${compId}/reply`, {
      method: 'POST',
      body: {
        compSt: body?.compSt ?? 'resolved',
        replyCtnt: body?.replyCtnt,
      },
      auth: true,
    }),
  deleteComplain: (compId) =>
    request(`/complains/${compId}`, { method: 'DELETE', auth: true }),
};
