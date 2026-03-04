// src/features/commerce/pages/OrderDetail.jsx
// inlineMode: MemberInfo 탭 내에서 사용 시 true

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useOrder } from '../hooks/useOrders';
import ConfirmModal from './components/ConfirmModal';
import styles from './OrderDetail.module.css';
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
const RS_STATUS = {
  requested: { text: '요청됨', color: '#c58a3a' },
  paid: { text: '결제 완료', color: '#2e7d32' },
  delivered: { text: '배달 완료', color: '#555' },
  cancelled: { text: '취소됨', color: '#c0392b' },
};
function fmt(price) {
  return price == null ? '0' : Number(price).toLocaleString('ko-KR');
}
function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('ko-KR');
}

export default function OrderDetail({
  inlineMode = false,
  onNav,
  orderId: propOrderId,
}) {
  const navigate = useNavigate();
  const params = useParams();
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);

  const go = (path, state) => {
    if (inlineMode && onNav) onNav(path, state);
    else navigate(path, state ? { state } : undefined);
  };

  const orderId =
    propOrderId ?? (params.orderId ? Number(params.orderId) : null);
  const { order, loading, error, cancelLoading, cancelError, cancel } =
    useOrder(orderId);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const st = order
    ? (STATUS[order.orderSt] ?? {
        text: order.orderSt,
        color: '#888',
        bg: '#eee',
      })
    : null;

  const inner = (
    <div className={styles.root}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => go('/commerce/orders')}
        >
          ← 주문 목록
        </button>
        <h1 className={styles.title}>주문 상세</h1>
        <div style={{ width: 88 }} />
      </div>
      {loading && (
        <div className={styles.center}>
          <span className={styles.spin} />
        </div>
      )}
      {error && <p className={styles.errMsg}>{error}</p>}
      {order && (
        <div className={styles.body}>
          <div className={styles.summaryBox}>
            <div className={styles.sumRow}>
              <span className={styles.sumLabel}>주문 번호</span>
              <span className={styles.sumVal}>#{order.orderId}</span>
            </div>
            <div className={styles.sumRow}>
              <span className={styles.sumLabel}>주문 상태</span>
              <span
                className={styles.statusChip}
                style={{ color: st.color, background: st.bg }}
              >
                {st.text}
              </span>
            </div>
            <div className={styles.sumRow}>
              <span className={styles.sumLabel}>주문 일시</span>
              <span className={styles.sumVal}>
                {fmtDate(order.orderCreatedAt)}
              </span>
            </div>
            <div className={styles.sumRow}>
              <span className={styles.sumLabel}>총 금액</span>
              <span className={styles.sumTotal}>{fmt(order.totalPrice)}원</span>
            </div>
          </div>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span>🛍</span> 주문 상품
            </h2>
            <div className={styles.itemList}>
              {(order.orderItems ?? []).map((item) => (
                <div key={item.orderItemId} className={styles.item}>
                  <span className={styles.itemName}>{item.prodNm}</span>
                  <span className={styles.itemQty}>× {item.orderQuantity}</span>
                  <span className={styles.itemAmt}>
                    {fmt(item.orderPrice)}원
                  </span>
                </div>
              ))}
            </div>
          </div>
          {(order.roomServiceOrders ?? []).length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span>🚪</span> 배달 정보
              </h2>
              {order.roomServiceOrders.map((rs) => {
                const rsSt = RS_STATUS[rs.orderSt] ?? {
                  text: rs.orderSt,
                  color: '#888',
                };
                return (
                  <div key={rs.orderId} className={styles.rsBox}>
                    <div className={styles.sumRow}>
                      <span className={styles.sumLabel}>방 번호</span>
                      <span className={styles.sumVal}>{rs.roomNo}호</span>
                    </div>
                    <div className={styles.sumRow}>
                      <span className={styles.sumLabel}>배달 상태</span>
                      <span
                        style={{
                          color: rsSt.color,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {rsSt.text}
                      </span>
                    </div>
                    {rs.roomServiceDesc && (
                      <div className={styles.sumRow}>
                        <span className={styles.sumLabel}>요청 사항</span>
                        <span className={styles.sumVal}>
                          {rs.roomServiceDesc}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {order.orderSt === 'ordered' && (
            <div className={styles.cancelWrap}>
              {cancelError && <p className={styles.errMsg}>{cancelError}</p>}
              <button
                className={styles.cancelBtn}
                onClick={() => setShowCancelModal(true)}
                disabled={cancelLoading}
              >
                {cancelLoading ? '취소 중…' : '주문 취소'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const modals = (
    <>
      {showCancelModal && (
        <ConfirmModal
          title="주문을 취소할까요?"
          desc={`주문 #${order?.orderId}을 취소합니다.\n취소 후에는 되돌릴 수 없습니다.`}
          confirmLabel="주문 취소"
          cancelLabel="돌아가기"
          danger={true}
          onConfirm={async () => {
            await cancel();
            setShowCancelModal(false);
          }}
          onCancel={() => setShowCancelModal(false)}
        />
      )}
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
      {modals}
    </div>
  );
}
