// src/features/admin/hooks/useAdminRoomServiceOrders.js
//
// 관리자 룸서비스 주문 관리 훅
// 백엔드: AdminRoomServiceOrderController (/admin/room-services)
//
// ── 엔드포인트 ────────────────────────────────────────────────────────────────
// GET   /admin/room-services              → 전체 룸서비스 주문 목록 (Page, sort: createdAt)
// PATCH /admin/room-services/{id}/status  → 주문 상태 변경
//                                           body: RoomServiceOrderStatusRequest = { status }
//
// ── 응답 구조 ─────────────────────────────────────────────────────────────────
// RoomServiceOrderResponse:
//   orderId: number
//   parentOrderId: number | null   — 부모 Order ID
//   userId: number
//   roomId: number
//   roomNo: string                 — 방 호실 번호
//   totalPrice: number
//   orderSt: string                — 주문 상태
//   roomServiceDesc: string | null — 요청사항
//   createdAt: string              — ISO 날짜 문자열
//   updatedAt: string              — ISO 날짜 문자열
//
// ── 주문 상태 (orderSt) ────────────────────────────────────────────────────────
// RoomServiceOrderStatusRequest.status 값은 백엔드 enum 확인 필요
// 일반적으로: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
//
// ── 페이지네이션 ──────────────────────────────────────────────────────────────
// Spring Pageable: page는 0-base (첫 페이지 = 0)
// 훅 내부에서 1-base로 변환해서 노출
//
// [사용 예시]
// const { orders, pagination, loading, error, goToPage, refetch } = useAdminRoomServiceOrders();
// goToPage(2) // 2페이지로 이동 (1-base)
//
// [상태 변경]
// const { updateStatus, loading, error } = useAdminRoomServiceOrderStatus();
// await updateStatus(orderId, { status: 'DELIVERED' });

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';

// ─── 관리자 전체 룸서비스 주문 목록 훅 ───────────────────────────────────────
export function useAdminRoomServiceOrders({
  initialPage = 1, // 1-base
  size = 20,
  sort = 'createdAt',
} = {}) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: initialPage, // 1-base
    size,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {number} page — 1-base 페이지 번호
   */
  const fetchOrders = useCallback(
    async (page = initialPage) => {
      setLoading(true);
      setError(null);
      try {
        // API 호출은 0-base
        // 반환: Page<RoomServiceOrderResponse>
        //   { content, totalElements, totalPages, number (0-base), size }
        const data = await adminApi.getAllRoomServiceOrders({
          page: page - 1, // 0-base 변환
          size,
          sort,
        });

        setOrders(data?.content ?? []);
        setPagination({
          currentPage: (data?.number ?? 0) + 1, // 0-base → 1-base
          size: data?.size ?? size,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
        });
      } catch (err) {
        setError(err?.message || '룸서비스 주문 목록을 불러오는 데 실패했습니다.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [initialPage, size, sort]
  );

  useEffect(() => {
    fetchOrders(initialPage);
  }, [fetchOrders, initialPage]);

  /**
   * 특정 페이지로 이동 (1-base)
   * @param {number} page
   */
  const goToPage = useCallback(
    (page) => {
      fetchOrders(page);
    },
    [fetchOrders]
  );

  const refetch = useCallback(
    () => fetchOrders(pagination.currentPage),
    [fetchOrders, pagination.currentPage]
  );

  return {
    orders,     // RoomServiceOrderResponse[]
    pagination, // { currentPage(1-base), size, totalElements, totalPages }
    loading,
    error,
    goToPage,   // goToPage(page: number) — 1-base
    refetch,
  };
}

// ─── 룸서비스 주문 상태 변경 훅 ──────────────────────────────────────────────
// PATCH /admin/room-services/{id}/status
export function useAdminRoomServiceOrderStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {number} orderId
   * @param {{ status: string }} body — RoomServiceOrderStatusRequest
   *   status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED' (백엔드 enum 확인)
   * @returns {Promise<RoomServiceOrderResponse>}
   */
  const updateStatus = useCallback(async (orderId, body) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.updateRoomServiceOrderStatus(orderId, body);
      return data;
    } catch (err) {
      setError(err?.message || '주문 상태 변경에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateStatus, // updateStatus(orderId, { status }) → RoomServiceOrderResponse
    loading,
    error,
  };
}
