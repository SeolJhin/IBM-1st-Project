// features/commerce/hooks/useCart.js
// 장바구니 조회 + 추가 / 수량변경 / 삭제 / 전체비우기
// 인증 필요 (로그인 상태에서만 호출)
//
// [사용 예시]
// const { cart, loading, error, addItem, updateItem, removeItem, clearCart, refetch } = useCart();
//
// [상품 추가]
// await addItem({ prodId: 1, quantity: 2 });
//
// [수량 변경]
// await updateItem(cartItemId, { quantity: 3 });
//
// [아이템 삭제]
// await removeItem(cartItemId);
//
// [전체 비우기]
// await clearCart();

import { useCallback, useEffect, useState } from 'react';
import { commerceApi } from '../api/commerceApi';

export function useCart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // 개별 액션(추가/수정/삭제) 중 로딩 상태 (버튼 disabled용)
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // ─── 장바구니 조회 ─────────────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // CartResponse: { cartId, userId, items[], totalAmount, totalQuantity }
      // CartItemResponse: { cartItemId, prodId, prodNm, orderPrice, orderQuantity, lineTotal, thumbnailPath }
      const data = await commerceApi.getCart();
      setCart(data ?? null);
    } catch (err) {
      setError(err?.message || '장바구니를 불러오는 데 실패했습니다.');
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ─── 공통 액션 래퍼 (성공 시 cart 상태 자동 업데이트) ─────────────────────
  const runAction = useCallback(async (apiFn) => {
    setActionLoading(true);
    setActionError(null);
    try {
      // Cart 관련 API는 성공 시 최신 CartResponse를 반환함
      const updated = await apiFn();
      if (updated) setCart(updated);
      return updated;
    } catch (err) {
      setActionError(err?.message || '요청에 실패했습니다.');
      throw err; // 필요 시 호출부에서 catch 가능
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ─── 상품 추가 ─────────────────────────────────────────────────────────────
  // CartAddRequest: { prodId, quantity }
  const addItem = useCallback(
    ({ prodId, quantity }) =>
      runAction(() => commerceApi.addCartItem({ prodId, quantity })),
    [runAction]
  );

  // ─── 수량 변경 ─────────────────────────────────────────────────────────────
  // CartQuantityUpdateRequest: { quantity }
  const updateItem = useCallback(
    (cartItemId, { quantity }) =>
      runAction(() => commerceApi.updateCartItem(cartItemId, { quantity })),
    [runAction]
  );

  // ─── 아이템 삭제 ───────────────────────────────────────────────────────────
  const removeItem = useCallback(
    (cartItemId) =>
      runAction(() => commerceApi.removeCartItem(cartItemId)),
    [runAction]
  );

  // ─── 전체 비우기 ───────────────────────────────────────────────────────────
  // 204 No Content 반환 → cart를 빈 상태로 초기화
  const clear = useCallback(async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await commerceApi.clearCart();
      setCart((prev) =>
        prev ? { ...prev, items: [], totalAmount: 0, totalQuantity: 0 } : null
      );
    } catch (err) {
      setActionError(err?.message || '장바구니 비우기에 실패했습니다.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    cart,          // CartResponse | null
                   // { cartId, userId, items[], totalAmount, totalQuantity }
    loading,       // 최초 조회 로딩
    error,         // 최초 조회 에러
    actionLoading, // 추가/수정/삭제 중 로딩
    actionError,   // 추가/수정/삭제 에러
    addItem,       // addItem({ prodId, quantity })
    updateItem,    // updateItem(cartItemId, { quantity })
    removeItem,    // removeItem(cartItemId)
    clear,         // clear()
    refetch: fetchCart,
  };
}
