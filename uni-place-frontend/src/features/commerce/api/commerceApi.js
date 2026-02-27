// features/commerce/api/commerceApi.js
// UniPlace 백엔드 기준
// - 모든 응답은 ApiResponse<T> 형태: { success, data, errorCode, message }
// - buildingId 추가: 상품 목록은 buildingStocks 맵 포함, 주문 생성 시 buildingId 필수

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

export const commerceApi = {
  // ===== ProductController (/products) — 인증 불필요 =====

  /**
   * 전체 상품 목록 (on_sale 상태만) — 빌딩별 재고 포함
   * @returns {Promise<ProductWithBuildingStockResponse[]>}
   * 각 항목: { prodId, prodNm, prodPrice, code, prodDesc, prodSt, affiliateId,
   *            buildingStocks: { [buildingId]: stock } }
   */
  getProducts: () => request('/products'),

  getProduct: (prodId) => request(`/products/${prodId}`),

  getProductImages: (prodId) => request(`/products/${prodId}/images`),

  /**
   * 특정 상품의 빌딩별 재고 목록
   * @returns {Promise<ProductBuildingStockResponse[]>}
   */
  getProductBuildingStocks: (prodId) =>
    request(`/products/${prodId}/building-stocks`),

  // ===== CartController (/cart) — 인증 필요 =====

  getCart: () => request('/cart', { auth: true }),

  addCartItem: (body) =>
    request('/cart/items', { method: 'POST', body, auth: true }),

  updateCartItem: (cartItemId, body) =>
    request(`/cart/items/${cartItemId}`, { method: 'PATCH', body, auth: true }),

  removeCartItem: (cartItemId) =>
    request(`/cart/items/${cartItemId}`, { method: 'DELETE', auth: true }),

  clearCart: () => request('/cart/clear', { method: 'DELETE', auth: true }),

  // ===== OrderController (/orders) — 인증 필요 =====

  /**
   * 주문 생성
   * @param {{
   *   buildingId: number,       — 빌딩 ID (필수, 재고 차감 기준)
   *   items: Array<{ prodId: number, orderQuantity: number }>
   * }} body
   */
  createOrder: (body) =>
    request('/orders', { method: 'POST', body, auth: true }),

  getMyOrders: () => request('/orders/me', { auth: true }),

  getOrder: (orderId) => request(`/orders/${orderId}`, { auth: true }),

  cancelOrder: (orderId) =>
    request(`/orders/${orderId}/cancel`, { method: 'PATCH', auth: true }),

  // ===== RoomServiceOrderController (/room-services) — 인증 필요 =====

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
