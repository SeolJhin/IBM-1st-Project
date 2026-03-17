// features/commerce/api/commerceApi.js
// UniPlace 커머스 API
// - 모든 응답은 ApiResponse<T> 형태: { success, data, errorCode, message }
// - buildingId 주의: 상품 목록은 buildingStocks 안에 포함, 주문 생성 시 buildingId 필수

import { fetchWithAuthRetry } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
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
      (typeof payload === 'string' ? payload : '요청에 실패했습니다.');
    const error = new Error(message);
    error.status = res.status;
    error.errorCode = api?.errorCode;
    error.data = payload;
    throw error;
  }

  return api ? api.data : payload;
}

export const commerceApi = {
  // ===== ProductController (/products) 관련 API =====

  /**
   * 전체 상품 목록 조회 (on_sale 상태인 것만 빌딩별 재고 포함)
   * @returns {Promise<ProductWithBuildingStockResponse[]>}
   * 응답 예시: { prodId, prodNm, prodPrice, code, prodDesc, prodSt, affiliateId,
   *            buildingStocks: { [buildingId]: stock } }
   */
  getProducts: () => request('/products'),

  getProduct: (prodId) => request(`/products/${prodId}`),

  getProductImages: (prodId) => request(`/products/${prodId}/images`),

  /**
   * 특정 상품의 빌딩별 재고 목록 조회
   * @returns {Promise<ProductBuildingStockResponse[]>}
   */
  getProductBuildingStocks: (prodId) =>
    request(`/products/${prodId}/building-stocks`),

  // ===== CartController (/cart) 관련 API =====

  getCart: () => request('/cart', { auth: true }),

  addCartItem: (body) =>
    request('/cart/items', { method: 'POST', body, auth: true }),

  updateCartItem: (cartItemId, body) =>
    request(`/cart/items/${cartItemId}`, { method: 'PATCH', body, auth: true }),

  removeCartItem: (cartItemId) =>
    request(`/cart/items/${cartItemId}`, { method: 'DELETE', auth: true }),

  clearCart: () => request('/cart/clear', { method: 'DELETE', auth: true }),

  // ===== OrderController (/orders) 관련 API =====

  /**
   * 주문 생성
   * @param {{
   *   buildingId: number,       // 픽업 빌딩 ID (필수, 재고 확인 기준)
   *   items: Array<{ prodId: number, orderQuantity: number }>
   * }} body
   */
  createOrder: (body) =>
    request('/orders', { method: 'POST', body, auth: true }),

  getMyOrders: () => request('/orders/me', { auth: true }),

  getOrder: (orderId) => request(`/orders/${orderId}`, { auth: true }),

  cancelOrder: (orderId) =>
    request(`/orders/${orderId}/cancel`, { method: 'PATCH', auth: true }),

  // 결제창 이탈(뒤로가기) 시 결제 포기 처리 → payment cancelled, order cancelled
  abandonPayment: (paymentId) =>
    request(`/payments/${paymentId}/abandon`, { method: 'POST', auth: true }),

  // ===== RoomServiceOrderController (/room-services) 관련 API =====

  createRoomServiceOrder: ({ orderId, roomId, roomServiceDesc } = {}) =>
    request('/room-services', {
      method: 'POST',
      body: { orderId, roomId, roomServiceDesc },
      auth: true,
    }),

  getMyRoomServiceOrders: () => request('/room-services/me', { auth: true }),

  cancelRoomServiceOrder: (orderId) =>
    request(`/room-services/${orderId}/cancel`, {
      method: 'PATCH',
      auth: true,
    }),
};
