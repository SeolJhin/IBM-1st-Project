// features/support/api/supportApi.js
// UniPlace 백엔드(Support 도메인) 기준
// - 모든 응답은 ApiResponse<T> 형태: { success, data, errorCode, message }
// - 페이지 응답은 PageResponse<T> 형태: { content, page, size, totalElements, totalPages }
//
// [인증 정책]
// - FAQ 목록/상세         → 인증 불필요 (public)
// - 공지 목록/상세        → 인증 불필요 (public)
// - QnA 목록/상세        → 인증 필요 (auth)
// - 민원 내 목록/상세     → 인증 필요 (auth)
// - ADMIN 전용 항목       → hasRole('ADMIN')
//
// [엔드포인트 목록]
// GET    /faqs                      → FAQ 목록
// GET    /faqs/{faqId}              → FAQ 상세
//
// GET    /notices                   → 공지 목록
// GET    /notices/{noticeId}        → 공지 상세
//
// GET    /qna                       → 본인 QnA 목록 (auth)
// GET    /qna/all                   → 전체 QnA 목록 (ADMIN)
// GET    /qna/{qnaId}               → QnA 상세
// GET    /qna/{qnaId}/replies       → QnA 답변 목록
// POST   /qna                       → QnA 질문 등록 (auth)
// PUT    /qna/{qnaId}               → QnA 수정
// DELETE /qna/{qnaId}               → QnA 삭제
// POST   /qna/{qnaId}/answer        → 답변 등록 (ADMIN)
// PUT    /qna/{qnaId}/answer        → 답변 수정 (ADMIN)
// PATCH  /qna/{qnaId}/status        → 상태 변경 (ADMIN)
//
// GET    /complains                 → 전체 민원 목록 (ADMIN)
// GET    /complains/me              → 내 민원 목록 (auth)
// GET    /complains/{compId}        → 민원 상세
// POST   /complains                 → 민원 등록 (auth)
// PUT    /complains/{compId}        → 민원 수정
// PATCH  /complains/{compId}/status → 상태 변경 (ADMIN)
// POST   /complains/{compId}/reply  → 관리자 답변 (ADMIN)
// DELETE /complains/{compId}        → 민원 삭제

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

  // ===== FaqController (/faqs) =====

  /**
   * FAQ 목록 조회 (public)
   * @param {{ page?, size?, sort?, direct?, code? }} params
   * @returns {Promise<PageResponse<FaqResponse>>}
   *
   * FaqResponse 필드:
   *   faqId, faqTitle, faqCtnt, createdAt, isActive, code
   */
  getFaqs: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'faqId', direct: 'DESC' };
    return request(`/faqs${buildQuery({ ...defaults, ...params })}`);
  },

  /**
   * FAQ 상세 조회 (public)
   * @param {number} faqId
   */
  getFaqDetail: (faqId) =>
    request(`/faqs/${faqId}`),


  // ===== NoticeController (/notices) =====

  /**
   * 공지 목록 조회 (public)
   * @param {{ page?, size?, sort?, direct?, code? }} params
   * @returns {Promise<PageResponse<NoticeResponse>>}
   *
   * NoticeResponse 필드:
   *   noticeId, noticeTitle, userId, noticeCtnt, importance,
   *   impEndAt, readCount, noticeSt, fileCk, code, createdAt, updatedAt
   */
  getNotices: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'noticeId', direct: 'DESC' };
    return request(`/notices${buildQuery({ ...defaults, ...params })}`);
  },

  /**
   * 공지 상세 조회 (public)
   * @param {number} noticeId
   */
  getNoticeDetail: (noticeId) =>
    request(`/notices/${noticeId}`),


  // ===== QnaController (/qna) =====

  /**
   * 본인 QnA 목록 조회 (auth)
   * @param {{ page?, size?, sort?, direct? }} params
   * @returns {Promise<PageResponse<QnaResponse>>}
   *
   * QnaResponse 필드:
   *   qnaId, parentId, qnaTitle, userId, qnaSt, readCount,
   *   qnaCtnt, code, fileCk, replyCk, groupId, qnaLev, createdAt, updatedAt
   */
  getQnas: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'qnaId', direct: 'DESC' };
    return request(`/qna${buildQuery({ ...defaults, ...params })}`, { auth: true });
  },

  /**
   * QnA 상세 조회
   * @param {number} qnaId
   */
  getQnaDetail: (qnaId) =>
    request(`/qna/${qnaId}`, { auth: true }),

  /**
   * QnA 답변 목록 조회
   * @param {number} qnaId
   * @returns {Promise<QnaResponse[]>}
   */
  getQnaReplies: (qnaId) =>
    request(`/qna/${qnaId}/replies`, { auth: true }),

  /**
   * QnA 질문 등록 (auth)
   * @param {{ qnaTitle, qnaCtnt, code }} body
   */
  createQna: (body) =>
    request('/qna', { method: 'POST', body, auth: true }),

  /**
   * QnA 수정
   * @param {number} qnaId
   * @param {{ qnaTitle?, qnaCtnt? }} body
   */
  updateQna: (qnaId, body) =>
    request(`/qna/${qnaId}`, { method: 'PUT', body, auth: true }),

  /**
   * QnA 삭제
   * @param {number} qnaId
   */
  deleteQna: (qnaId) =>
    request(`/qna/${qnaId}`, { method: 'DELETE', auth: true }),


  // ===== ComplainController (/complains) =====

  /**
   * 내 민원 목록 조회 (auth)
   * @param {{ page?, size?, sort?, direct? }} params
   * @returns {Promise<PageResponse<ComplainResponse>>}
   *
   * ComplainResponse 필드:
   *   compId, compTitle, userId, compCtnt, compSt,
   *   code, fileCk, replyCk, createdAt, updatedAt
   */
  getMyComplains: (params = {}) => {
    const defaults = { page: 1, size: 10, sort: 'compId', direct: 'DESC' };
    return request(`/complains/me${buildQuery({ ...defaults, ...params })}`, { auth: true });
  },

  /**
   * 민원 상세 조회 (auth)
   * @param {number} compId
   */
  getComplainDetail: (compId) =>
    request(`/complains/${compId}`, { auth: true }),

  /**
   * 민원 등록 (auth)
   * @param {{ compTitle, compCtnt, code }} body
   */
  createComplain: (body) =>
    request('/complains', { method: 'POST', body, auth: true }),

  /**
   * 민원 수정 (auth)
   * @param {number} compId
   * @param {{ compTitle?, compCtnt? }} body
   */
  updateComplain: (compId, body) =>
    request(`/complains/${compId}`, { method: 'PUT', body, auth: true }),

  /**
   * 민원 삭제 (auth)
   * @param {number} compId
   */
  deleteComplain: (compId) =>
    request(`/complains/${compId}`, { method: 'DELETE', auth: true }),
};
