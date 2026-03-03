// features/file/api/fileApi.js

const API = '/api';

function getToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
}

async function parseResponse(res) {
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json().catch(() => null);
  return res.text().catch(() => null);
}

function unwrap(res, payload) {
  const api =
    payload && typeof payload === 'object' && 'success' in payload
      ? payload
      : null;
  if (!res.ok || (api && api.success === false)) {
    const msg =
      (api && api.message) ||
      (payload && payload.message) ||
      '파일 API 요청에 실패했습니다.';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return api ? api.data : payload;
}

/**
 * 백엔드가 반환하는 /files/{id}/view → /api/files/{id}/view 변환
 */
export function toApiImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return url;
  return `/api${url.startsWith('/') ? url : `/${url}`}`;
}

export const fileApi = {
  /**
   * GET /files?fileParentType=&fileParentId=
   * 삭제되지 않은 파일 목록 (공개)
   */
  getFiles: async (fileParentType, fileParentId) => {
    const url = `${API}/files?fileParentType=${encodeURIComponent(fileParentType)}&fileParentId=${fileParentId}`;
    const res = await fetch(url);
    const payload = await parseResponse(res);
    return unwrap(res, payload);
  },

  /**
   * GET /files/admin?fileParentType=&fileParentId=
   * 삭제된 파일 포함 (관리자 전용)
   */
  getFilesAdmin: async (fileParentType, fileParentId) => {
    const token = getToken();
    const url = `${API}/files/admin?fileParentType=${encodeURIComponent(fileParentType)}&fileParentId=${fileParentId}`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const payload = await parseResponse(res);
    return unwrap(res, payload);
  },

  /**
   * POST /files  multipart/form-data
   * { fileParentType, fileParentId, files[] }
   */
  upload: async (fileParentType, fileParentId, files = []) => {
    const token = getToken();
    const fd = new FormData();
    fd.append('fileParentType', fileParentType);
    fd.append('fileParentId', String(fileParentId));
    files.forEach((f) => fd.append('files', f));
    const res = await fetch(`${API}/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const payload = await parseResponse(res);
    return unwrap(res, payload);
  },

  /**
   * DELETE /files/admin  body: [fileId, ...]
   */
  deleteFiles: async (fileIds = []) => {
    if (!fileIds.length) return null;
    const token = getToken();
    const res = await fetch(`${API}/files/admin`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(fileIds),
    });
    const payload = await parseResponse(res);
    return unwrap(res, payload);
  },
};
