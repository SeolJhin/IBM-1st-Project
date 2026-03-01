import { withApiPrefix } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

function normalizeBoardCode(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'BOARD_FREE';

  const upper = raw.toUpperCase();
  if (upper === 'ALL') return 'ALL';
  if (upper === 'FREE') return 'BOARD_FREE';
  if (upper === 'QUESTION') return 'BOARD_FREE';
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
  if (auth) headers.Authorization = `Bearer ${getAccessToken()}`;

  const res = await fetch(withApiPrefix(path), {
    method,
    headers,
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseApiResponse(res);
}

async function requestForm(path, { method = 'POST', formData, auth = true } = {}) {
  const headers = {};
  if (auth) headers.Authorization = `Bearer ${getAccessToken()}`;

  const res = await fetch(withApiPrefix(path), {
    method,
    headers,
    credentials: 'same-origin',
    body: formData,
  });

  return parseApiResponse(res);
}

export const communityApi = {
  getBoards: ({ page = 1, size = 10, boardType } = {}) => {
    const qs = new URLSearchParams({
      page: String(Math.max(0, Number(page || 1) - 1)),
      size: String(size),
    });
    const normalized = normalizeBoardCode(boardType);
    if (normalized && normalized !== 'ALL') qs.set('boardType', normalized);
    return request(`/boards?${qs}`, { auth: false });
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
    const qs = new URLSearchParams({ page, size });
    return request(`/replies/me?${qs}`);
  },

  getBoard: (boardId) => request(`/boards/${boardId}`, { auth: false }),

  createBoard: ({ boardTitle, boardCtnt, code, anonymity = 'N', ofile } = {}) => {
    const formData = new FormData();
    formData.append('boardTitle', boardTitle ?? '');
    formData.append('boardCtnt', boardCtnt ?? '');
    formData.append('code', normalizeBoardCode(code));
    formData.append('anonymity', anonymity ?? 'N');
    if (ofile) formData.append('ofile', ofile);
    return requestForm('/boards', { method: 'POST', formData });
  },

  updateBoard: (boardId, body) =>
    request(`/boards/${boardId}`, { method: 'PATCH', body }),

  deleteBoard: (boardId) => request(`/boards/${boardId}`, { method: 'DELETE' }),
};
