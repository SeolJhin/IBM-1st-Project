// src/features/admin/hooks/useAdminOrders.js
//
// 관리자 주문 관리 훅
// 백엔드: AdminOrderController (/admin/orders)
//
// ── 엔드포인트 ────────────────────────────────────────────────────────────────
// GET /admin/orders   → 전체 주문 목록 (Page<OrderResponse>, sort: orderCreatedAt)
//
// ※ 주문 상세/취소는 AdminOrderController에 없음
//   → 현재 프론트는 GET /admin/orders 결과에서 orderId로 상세를 조회
//
// ── 응답 구조 ─────────────────────────────────────────────────────────────────
// Page<OrderResponse> (Spring Page — 0-base):
//   content: OrderResponse[]
//   totalElements: number
//   totalPages: number
//   number: number      (0-base 현재 페이지)
//   size: number
//
// OrderResponse:
//   orderId: number
//   userId: number
//   orderSt: string          — 주문 상태
//   totalPrice: number
//   paymentId: number | null
//   orderCreatedAt: string   — ISO 날짜 문자열
//   orderItems: OrderItemResponse[]
//   roomServiceOrders: RoomServiceOrderResponse[]
//
// OrderItemResponse:
//   orderItemId: number
//   prodId: number
//   prodNm: string
//   orderQuantity: number
//   orderPrice: number
//
// ── 페이지네이션 ──────────────────────────────────────────────────────────────
// Spring Pageable: page는 0-base (첫 페이지 = 0)
// 훅 내부에서 1-base로 변환해서 노출
//   currentPage (1-base) → API 호출 시 page = currentPage - 1 (0-base)
//
// [사용 예시]
// const { orders, pagination, loading, error, goToPage, refetch } = useAdminOrders();
// goToPage(2) // 2페이지로 이동 (1-base)

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';

// ─── 관리자 전체 주문 목록 훅 ─────────────────────────────────────────────────
export function useAdminOrders({
  initialPage = 1, // 1-base
  size = 20,
  sort = 'orderCreatedAt',
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
        // 반환: Page<OrderResponse>
        //   { content, totalElements, totalPages, number (0-base), size }
        const data = await adminApi.getAllOrders({
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
        setError(err?.message || '주문 목록을 불러오는 데 실패했습니다.');
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
    orders,     // OrderResponse[]
    pagination, // { currentPage(1-base), size, totalElements, totalPages }
    loading,
    error,
    goToPage,   // goToPage(page: number) — 1-base
    refetch,
  };
}
