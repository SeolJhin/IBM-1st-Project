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
  { label: '공용 시설', path: '/reservations/space/list' },
  { label: '사전 방문', path: '/tour' },
  { label: '룸서비스', path: '/commerce/room-service' },
];

function fmt(price) {
  return price == null ? '0' : Number(price).toLocaleString('ko-KR');
}

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ ProductList 에서 넘어온 빌딩 정보
  const selectedBuildingId = location.state?.selectedBuildingId ?? null;
  const selectedBuildingNm = location.state?.selectedBuildingNm ?? '';

  const { cart, loading, error, actionLoading, updateItem, removeItem, clear } =
    useCart();
  const items = cart?.items ?? [];

  const [modal, setModal] = useState(null);

  const handleQty = (item, delta) => {
    const next = item.orderQuantity + delta;
    if (next < 1) {
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

  const handleRemove = (item) => {
    setModal({
      title: '상품 제거',
      desc: `"${item.prodNm}"을(를) 장바구니에서 제거할까요?`,
      onConfirm: async () => {
        await removeItem(item.cartItemId);
      },
    });
  };

  const handleClear = () => {
    setModal({
      title: '장바구니 비우기',
      desc: '담아두신 상품을 모두 제거할까요?',
      onConfirm: async () => {
        await clear();
      },
    });
  };

  // ✅ Checkout 으로 buildingId / buildingNm 전달
  const handleGoCheckout = () => {
    if (!selectedBuildingId) {
      alert('빌딩 정보가 없습니다. 상품 목록으로 돌아가 빌딩을 선택해주세요.');
      navigate('/commerce/room-service', { state: {} });
      return;
    }
    navigate('/commerce/checkout', {
      state: { selectedBuildingId, selectedBuildingNm },
    });
  };

  const isActive = (p) => location.pathname === p;

  return (
    <div className={layoutStyles.page}>
      <Header />
      <main className={layoutStyles.container}>
        <aside className={layoutStyles.side}>
          <div className={layoutStyles.sideBox}>
            {SIDE_MENUS.map((m) => (
              <button
                key={m.path}
                className={`${layoutStyles.sideItem} ${
                  isActive(m.path) ? layoutStyles.sideItemActive : ''
                }`}
                onClick={() => navigate(m.path)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </aside>

        <section className={layoutStyles.content}>
          <div className={layoutStyles.card}>
            {/* 헤더 */}
            <div className={styles.header}>
              <button
                className={styles.backBtn}
                onClick={() =>
                  navigate('/commerce/room-service', {
                    state: { selectedBuildingId, selectedBuildingNm },
                  })
                }
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

            {/* ✅ 선택된 빌딩 표시 */}
            {selectedBuildingNm && (
              <div className={styles.buildingBadge}>
                🏢 {selectedBuildingNm} 배달
              </div>
            )}

            {loading && (
              <div className={styles.center}>
                <span className={styles.spin} />
              </div>
            )}
            {error && <p className={styles.errMsg}>{error}</p>}

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
                <div className={styles.list}>
                  {items.map((item) => (
                    <div key={item.cartItemId} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.prodNm}</span>
                        <span className={styles.itemUnit}>
                          {fmt(item.orderPrice)}원 / 개
                        </span>
                      </div>
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
                      <span className={styles.itemTotal}>
                        {fmt(item.lineTotal)}원
                      </span>
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

                <div className={styles.totalBox}>
                  <span className={styles.totalLabel}>
                    총 {cart?.totalQuantity ?? 0}개
                  </span>
                  <span className={styles.totalAmt}>
                    {fmt(cart?.totalAmount ?? 0)}원
                  </span>
                </div>

                <button
                  className={styles.nextBtn}
                  onClick={handleGoCheckout}
                  disabled={actionLoading}
                >
                  주문 정보 입력 →
                </button>
              </>
            )}
          </div>
        </section>
      </main>

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
