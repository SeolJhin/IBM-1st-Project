// features/commerce/api/commerceApi.js
// UniPlace 諛깆뿏??湲곗?
// - 紐⑤뱺 ?묐떟? ApiResponse<T> ?뺥깭: { success, data, errorCode, message }
// - buildingId 異붽?: ?곹뭹 紐⑸줉? buildingStocks 留??ы븿, 二쇰Ц ?앹꽦 ??buildingId ?꾩닔

import { fetchWithAuthRetry } from '../../../app/http/apiBase';

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

async function request(
  path,
  { method = 'GET', body, headers = {}, auth = false } = {}
) {
  const res = await fetchWithAuthRetry(path, {
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
  }, { auth });

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
      (typeof payload === 'string' ? payload : '?붿껌???ㅽ뙣?덉뒿?덈떎.');
    const error = new Error(message);
    error.status = res.status;
    error.errorCode = api?.errorCode;
    error.data = payload;
    throw error;
  }

  return api ? api.data : payload;
}

export const commerceApi = {
  // ===== ProductController (/products) ???몄쬆 遺덊븘??=====

  /**
   * ?꾩껜 ?곹뭹 紐⑸줉 (on_sale ?곹깭留? ??鍮뚮뵫蹂??ш퀬 ?ы븿
   * @returns {Promise<ProductWithBuildingStockResponse[]>}
   * 媛???ぉ: { prodId, prodNm, prodPrice, code, prodDesc, prodSt, affiliateId,
   *            buildingStocks: { [buildingId]: stock } }
   */
  getProducts: () => request('/products'),

  getProduct: (prodId) => request(`/products/${prodId}`),

  getProductImages: (prodId) => request(`/products/${prodId}/images`),

  /**
   * ?뱀젙 ?곹뭹??鍮뚮뵫蹂??ш퀬 紐⑸줉
   * @returns {Promise<ProductBuildingStockResponse[]>}
   */
  getProductBuildingStocks: (prodId) =>
    request(`/products/${prodId}/building-stocks`),

  // ===== CartController (/cart) ???몄쬆 ?꾩슂 =====

  getCart: () => request('/cart', { auth: true }),

  addCartItem: (body) =>
    request('/cart/items', { method: 'POST', body, auth: true }),

  updateCartItem: (cartItemId, body) =>
    request(`/cart/items/${cartItemId}`, { method: 'PATCH', body, auth: true }),

  removeCartItem: (cartItemId) =>
    request(`/cart/items/${cartItemId}`, { method: 'DELETE', auth: true }),

  clearCart: () => request('/cart/clear', { method: 'DELETE', auth: true }),

  // ===== OrderController (/orders) ???몄쬆 ?꾩슂 =====

  /**
   * 二쇰Ц ?앹꽦
   * @param {{
   *   buildingId: number,       ??鍮뚮뵫 ID (?꾩닔, ?ш퀬 李④컧 湲곗?)
   *   items: Array<{ prodId: number, orderQuantity: number }>
   * }} body
   */
  createOrder: (body) =>
    request('/orders', { method: 'POST', body, auth: true }),

  getMyOrders: () => request('/orders/me', { auth: true }),

  getOrder: (orderId) => request(`/orders/${orderId}`, { auth: true }),

  cancelOrder: (orderId) =>
    request(`/orders/${orderId}/cancel`, { method: 'PATCH', auth: true }),

  // ===== RoomServiceOrderController (/room-services) ???몄쬆 ?꾩슂 =====

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

