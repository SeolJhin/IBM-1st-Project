// src/features/commerce/pages/OrderList.jsx
// inlineMode: MemberInfo 탭 내에서 사용 시 true

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useOrders } from '../hooks/useOrders';
import styles from './OrderList.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

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

function resolvePaymentToast(search) {
  const payment = new URLSearchParams(search || '').get('payment');
  if (payment === 'success') {
    return '카카오페이 결제가 완료되었습니다. 주문 내역에서 확인하세요.';
  }
  if (payment === 'cancel') {
    return '결제가 취소되었습니다.';
  }
  if (payment === 'fail') {
    return '결제가 실패했습니다. 다시 시도해 주세요.';
  }
  return '';
}

export default function OrderList({
  inlineMode = false,
  onNav,
  toastMsg: propToast,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);
  const { orders, loading, error, refetch } = useOrders();

  const go = (path, state) => {
    if (inlineMode && onNav) onNav(path, state);
    else navigate(path, state ? { state } : undefined);
  };

  const [toast, setToast] = useState(
    propToast ||
      location.state?.toastMsg ||
      resolvePaymentToast(location.search)
  );
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (propToast) setToast(propToast);
  }, [propToast]);
  useEffect(() => {
    const msg = resolvePaymentToast(location.search);
    if (msg) setToast(msg);
  }, [location.search]);

  const inner = (
    <div className={styles.root}>
      <div className={styles.topTabs}>
        <button
          className={styles.topTab}
          onClick={() => go('/commerce/room-service')}
        >
          주문
        </button>
        <button className={`${styles.topTab} ${styles.topTabActive}`}>
          주문 내역
        </button>
      </div>
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
            onClick={() => go('/commerce/room-service')}
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
              onClick={() => go(`/commerce/orders/${order.orderId}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && go(`/commerce/orders/${order.orderId}`)
              }
            >
              <div className={styles.cardTop}>
                <span className={styles.orderId}>주문 #{order.orderId}</span>
                <span
                  className={styles.statusChip}
                  style={{ color: st.color, background: st.bg }}
                >
                  {st.text}
                </span>
              </div>
              <div className={styles.preview}>
                {(order.orderItems ?? []).slice(0, 2).map((item) => (
                  <span key={item.orderItemId} className={styles.previewChip}>
                    {item.prodNm} × {item.orderQuantity}
                  </span>
                ))}
                {(order.orderItems ?? []).length > 2 && (
                  <span className={styles.previewMore}>
                    외 {order.orderItems.length - 2}건
                  </span>
                )}
              </div>
              {(order.roomServiceOrders ?? []).length > 0 &&
                (() => {
                  const rs = order.roomServiceOrders[0];
                  const roomLabel = [
                    rs.buildingNm,
                    rs.roomNo ? `${rs.roomNo}호` : null,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return roomLabel ? (
                    <div className={styles.roomInfo}>{roomLabel}</div>
                  ) : null;
                })()}
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
  );

  const modals = (
    <>
      <Modal
        open={tourCreateOpen}
        onGoList={() => {
          setTourCreateOpen(false);
          setTourListOpen(true);
        }}
        onClose={() => setTourCreateOpen(false)}
        title="📅 사전 방문 예약"
        size="lg"
      >
        <TourReservationCreate
          inlineMode
          onSuccess={() => {
            setTourCreateOpen(false);
            setTourListOpen(true);
          }}
          onClose={() => setTourCreateOpen(false)}
        />
      </Modal>
      <Modal
        open={tourListOpen}
        onClose={() => setTourListOpen(false)}
        title="📋 방문 예약 조회"
        size="lg"
      >
        <TourReservationList
          inlineMode
          onGoCreate={() => {
            setTourListOpen(false);
            setTourCreateOpen(true);
          }}
          onClose={() => setTourListOpen(false)}
        />
      </Modal>
    </>
  );

  if (inlineMode)
    return (
      <>
        {inner}
        {toast && <div className={styles.toast}>{toast}</div>}
        {modals}
      </>
    );

  const SIDE_MENUS = [
    { label: '내 정보', path: '/me?tab=me' },
    { label: '마이룸', path: '/me?tab=myroom' },
    { label: '작성 목록', path: '/me?tab=posts' },
    { label: '공용 시설', path: '/me?tab=space' },
    { label: '사전 방문', path: '__TOUR_POPUP__' },
    { label: '룸서비스', path: '/commerce/room-service' },
  ];
  return (
    <div className={layoutStyles.page}>
      <Header />
      <main className={layoutStyles.container}>
        <aside className={layoutStyles.side}>
          <div className={layoutStyles.sideBox}>
            {SIDE_MENUS.map((m) => (
              <button
                key={m.label}
                className={layoutStyles.sideItem}
                onClick={() =>
                  m.path === '__TOUR_POPUP__'
                    ? setTourCreateOpen(true)
                    : navigate(m.path)
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </aside>
        <section className={layoutStyles.content}>{inner}</section>
      </main>
      {toast && <div className={styles.toast}>{toast}</div>}
      {modals}
    </div>
  );
}
