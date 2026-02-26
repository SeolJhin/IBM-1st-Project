// features/commerce/api/roomServiceApi.js
// 룸서비스 주문(RoomServiceOrder) 담당
// Order의 자식 개념 — 주문한 상품을 어느 방으로 배달할지 지정
//
// ✅ totalPrice 자동 처리:
//   백엔드 RoomServiceOrderServiceImpl에서 parentOrder.getTotalPrice()를 자동으로 복사.
//   프론트에서 totalPrice를 전송하지 않아도 됨.
//
// [엔드포인트 목록]
// POST  /room-services                   → 룸서비스 주문 생성
//                                          { orderId?, roomId, roomServiceDesc? }
// GET   /room-services/me                → 내 룸서비스 주문 목록
// PATCH /room-services/{orderId}/cancel  → 룸서비스 주문 취소

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

export const roomServiceApi = {
  /**
   * 룸서비스 주문 생성
   *
   * ✅ totalPrice 자동 처리:
   *   백엔드가 orderId로 parentOrder를 조회해 totalPrice를 자동으로 복사함.
   *   프론트에서 totalPrice를 넘길 필요 없음.
   *
   * @param {{
   *   orderId?: number,         — 부모 Order ID (선택, null 가능)
   *                               null이면 백엔드가 빈 Order를 자동 생성
   *   roomId: number,           — 배달 받을 방 ID ✱ 필수
   *   roomServiceDesc?: string  — 요청사항 (선택)
   * }} body — RoomServiceOrderCreateRequest
   * @returns {Promise<RoomServiceOrderResponse>}
   * RoomServiceOrderResponse: { orderId, parentOrderId, userId, roomId, roomNo,
   *                             totalPrice, orderSt, roomServiceDesc, createdAt, updatedAt }
   */
  createRoomServiceOrder: ({ orderId, roomId, roomServiceDesc } = {}) =>
    request('/room-services', {
      method: 'POST',
      // totalPrice 제거 — 백엔드 서비스에서 parentOrder.getTotalPrice() 자동 복사
      body: { orderId, roomId, roomServiceDesc },
      auth: true,
    }),

  /**
   * 내 룸서비스 주문 목록 조회
   * ※ GET /orders/me 의 roomServiceOrders[] 와 동일한 데이터
   *   → 룸서비스만 따로 볼 때 사용
   * @returns {Promise<RoomServiceOrderResponse[]>}
   */
  getMyRoomServiceOrders: () =>
    request('/room-services/me', { auth: true }),

  /**
   * 룸서비스 주문 취소
   * @param {number} orderId
   * @returns {Promise<RoomServiceOrderResponse>}
   */
  cancelRoomServiceOrder: (orderId) =>
    request(`/room-services/${orderId}/cancel`, { method: 'PATCH', auth: true }),
};
