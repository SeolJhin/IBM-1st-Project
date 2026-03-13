// src/features/admin/api/inspectionApi.js
import { fetchWithAuthRetry } from '../../../app/http/apiBase';

function getAccessToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
}

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

async function parsePayload(res) {
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json'))
    return res.json().catch(() => null);
  return res.text().catch(() => null);
}

function unwrapOrThrow(res, payload) {
  const api =
    payload && typeof payload === 'object' && 'success' in payload
      ? payload
      : null;
  if (!res.ok || (api && api.success === false)) {
    const message = (api && api.message) || '요청 처리 중 오류가 발생했습니다.';
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return api ? api.data : payload;
}

export const inspectionApi = {
  /**
   * 점검 생성 - 이미지 파일 업로드 + AI 분석
   * @param {FormData} formData - afterImage(File), spaceType, spaceId, inspectionMemo
   */
  createInspection: async (formData) => {
    const res = await fetchWithAuthRetry(
      '/admin/inspections',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData, // Content-Type은 브라우저가 자동으로 multipart/form-data 설정
      },
      { auth: true }
    );
    const payload = await parsePayload(res);
    return unwrapOrThrow(res, payload);
  },

  /**
   * 전체 점검 목록 조회
   * @param {{ page, size }} params
   */
  getInspections: async ({ page = 0, size = 10 } = {}) => {
    const res = await fetchWithAuthRetry(
      `/admin/inspections${buildQuery({ page, size })}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      },
      { auth: true }
    );
    const payload = await parsePayload(res);
    return unwrapOrThrow(res, payload);
  },

  /**
   * 점검 상세 조회
   * @param {number} inspectionId
   */
  getInspection: async (inspectionId) => {
    const res = await fetchWithAuthRetry(
      `/admin/inspections/${inspectionId}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      },
      { auth: true }
    );
    const payload = await parsePayload(res);
    return unwrapOrThrow(res, payload);
  },

  /**
   * 특정 공간의 점검 목록 조회
   * @param {string} spaceType - room / building / common_space
   * @param {number} spaceId
   * @param {{ page, size }} params
   */
  getInspectionsBySpace: async (
    spaceType,
    spaceId,
    { page = 0, size = 10 } = {}
  ) => {
    const res = await fetchWithAuthRetry(
      `/admin/inspections/spaces/${spaceType}/${spaceId}${buildQuery({ page, size })}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      },
      { auth: true }
    );
    const payload = await parsePayload(res);
    return unwrapOrThrow(res, payload);
  },

  /**
   * 미처리(open) 티켓 목록 조회
   * @param {{ page, size }} params
   */
  getOpenTickets: async ({ page = 0, size = 10 } = {}) => {
    const res = await fetchWithAuthRetry(
      `/admin/inspections/tickets/open${buildQuery({ page, size })}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      },
      { auth: true }
    );
    const payload = await parsePayload(res);
    return unwrapOrThrow(res, payload);
  },

  /**
   * 티켓 상태 변경
   * @param {number} ticketId
   * @param {string} ticketStatus - open / in_progress / resolved / closed
   */
  updateTicketStatus: async (ticketId, ticketStatus) => {
    const res = await fetchWithAuthRetry(
      `/admin/inspections/tickets/${ticketId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ ticketStatus }),
      },
      { auth: true }
    );
    const payload = await parsePayload(res);
    return unwrapOrThrow(res, payload);
  },
  /**
   * 점검 삭제 (연관 티켓 포함)
   * @param {number} inspectionId
   */
  deleteInspection: async (inspectionId) => {
    const res = await fetchWithAuthRetry(
      `/admin/inspections/${inspectionId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      },
      { auth: true }
    );
    const payload = await parsePayload(res);
    return unwrapOrThrow(res, payload);
  },
};
