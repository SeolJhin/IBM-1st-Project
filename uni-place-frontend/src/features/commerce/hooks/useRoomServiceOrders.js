// features/commerce/hooks/useRoomServiceOrders.js
// 룸서비스 주문 목록 조회 + 생성 + 취소
// 인증 필요 (로그인 상태에서만 호출)
//
// ✅ totalPrice 자동 처리:
//   백엔드가 orderId → parentOrder.totalPrice를 자동으로 복사.
//   createOrder() 호출 시 totalPrice를 넘기지 않아도 됨.
//
// [사용 예시]
// const { orders, loading, error, refetch } = useRoomServiceOrders();
//
// [생성]
// const { createOrder, loading, error } = useRoomServiceOrderCreate();
// await createOrder({ orderId: 1, roomId: 2, roomServiceDesc: '문 앞에 놓아주세요' });
//
// [취소]
// const { cancel, loading, error } = useRoomServiceOrderCancel();
// await cancel(orderId);

import { useCallback, useEffect, useState } from 'react';
import { roomServiceApi } from '../api/roomServiceApi';

// ─── 내 룸서비스 주문 목록 훅 ─────────────────────────────────────────────────
// GET /room-services/me
// ※ GET /orders/me 의 roomServiceOrders[] 와 동일한 데이터
//   → 룸서비스 현황만 따로 볼 때 사용 (마이페이지 룸서비스 탭 등)
export function useRoomServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // RoomServiceOrderResponse[] 형태로 반환
      // { orderId, parentOrderId, userId, roomId, roomNo,
      //   totalPrice, orderSt, roomServiceDesc, createdAt, updatedAt }
      const data = await roomServiceApi.getMyRoomServiceOrders();
      setOrders(data ?? []);
    } catch (err) {
      setError(err?.message || '룸서비스 주문 목록을 불러오는 데 실패했습니다.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,  // RoomServiceOrderResponse[]
    loading,
    error,
    refetch: fetchOrders,
  };
}

// ─── 룸서비스 주문 생성 훅 ────────────────────────────────────────────────────
// POST /room-services
export function useRoomServiceOrderCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * ✅ totalPrice 불필요 — 백엔드가 parentOrder에서 자동 복사
   *
   * @param {{
   *   orderId?: number,         — 부모 Order ID (선택, null 가능)
   *   roomId: number,           — 배달 받을 방 ID ✱ 필수
   *   roomServiceDesc?: string  — 요청사항 (선택)
   * }} body
   * @returns {Promise<RoomServiceOrderResponse>}
   */
  const createOrder = useCallback(async ({ orderId, roomId, roomServiceDesc } = {}) => {
    setLoading(true);
    setError(null);
    try {
      // totalPrice 제거 — roomServiceApi 내부에서 이미 제외됨
      const data = await roomServiceApi.createRoomServiceOrder({
        orderId,
        roomId,
        roomServiceDesc,
      });
      return data;
    } catch (err) {
      setError(err?.message || '룸서비스 주문 생성에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createOrder,
    loading,
    error,
  };
}

// ─── 룸서비스 주문 취소 훅 ────────────────────────────────────────────────────
// PATCH /room-services/{orderId}/cancel
export function useRoomServiceOrderCancel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cancel = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await roomServiceApi.cancelRoomServiceOrder(orderId);
      return data;
    } catch (err) {
      setError(err?.message || '룸서비스 주문 취소에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cancel,
    loading,
    error,
  };
}
