import { fetchWithAuthRetry } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

function normalizeBoardCode(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'BOARD_FREE';

  const upper = raw.toUpperCase();
  if (upper === 'ALL') return 'ALL';
  if (upper === 'FREE') return 'BOARD_FREE';
  if (upper === 'QUESTION') return 'BOARD_QUESTION';
  if (upper === 'REVIEW') return 'BOARD_REVIEW';
  if (upper === 'NOTICE') return 'BOARD_NOTICE';
  return upper;
}

async function parseApiResponse(res) {
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

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  // auth=true면 토큰 필수, auth=false여도 토큰이 있으면 포함
  // (permitAll 엔드포인트도 토큰 있으면 백엔드가 likedByMe 등 개인화 정보를 반환)
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithAuthRetry(
    path,
    {
      method,
      headers,
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    },
    { auth }
  );

  return parseApiResponse(res);
}

async function requestForm(
  path,
  { method = 'POST', formData, auth = true } = {}
) {
  const headers = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithAuthRetry(
    path,
    {
      method,
      headers,
      credentials: 'same-origin',
      body: formData,
    },
    { auth }
  );

  return parseApiResponse(res);
}

export const communityApi = {
  getBoards: ({ page = 1, size = 10, boardType, auth = false } = {}) => {
    const qs = new URLSearchParams({
      page: String(Math.max(0, Number(page || 1) - 1)),
      size: String(size),
    });
    const normalized = normalizeBoardCode(boardType);
    if (normalized && normalized !== 'ALL') qs.set('boardType', normalized);
    return request(`/boards?${qs}`, { auth });
  },

  // 커뮤니티 검색 (title 또는 userId)
  searchBoards: ({
    page = 1,
    size = 10,
    boardType,
    searchType = 'title',
    keyword = '',
    auth = false,
  } = {}) => {
    const qs = new URLSearchParams({
      page: String(Math.max(0, Number(page || 1) - 1)),
      size: String(size),
      searchType,
      keyword,
    });
    const normalized = normalizeBoardCode(boardType);
    if (normalized && normalized !== 'ALL') qs.set('boardType', normalized);
    return request(`/boards/search?${qs}`, { auth });
  },

  myBoards: ({ page = 1, size = 10, boardType } = {}) => {
    const qs = new URLSearchParams({
      page: String(Math.max(0, Number(page || 1) - 1)),
      size: String(size),
    });
    const normalized = normalizeBoardCode(boardType);
    if (normalized && normalized !== 'ALL') qs.set('boardType', normalized);
    return request(`/boards/me?${qs}`);
  },

  myReplies: ({ page = 1, size = 10 } = {}) => {
    const qs = new URLSearchParams({
      page: String(Math.max(0, Number(page || 1) - 1)),
      size: String(size),
    });
    return request(`/replies/me?${qs}`);
  },

  getBoard: (boardId, { auth = false, increaseReadCount = true } = {}) => {
    const qs = new URLSearchParams();
    if (increaseReadCount === false) qs.set('increaseReadCount', 'false');
    const q = qs.toString();
    return request(`/boards/${boardId}${q ? `?${q}` : ''}`, { auth });
  },

  createBoard: ({
    boardTitle,
    boardCtnt,
    code,
    anonymity = 'N',
    ofile,
  } = {}) => {
    const formData = new FormData();
    formData.append('boardTitle', boardTitle ?? '');
    formData.append('boardCtnt', boardCtnt ?? '');
    formData.append('code', normalizeBoardCode(code));
    formData.append('anonymity', anonymity ?? 'N');
    if (ofile) formData.append('ofile', ofile);
    return requestForm('/boards', { method: 'POST', formData });
  },

  updateBoard: (boardId, { boardTitle, boardCtnt, anonymity, code } = {}) => {
    const formData = new FormData();
    if (boardTitle != null) formData.append('boardTitle', boardTitle);
    if (boardCtnt != null) formData.append('boardCtnt', boardCtnt);
    if (anonymity != null) formData.append('anonymity', anonymity);
    if (code != null) formData.append('code', code);
    return requestForm(`/boards/${boardId}`, { method: 'PUT', formData });
  },

  deleteBoard: (boardId) => request(`/boards/${boardId}`, { method: 'DELETE' }),

  getReplies: (boardId, { auth = false } = {}) =>
    request(`/boards/${boardId}/replies`, { auth }),

  getChildReplies: (boardId, parentId, { auth = false } = {}) =>
    request(`/boards/${boardId}/replies/${parentId}/children`, { auth }),

  createReply: (boardId, { replyCtnt, anonymity = 'N' } = {}) => {
    const formData = new FormData();
    formData.append('replyCtnt', replyCtnt ?? '');
    formData.append('anonymity', anonymity);
    return requestForm(`/boards/${boardId}/replies`, {
      method: 'POST',
      formData,
      auth: true,
    });
  },

  createChildReply: (
    boardId,
    parentId,
    { replyCtnt, anonymity = 'N' } = {}
  ) => {
    const formData = new FormData();
    formData.append('replyCtnt', replyCtnt ?? '');
    formData.append('anonymity', anonymity);
    return requestForm(`/boards/${boardId}/replies/${parentId}/children`, {
      method: 'POST',
      formData,
      auth: true,
    });
  },

  updateReply: (replyId, { replyCtnt, anonymity } = {}) => {
    const formData = new FormData();
    formData.append('replyCtnt', replyCtnt ?? '');
    if (anonymity !== undefined) formData.append('anonymity', anonymity);
    return requestForm(`/replies/${replyId}`, {
      method: 'PUT',
      formData,
      auth: true,
    });
  },

  deleteReply: (replyId) =>
    request(`/replies/${replyId}`, { method: 'DELETE', auth: true }),

  // 게시글 좋아요
  likeBoard: (boardId) =>
    request(`/boards/${boardId}/likes`, { method: 'POST', auth: true }),

  unlikeBoard: (boardId) =>
    request(`/boards/${boardId}/likes`, { method: 'DELETE', auth: true }),

  // 댓글 좋아요
  likeReply: (replyId) =>
    request(`/replies/${replyId}/likes`, { method: 'POST', auth: true }),

  unlikeReply: (replyId) =>
    request(`/replies/${replyId}/likes`, { method: 'DELETE', auth: true }),
};
