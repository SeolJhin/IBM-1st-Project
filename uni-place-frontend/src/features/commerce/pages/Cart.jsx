// src/features/commerce/pages/Cart.jsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useCart } from '../hooks/useCart';
import ConfirmModal from './components/ConfirmModal';
import styles from './Cart.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';

const SIDE_MENUS = [
  { label: '내 정보', path: '/me' },
  { label: '마이룸', path: '/myroom' },
  { label: '작성 목록', path: '/my/posts' },
  { label: '공용 시설', path: '/facilities' },
  { label: '사전 방문', path: '/tour' },
  { label: '룸서비스', path: '/commerce/room-service' },
];

function fmt(price) {
  return price == null ? '0' : Number(price).toLocaleString('ko-KR');
}

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cart, loading, error, actionLoading, updateItem, removeItem, clear } =
    useCart();
  const items = cart?.items ?? [];

  // 확인 모달 상태
  const [modal, setModal] = useState(null); // { title, desc, onConfirm }

  // 수량 변경
  const handleQty = (item, delta) => {
    const next = item.orderQuantity + delta;
    if (next < 1) {
      // 수량이 0 이하 → 제거 확인
      setModal({
        title: '상품 제거',
        desc: `"${item.prodNm}"을(를) 장바구니에서 제거할까요?`,
        onConfirm: async () => {
          await removeItem(item.cartItemId);
        },
      });
      return;
    }
    updateItem(item.cartItemId, { quantity: next }).catch((e) =>
      alert(e.message)
    );
  };

  // 개별 삭제
  const handleRemove = (item) => {
    setModal({
      title: '상품 제거',
      desc: `"${item.prodNm}"을(를) 장바구니에서 제거할까요?`,
      onConfirm: async () => {
        await removeItem(item.cartItemId);
      },
    });
  };

  // 전체 비우기
  const handleClear = () => {
    setModal({
      title: '장바구니 비우기',
      desc: '담아두신 상품을 모두 제거할까요?',
      onConfirm: async () => {
        await clear();
      },
    });
  };

  const isActive = (p) => location.pathname === p;

  return (
    <div className={layoutStyles.page}>
      <Header />
      <main className={layoutStyles.container}>
        {/* 사이드 메뉴 */}
        <aside className={layoutStyles.side}>
          <div className={layoutStyles.sideBox}>
            {SIDE_MENUS.map((m) => (
              <button
                key={m.path}
                className={`${layoutStyles.sideItem} ${isActive(m.path) ? layoutStyles.sideItemActive : ''}`}
                onClick={() => navigate(m.path)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </aside>

        {/* 콘텐츠 */}
        <section className={layoutStyles.content}>
          <div className={layoutStyles.card}>
            {/* 헤더 */}
            <div className={styles.header}>
              <button
                className={styles.backBtn}
                onClick={() => navigate('/commerce/room-service')}
              >
                ← 상품 목록
              </button>
              <h1 className={styles.title}>장바구니</h1>
              {items.length > 0 && (
                <button
                  className={styles.clearBtn}
                  onClick={handleClear}
                  disabled={actionLoading}
                >
                  전체 비우기
                </button>
              )}
            </div>

            {loading && (
              <div className={styles.center}>
                <span className={styles.spin} />
              </div>
            )}
            {error && <p className={styles.errMsg}>{error}</p>}

            {/* 빈 상태 */}
            {!loading && items.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🛒</div>
                <p className={styles.emptyText}>장바구니가 비어 있어요</p>
                <button
                  className={styles.goShopBtn}
                  onClick={() => navigate('/commerce/room-service')}
                >
                  상품 담으러 가기
                </button>
              </div>
            )}

            {items.length > 0 && (
              <>
                {/* 아이템 목록 */}
                <div className={styles.list}>
                  {items.map((item) => (
                    <div key={item.cartItemId} className={styles.item}>
                      {/* 이름 + 단가 */}
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.prodNm}</span>
                        <span className={styles.itemUnit}>
                          {fmt(item.orderPrice)}원 / 개
                        </span>
                      </div>

                      {/* 수량 증감 */}
                      <div className={styles.qtyWrap}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => handleQty(item, -1)}
                          disabled={actionLoading}
                          aria-label="수량 감소"
                        >
                          −
                        </button>
                        <span className={styles.qtyNum}>
                          {item.orderQuantity}
                        </span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => handleQty(item, +1)}
                          disabled={actionLoading}
                          aria-label="수량 증가"
                        >
                          +
                        </button>
                      </div>

                      {/* 소계 */}
                      <span className={styles.itemTotal}>
                        {fmt(item.lineTotal)}원
                      </span>

                      {/* 삭제 */}
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemove(item)}
                        disabled={actionLoading}
                        aria-label={`${item.prodNm} 삭제`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* 합계 박스 */}
                <div className={styles.totalBox}>
                  <span className={styles.totalLabel}>
                    총 {cart?.totalQuantity ?? 0}개
                  </span>
                  <span className={styles.totalAmt}>
                    {fmt(cart?.totalAmount ?? 0)}원
                  </span>
                </div>

                {/* 주문 진행 버튼 */}
                <button
                  className={styles.nextBtn}
                  onClick={() => navigate('/commerce/checkout')}
                  disabled={actionLoading}
                >
                  주문 정보 입력 →
                </button>
              </>
            )}
          </div>
        </section>
      </main>

      {/* 확인 모달 */}
      {modal && (
        <ConfirmModal
          title={modal.title}
          desc={modal.desc}
          onConfirm={async () => {
            await modal.onConfirm();
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
