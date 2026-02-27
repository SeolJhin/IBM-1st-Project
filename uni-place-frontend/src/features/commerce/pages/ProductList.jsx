// src/features/commerce/pages/ProductList.jsx
// 룸서비스 주문 페이지
// 디자인 참고: 탭(전체/주방/욕실/기타) + 상품목록 + 하단 장바구니 요약 + 주문하기

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import styles from './ProductList.module.css';

// ── 카테고리 탭 (Product.code 필드 기준) ─────────────────────────────────────
// 백엔드 Product.code 는 카테고리 역할 (kitchen / bathroom / etc)
const TABS = [
  { key: 'all', label: '전체' },
  { key: 'kitchen', label: '주방' },
  { key: 'bathroom', label: '욕실' },
  { key: 'etc', label: '기타' },
];

function formatPrice(price) {
  if (price == null) return '0';
  return Number(price).toLocaleString('ko-KR');
}

// ── 상품 카드 (B-1) ───────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, adding }) {
  return (
    <div className={styles.card}>
      {/* 품목 사진 */}
      <div className={styles.cardImg}>
        <span className={styles.cardImgText}>품목사진</span>
      </div>

      {/* 상품 정보 */}
      <div className={styles.cardBody}>
        <div className={styles.cardRow}>
          <span className={styles.cardName}>{product.prodNm}</span>
          <span className={styles.cardPrice}>
            {formatPrice(product.prodPrice)}원
          </span>
        </div>
        <p className={styles.cardDesc}>{product.prodDesc || '-'}</p>
        {/* C-1: 추가 버튼 */}
        <button
          className={styles.addBtn}
          type="button"
          disabled={adding}
          onClick={() => onAdd(product)}
        >
          추가
        </button>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export default function ProductList() {
  const navigate = useNavigate();
  const { products, loading: prodLoading, error: prodError } = useProducts();
  const { cart, addItem, actionLoading } = useCart();

  const [activeTab, setActiveTab] = useState('all'); // 카테고리 탭
  const [topTab, setTopTab] = useState('order'); // 주문 / 주문내역

  // 탭 필터 (code 필드 소문자 매칭)
  const filtered = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter(
      (p) => String(p.code ?? '').toLowerCase() === activeTab
    );
  }, [products, activeTab]);

  // D-1: 하단 장바구니 요약
  const cartItems = cart?.items ?? [];
  const cartSummaryText = useMemo(() => {
    if (cartItems.length === 0) return null;
    const preview = cartItems
      .slice(0, 2)
      .map(
        (i) =>
          `${i.prodNm} ${formatPrice(i.orderPrice)}원 (${i.orderQuantity}개)`
      )
      .join(' , ');
    return cartItems.length > 2 ? preview + ' , ...' : preview;
  }, [cartItems]);

  const totalAmount = cart?.totalAmount ?? 0;

  // 상품 추가
  const handleAdd = async (product) => {
    try {
      await addItem({ prodId: product.prodId, quantity: 1 });
    } catch (e) {
      alert(e.message || '추가에 실패했습니다.');
    }
  };

  // E-1: 주문하기 → 장바구니 페이지로 이동
  const handleOrder = () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어 있습니다.');
      return;
    }
    navigate('/commerce/cart');
  };

  return (
    <div className={styles.page}>
      {/* ── 상단 탭: 주문 / 주문내역 ── */}
      <div className={styles.topTabs}>
        <button
          className={`${styles.topTab} ${topTab === 'order' ? styles.topTabActive : ''}`}
          onClick={() => setTopTab('order')}
        >
          주문
        </button>
        <button
          className={`${styles.topTab} ${topTab === 'history' ? styles.topTabActive : ''}`}
          onClick={() => navigate('/commerce/orders')}
        >
          주문 내역
        </button>
      </div>

      {/* ── 주문 패널 (점선 박스) ── */}
      <div className={styles.panel}>
        {/* A-1: 카테고리 탭 */}
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

        {/* B-1: 상품 목록 */}
        <div className={styles.list}>
          {prodLoading && (
            <div className={styles.center}>
              <span className={styles.spinner} />
            </div>
          )}
          {prodError && <p className={styles.errMsg}>{prodError}</p>}
          {!prodLoading && !prodError && filtered.length === 0 && (
            <p className={styles.emptyMsg}>등록된 상품이 없습니다.</p>
          )}
          {filtered.map((p) => (
            <ProductCard
              key={p.prodId}
              product={p}
              onAdd={handleAdd}
              adding={actionLoading}
            />
          ))}
        </div>

        {/* C-1 + D-1 + E-1: 하단 요약 + 주문하기 버튼 */}
        <div className={styles.bottom}>
          <div className={styles.cartSummary}>
            {cartSummaryText ? (
              <>
                <span className={styles.summaryText}>{cartSummaryText}</span>
                <span className={styles.summaryTotal}>
                  총 {formatPrice(totalAmount)}원
                </span>
              </>
            ) : (
              <span className={styles.summaryEmpty}>
                장바구니가 비어 있습니다
              </span>
            )}
          </div>
          {/* E-1 */}
          <button
            className={styles.orderBtn}
            type="button"
            onClick={handleOrder}
            disabled={cartItems.length === 0 || actionLoading}
          >
            주문하기
          </button>
        </div>
      </div>
    </div>
  );
}
