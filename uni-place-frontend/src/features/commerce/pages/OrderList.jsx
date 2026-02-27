// src/features/commerce/pages/OrderList.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useOrders } from '../hooks/useOrders';
import styles from './OrderList.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';

const SIDE_MENUS = [
  { label: '내 정보', path: '/me' },
  { label: '마이룸', path: '/myroom' },
  { label: '작성 목록', path: '/my/posts' },
  { label: '공용 시설', path: '/reservations/space/list' },
  { label: '사전 방문', path: '/tour' },
  { label: '룸서비스', path: '/commerce/room-service' },
];

const STATUS = {
  ordered: { text: '주문 완료', color: '#c58a3a', bg: 'rgba(197,138,58,0.1)' },
  paid: { text: '결제 완료', color: '#2e7d32', bg: 'rgba(46,125,50,0.1)' },
  ended: { text: '완료', color: '#888', bg: 'rgba(0,0,0,0.06)' },
  cancelled: { text: '취소됨', color: '#c0392b', bg: 'rgba(192,57,43,0.1)' },
};

function fmt(price) {
  return price == null ? '0' : Number(price).toLocaleString('ko-KR');
}
function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function OrderList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, loading, error, refetch } = useOrders();

  // Checkout에서 넘어올 때 토스트 메시지 표시
  const [toast, setToast] = useState(location.state?.toastMsg || '');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

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
            {/* 탭 */}
            <div className={styles.topTabs}>
              <button
                className={styles.topTab}
                onClick={() => navigate('/commerce/room-service')}
              >
                주문
              </button>
              <button className={`${styles.topTab} ${styles.topTabActive}`}>
                주문 내역
              </button>
            </div>

            {/* 제목 + 새로고침 */}
            <div className={styles.titleRow}>
              <h1 className={styles.title}>주문 내역</h1>
              <button
                className={styles.refreshBtn}
                onClick={refetch}
                disabled={loading}
              >
                ↻ 새로고침
              </button>
            </div>

            {loading && (
              <div className={styles.center}>
                <span className={styles.spin} />
              </div>
            )}
            {error && <p className={styles.errMsg}>{error}</p>}

            {!loading && orders.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📋</div>
                <p className={styles.emptyText}>주문 내역이 없습니다</p>
                <button
                  className={styles.goShopBtn}
                  onClick={() => navigate('/commerce/room-service')}
                >
                  상품 보러 가기
                </button>
              </div>
            )}

            <div className={styles.list}>
              {orders.map((order) => {
                const st = STATUS[order.orderSt] ?? {
                  text: order.orderSt,
                  color: '#888',
                  bg: 'rgba(0,0,0,0.05)',
                };
                return (
                  <div
                    key={order.orderId}
                    className={styles.card}
                    onClick={() =>
                      navigate(`/commerce/orders/${order.orderId}`)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      navigate(`/commerce/orders/${order.orderId}`)
                    }
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.orderId}>
                        주문 #{order.orderId}
                      </span>
                      <span
                        className={styles.statusChip}
                        style={{ color: st.color, background: st.bg }}
                      >
                        {st.text}
                      </span>
                    </div>

                    {/* 상품 미리보기 */}
                    <div className={styles.preview}>
                      {(order.orderItems ?? []).slice(0, 2).map((item) => (
                        <span
                          key={item.orderItemId}
                          className={styles.previewChip}
                        >
                          {item.prodNm} × {item.orderQuantity}
                        </span>
                      ))}
                      {(order.orderItems ?? []).length > 2 && (
                        <span className={styles.previewMore}>
                          외 {order.orderItems.length - 2}건
                        </span>
                      )}
                    </div>

                    <div className={styles.cardBottom}>
                      <span className={styles.orderDate}>
                        {fmtDate(order.orderCreatedAt)}
                      </span>
                      <span className={styles.orderTotal}>
                        {fmt(order.totalPrice)}원
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 완료 토스트 */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
