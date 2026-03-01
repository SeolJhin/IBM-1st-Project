// features/commerce/api/roomServiceApi.js
// 猷몄꽌鍮꾩뒪 二쇰Ц(RoomServiceOrder) ?대떦
// Order???먯떇 媛쒕뀗 ??二쇰Ц???곹뭹???대뒓 諛⑹쑝濡?諛곕떖?좎? 吏??//
// ??totalPrice ?먮룞 泥섎━:
//   諛깆뿏??RoomServiceOrderServiceImpl?먯꽌 parentOrder.getTotalPrice()瑜??먮룞?쇰줈 蹂듭궗.
//   ?꾨줎?몄뿉??totalPrice瑜??꾩넚?섏? ?딆븘????
//
// [?붾뱶?ъ씤??紐⑸줉]
// POST  /room-services                   ??猷몄꽌鍮꾩뒪 二쇰Ц ?앹꽦
//                                          { orderId?, roomId, roomServiceDesc? }
// GET   /room-services/me                ????猷몄꽌鍮꾩뒪 二쇰Ц 紐⑸줉
// PATCH /room-services/{orderId}/cancel  ??猷몄꽌鍮꾩뒪 二쇰Ц 痍⑥냼

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

export const roomServiceApi = {
  /**
   * 猷몄꽌鍮꾩뒪 二쇰Ц ?앹꽦
   *
   * ??totalPrice ?먮룞 泥섎━:
   *   諛깆뿏?쒓? orderId濡?parentOrder瑜?議고쉶??totalPrice瑜??먮룞?쇰줈 蹂듭궗??
   *   ?꾨줎?몄뿉??totalPrice瑜??섍만 ?꾩슂 ?놁쓬.
   *
   * @param {{
   *   orderId?: number,         ??遺紐?Order ID (?좏깮, null 媛??
   *                               null?대㈃ 諛깆뿏?쒓? 鍮?Order瑜??먮룞 ?앹꽦
   *   roomId: number,           ??諛곕떖 諛쏆쓣 諛?ID ???꾩닔
   *   roomServiceDesc?: string  ???붿껌?ы빆 (?좏깮)
   * }} body ??RoomServiceOrderCreateRequest
   * @returns {Promise<RoomServiceOrderResponse>}
   * RoomServiceOrderResponse: { orderId, parentOrderId, userId, roomId, roomNo,
   *                             totalPrice, orderSt, roomServiceDesc, createdAt, updatedAt }
   */
  createRoomServiceOrder: ({ orderId, roomId, roomServiceDesc } = {}) =>
    request('/room-services', {
      method: 'POST',
      // totalPrice ?쒓굅 ??諛깆뿏???쒕퉬?ㅼ뿉??parentOrder.getTotalPrice() ?먮룞 蹂듭궗
      body: { orderId, roomId, roomServiceDesc },
      auth: true,
    }),

  /**
   * ??猷몄꽌鍮꾩뒪 二쇰Ц 紐⑸줉 議고쉶
   * ??GET /orders/me ??roomServiceOrders[] ? ?숈씪???곗씠??   *   ??猷몄꽌鍮꾩뒪留??곕줈 蹂????ъ슜
   * @returns {Promise<RoomServiceOrderResponse[]>}
   */
  getMyRoomServiceOrders: () =>
    request('/room-services/me', { auth: true }),

  /**
   * 猷몄꽌鍮꾩뒪 二쇰Ц 痍⑥냼
   * @param {number} orderId
   * @returns {Promise<RoomServiceOrderResponse>}
   */
  cancelRoomServiceOrder: (orderId) =>
    request(`/room-services/${orderId}/cancel`, { method: 'PATCH', auth: true }),
};

