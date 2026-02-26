// features/commerce/hooks/useOrders.js
// 주문 목록 조회 + 상세 조회 + 생성 + 취소
// 인증 필요 (로그인 상태에서만 호출)
//
// [목록 사용 예시]
// const { orders, loading, error, refetch } = useOrders();
//
// [상세 사용 예시]
// const { order, loading, error, cancel, refetch } = useOrder(orderId);
//
// [주문 생성]
// const { createOrder, loading, error } = useOrderCreate();
// await createOrder({ ... });

import { useCallback, useEffect, useState } from 'react';
import { commerceApi } from '../api/commerceApi';

// ─── 내 주문 목록 훅 ──────────────────────────────────────────────────────────
// GET /orders/me
export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // OrderResponse[] 형태로 반환
      // OrderResponse: { orderId, userId, orderSt, totalPrice, paymentId, orderCreatedAt,
      //                  orderItems[], roomServiceOrders[] }
      // OrderItemResponse: { orderItemId, prodId, prodNm, orderQuantity, orderPrice }
      const data = await commerceApi.getMyOrders();
      setOrders(data ?? []);
    } catch (err) {
      setError(err?.message || '주문 목록을 불러오는 데 실패했습니다.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,  // OrderResponse[]
    loading,
    error,
    refetch: fetchOrders,
  };
}

// ─── 주문 상세 훅 ─────────────────────────────────────────────────────────────
// GET /orders/{orderId}
// PATCH /orders/{orderId}/cancel
/**
 * @param {number | null} orderId - null이면 호출 안 함
 */
export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await commerceApi.getOrder(id);
      setOrder(data ?? null);
    } catch (err) {
      setError(err?.message || '주문 정보를 불러오는 데 실패했습니다.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;
    fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  // ─── 주문 취소 ───────────────────────────────────────────────────────────
  const cancel = useCallback(async () => {
    if (!orderId) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const updated = await commerceApi.cancelOrder(orderId);
      if (updated) setOrder(updated); // 취소 후 최신 상태로 업데이트
      return updated;
    } catch (err) {
      setCancelError(err?.message || '주문 취소에 실패했습니다.');
      throw err;
    } finally {
      setCancelLoading(false);
    }
  }, [orderId]);

  const refetch = useCallback(() => {
    if (!orderId) return;
    fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  return {
    order,         // OrderResponse | null
    loading,
    error,
    cancelLoading, // 취소 요청 중 로딩
    cancelError,   // 취소 에러
    cancel,        // cancel() — 주문 취소 실행
    refetch,
  };
}

// ─── 주문 생성 훅 ─────────────────────────────────────────────────────────────
// POST /orders
export function useOrderCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // OrderCreateRequest 필드는 백엔드 확인 후 채울 것
  const createOrder = useCallback(async (body) => {
    setLoading(true);
    setError(null);
    try {
      const data = await commerceApi.createOrder(body);
      return data; // OrderResponse 반환
    } catch (err) {
      setError(err?.message || '주문 생성에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createOrder, // createOrder(body) → OrderResponse
    loading,
    error,
  };
}
