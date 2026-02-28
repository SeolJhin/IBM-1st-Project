// features/community/api/communityApi.js
import { withApiPrefix } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
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

export const communityApi = {
  /** GET /boards — 게시글 목록 */
  getBoards: ({ page = 1, size = 10, boardType } = {}) => {
    const qs = new URLSearchParams({ page, size });
    if (boardType && boardType !== 'ALL') qs.set('boardType', boardType);
    return request(`/boards?${qs}`, { auth: false });
  },

  /** GET /boards/me — 내가 작성한 게시글 목록 */
  myBoards: ({ page = 1, size = 10, boardType } = {}) => {
    const qs = new URLSearchParams({ page, size });
    if (boardType && boardType !== 'ALL') qs.set('boardType', boardType);
    return request(`/boards/me?${qs}`);
  },

  /** GET /replies/me — 내가 작성한 댓글 목록 */
  myReplies: ({ page = 1, size = 10 } = {}) => {
    const qs = new URLSearchParams({ page, size });
    return request(`/replies/me?${qs}`);
  },

  /** GET /boards/:id — 게시글 상세 */
  getBoard: (boardId) => request(`/boards/${boardId}`, { auth: false }),

  /** POST /boards — 게시글 작성 */
  createBoard: (body) => request('/boards', { method: 'POST', body }),

  /** PATCH /boards/:id — 게시글 수정 */
  updateBoard: (boardId, body) =>
    request(`/boards/${boardId}`, { method: 'PATCH', body }),

  /** DELETE /boards/:id — 게시글 삭제 */
  deleteBoard: (boardId) => request(`/boards/${boardId}`, { method: 'DELETE' }),
};
