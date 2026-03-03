import { fetchWithAuthRetry } from '../../../app/http/apiBase';
import { api } from '../../../app/http/axiosInstance';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const res = await fetchWithAuthRetry(
    path,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      },
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    },
    { auth }
  );

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  const apiPayload =
    payload && typeof payload === 'object' && 'success' in payload
      ? payload
      : null;

  if (!res.ok || (apiPayload && apiPayload.success === false)) {
    const message =
      apiPayload?.message ||
      (typeof payload === 'string'
        ? payload
        : '요청을 처리하지 못했습니다.');
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return apiPayload ? apiPayload.data : payload;
}

const MONTHLY_SERVICE_GOODS_ID = 2;

export const billingApi = {
  listByContract: (contractId) =>
    request(`/monthly-charges?contractId=${encodeURIComponent(contractId)}`),

  detail: (chargeId) => request(`/monthly-charges/${chargeId}`),

  prepareKakaoByCharge: async (chargeId) => {
    const res = await api.post('/payments/prepare', {
      serviceGoodsId: MONTHLY_SERVICE_GOODS_ID,
      chargeId,
      provider: 'KAKAO',
    });
    const payload = res?.data;
    if (payload?.success === false) {
      throw new Error(payload.message || '결제 준비에 실패했습니다.');
    }
    return payload?.data ?? payload;
  },

  prepareKakaoBatch: async (chargeIds) => {
    const res = await api.post('/payments/prepare/monthly-batch', {
      serviceGoodsId: MONTHLY_SERVICE_GOODS_ID,
      chargeIds,
      provider: 'KAKAO',
    });
    const payload = res?.data;
    if (payload?.success === false) {
      throw new Error(payload.message || '일괄 결제 준비에 실패했습니다.');
    }
    return payload?.data ?? payload;
  },
};
