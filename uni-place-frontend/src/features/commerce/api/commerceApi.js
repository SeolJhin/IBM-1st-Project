// features/commerce/api/commerceApi.js
// UniPlace 백엔드(ProductController, CartController, OrderController, RoomServiceOrderController) 기준
// - 모든 응답은 ApiResponse<T> 형태: { success, data, errorCode, message }
// - Product 조회는 인증 불필요 (공개 API)
// - Cart / Order / RoomService는 인증 필요 (Authorization: Bearer <accessToken>)
//
// [주문 흐름]
//   ① 장바구니 담기 (POST /cart/items)
//   ② 주문 생성    (POST /orders)          → Order 생성 (상품/결제 단위)
//   ③ 룸서비스 요청 (POST /room-services)  → RoomServiceOrder 생성 (어느 방으로 배달할지)
//      - orderId: 부모 Order ID (선택, null 가능)
//        → 백엔드가 해당 Order의 totalPrice를 자동으로 복사하므로 프론트에서 totalPrice 전송 불필요
//      - roomId: 배달 받을 방 ID
//
// [엔드포인트 목록]
// ── Product ──────────────────────────────────────────────────
// GET  /products                          → 전체 상품 목록 (on_sale 상태만)
// GET  /products/{prodId}                 → 단일 상품 조회
// GET  /products/{prodId}/images          → 상품 이미지 목록
//
// ── Cart ─────────────────────────────────────────────────────
// GET    /cart                            → 내 장바구니 조회
// POST   /cart/items                      → 상품 추가         { prodId, quantity }
// PATCH  /cart/items/{cartItemId}         → 수량 변경         { quantity }
// DELETE /cart/items/{cartItemId}         → 아이템 삭제
// DELETE /cart/clear                      → 장바구니 전체 비우기
//
// ── Order ────────────────────────────────────────────────────
// POST  /orders                           → 주문 생성         { items: [{ prodId, orderQuantity }] }
// GET   /orders/me                        → 내 주문 목록
// GET   /orders/{orderId}                 → 주문 상세
// PATCH /orders/{orderId}/cancel          → 주문 취소
//
// ── RoomServiceOrder ─────────────────────────────────────────
// POST  /room-services                    → 룸서비스 주문 생성 { orderId?, roomId, roomServiceDesc? }
//                                           ※ totalPrice는 백엔드가 parentOrder에서 자동 복사
// GET   /room-services/me                 → 내 룸서비스 주문 목록
// PATCH /room-services/{orderId}/cancel   → 룸서비스 주문 취소

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
   * 전체 상품 목록 조회 (on_sale 상태만)
   * @returns {Promise<ProductResponse[]>}
   * ProductResponse: { prodId, prodNm, prodPrice, prodStock, code, prodDesc, prodSt, affiliateId }
   */
  getProducts: () => request('/products'),

  /**
   * 단일 상품 조회
   * @param {number} prodId
   * @returns {Promise<ProductResponse>}
   */
  getProduct: (prodId) => request(`/products/${prodId}`),

  /**
   * 상품 이미지 목록 조회
   * @param {number} prodId
   * @returns {Promise<FileResponse[]>}
   */
  getProductImages: (prodId) => request(`/products/${prodId}/images`),

  // ===== CartController (/cart) — 인증 필요 =====

  /**
   * 내 장바구니 조회
   * @returns {Promise<CartResponse>}
   * CartResponse: { cartId, userId, items[], totalAmount, totalQuantity }
   * CartItemResponse: { cartItemId, prodId, prodNm, orderPrice, orderQuantity, lineTotal, thumbnailPath }
   */
  getCart: () => request('/cart', { auth: true }),

  /**
   * 장바구니 상품 추가
   * @param {{ prodId: number, quantity: number }} body — CartAddRequest
   * @returns {Promise<CartResponse>}
   */
  addCartItem: (body) =>
    request('/cart/items', { method: 'POST', body, auth: true }),

  /**
   * 장바구니 수량 변경
   * @param {number} cartItemId
   * @param {{ quantity: number }} body — CartQuantityUpdateRequest
   * @returns {Promise<CartResponse>}
   */
  updateCartItem: (cartItemId, body) =>
    request(`/cart/items/${cartItemId}`, { method: 'PATCH', body, auth: true }),

  /**
   * 장바구니 아이템 삭제
   * @param {number} cartItemId
   * @returns {Promise<CartResponse>}
   */
  removeCartItem: (cartItemId) =>
    request(`/cart/items/${cartItemId}`, { method: 'DELETE', auth: true }),

  /**
   * 장바구니 전체 비우기
   * @returns {Promise<null>} — 204 No Content
   */
  clearCart: () => request('/cart/clear', { method: 'DELETE', auth: true }),

  // ===== OrderController (/orders) — 인증 필요 =====

  /**
   * 주문 생성 (상품 결제 단위)
   * @param {{ items: Array<{ prodId: number, orderQuantity: number }> }} body — OrderCreateRequest
   * @returns {Promise<OrderResponse>}
   * OrderResponse: { orderId, userId, orderSt, totalPrice, paymentId, orderCreatedAt,
   *                  orderItems[], roomServiceOrders[] }
   */
  createOrder: (body) =>
    request('/orders', { method: 'POST', body, auth: true }),

  /**
   * 내 주문 목록 조회
   * @returns {Promise<OrderResponse[]>}
   */
  getMyOrders: () => request('/orders/me', { auth: true }),

  /**
   * 주문 상세 조회
   * @param {number} orderId
   * @returns {Promise<OrderResponse>}
   */
  getOrder: (orderId) => request(`/orders/${orderId}`, { auth: true }),

  /**
   * 주문 취소
   * @param {number} orderId
   * @returns {Promise<OrderResponse>}
   */
  cancelOrder: (orderId) =>
    request(`/orders/${orderId}/cancel`, { method: 'PATCH', auth: true }),

  // ===== RoomServiceOrderController (/room-services) — 인증 필요 =====

  /**
   * 룸서비스 주문 생성 (어느 방으로 배달할지)
   *
   * ✅ totalPrice 자동 처리:
   *   백엔드가 orderId → parentOrder.totalPrice를 자동으로 복사하므로
   *   프론트에서 totalPrice를 전송할 필요 없음
   *
   * @param {{
   *   orderId?: number,        — 부모 Order ID (선택, null 가능)
   *                              null이면 백엔드가 빈 Order를 자동 생성
   *   roomId: number,          — 배달 받을 방 ID ✱ 필수
   *   roomServiceDesc?: string — 요청사항/설명 (선택)
   * }} body — RoomServiceOrderCreateRequest
   * @returns {Promise<RoomServiceOrderResponse>}
   * RoomServiceOrderResponse: { orderId, parentOrderId, userId, roomId, roomNo,
   *                             totalPrice, orderSt, roomServiceDesc, createdAt, updatedAt }
   */
  createRoomServiceOrder: ({ orderId, roomId, roomServiceDesc } = {}) =>
    request('/room-services', {
      method: 'POST',
      // totalPrice 제거 — 백엔드가 parentOrder에서 자동 복사
      body: { orderId, roomId, roomServiceDesc },
      auth: true,
    }),

  /**
   * 내 룸서비스 주문 목록 조회
   * @returns {Promise<RoomServiceOrderResponse[]>}
   */
  getMyRoomServiceOrders: () => request('/room-services/me', { auth: true }),

  /**
   * 룸서비스 주문 취소
   * @param {number} orderId
   * @returns {Promise<RoomServiceOrderResponse>}
   */
  cancelRoomServiceOrder: (orderId) =>
    request(`/room-services/${orderId}/cancel`, { method: 'PATCH', auth: true }),
};
