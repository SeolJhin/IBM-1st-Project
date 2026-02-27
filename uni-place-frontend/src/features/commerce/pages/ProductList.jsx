// src/features/commerce/pages/ProductList.jsx

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import styles from './ProductList.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'kitchen', label: '주방' },
  { key: 'bathroom', label: '욕실' },
  { key: 'etc', label: '기타' },
];

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

// ── 상품 카드 ─────────────────────────────────────────────────────────────────
function ProductCard({ product, qty, onInc, onDec, disabled }) {
  return (
    <div className={`${styles.card} ${qty > 0 ? styles.cardActive : ''}`}>
      {qty > 0 && <div className={styles.cardBadge}>{qty}</div>}

      <div className={styles.cardImg}>
        <span className={styles.cardImgLabel}>품목사진</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardName}>{product.prodNm}</span>
          <span className={styles.cardPrice}>{fmt(product.prodPrice)}원</span>
        </div>
        {product.prodDesc && (
          <p className={styles.cardDesc}>{product.prodDesc}</p>
        )}

        {/* 수량 컨트롤 */}
        <div className={styles.qtyRow}>
          {qty === 0 ? (
            <button
              className={styles.addBtn}
              onClick={() => onInc(product)}
              disabled={disabled}
            >
              + 담기
            </button>
          ) : (
            <div className={styles.qtyControl}>
              <button
                className={styles.qtyBtn}
                onClick={() => onDec(product)}
                disabled={disabled}
                aria-label="수량 감소"
              >
                −
              </button>
              <span className={styles.qtyNum}>{qty}</span>
              <button
                className={styles.qtyBtn}
                onClick={() => onInc(product)}
                disabled={disabled}
                aria-label="수량 증가"
              >
                +
              </button>
              <span className={styles.qtyPrice}>
                {fmt(product.prodPrice * qty)}원
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function ProductList() {
  const navigate = useNavigate();
  const location = useLocation();

  const { products, loading: prodLoading, error: prodError } = useProducts();
  const { cart, addItem, updateItem, removeItem, actionLoading } = useCart();

  const [activeTab, setActiveTab] = useState('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter(
      (p) => String(p.code ?? '').toLowerCase() === activeTab
    );
  }, [products, activeTab]);

  // prodId → cartItem
  const cartMap = useMemo(() => {
    const m = {};
    (cart?.items ?? []).forEach((i) => {
      m[i.prodId] = i;
    });
    return m;
  }, [cart]);

  const handleInc = async (product) => {
    try {
      const ci = cartMap[product.prodId];
      if (ci)
        await updateItem(ci.cartItemId, { quantity: ci.orderQuantity + 1 });
      else await addItem({ prodId: product.prodId, quantity: 1 });
    } catch (e) {
      alert(e.message || '오류가 발생했습니다.');
    }
  };

  const handleDec = async (product) => {
    try {
      const ci = cartMap[product.prodId];
      if (!ci) return;
      if (ci.orderQuantity <= 1) await removeItem(ci.cartItemId);
      else await updateItem(ci.cartItemId, { quantity: ci.orderQuantity - 1 });
    } catch (e) {
      alert(e.message || '오류가 발생했습니다.');
    }
  };

  const cartItems = cart?.items ?? [];
  const totalQty = cart?.totalQuantity ?? 0;
  const totalAmt = cart?.totalAmount ?? 0;

  const summaryText = useMemo(() => {
    if (!cartItems.length) return null;
    const preview = cartItems
      .slice(0, 2)
      .map((i) => `${i.prodNm} ×${i.orderQuantity}`)
      .join('  ·  ');
    return cartItems.length > 2 ? preview + '  ·  …' : preview;
  }, [cartItems]);

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
            {/* 상단 탭 */}
            <div className={styles.topTabs}>
              <button className={`${styles.topTab} ${styles.topTabActive}`}>
                주문
              </button>
              <button
                className={styles.topTab}
                onClick={() => navigate('/commerce/orders')}
              >
                주문 내역
              </button>
            </div>

            <div className={styles.panel}>
              {/* 카테고리 탭 */}
              <div className={styles.catTabs}>
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    className={`${styles.catTab} ${activeTab === t.key ? styles.catTabActive : ''}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 상품 목록 */}
              <div className={styles.list}>
                {prodLoading && (
                  <div className={styles.center}>
                    <span className={styles.spin} />
                  </div>
                )}
                {prodError && <p className={styles.errMsg}>{prodError}</p>}
                {!prodLoading && !prodError && filtered.length === 0 && (
                  <p className={styles.emptyMsg}>상품이 없습니다.</p>
                )}
                {filtered.map((p) => (
                  <ProductCard
                    key={p.prodId}
                    product={p}
                    qty={cartMap[p.prodId]?.orderQuantity ?? 0}
                    onInc={handleInc}
                    onDec={handleDec}
                    disabled={actionLoading}
                  />
                ))}
              </div>

              {/* 하단 바 */}
              <div className={styles.bottomBar}>
                <div className={styles.barSummary}>
                  {summaryText ? (
                    <>
                      <span className={styles.barText}>{summaryText}</span>
                      <span className={styles.barTotal}>{fmt(totalAmt)}원</span>
                    </>
                  ) : (
                    <span className={styles.barEmpty}>
                      장바구니가 비어 있습니다
                    </span>
                  )}
                </div>
                <button
                  className={styles.goCartBtn}
                  onClick={() => {
                    if (!cartItems.length) {
                      alert('장바구니가 비어 있습니다.');
                      return;
                    }
                    navigate('/commerce/cart');
                  }}
                  disabled={!cartItems.length || actionLoading}
                >
                  장바구니 보기
                  {totalQty > 0 && (
                    <span className={styles.badge}>{totalQty}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
