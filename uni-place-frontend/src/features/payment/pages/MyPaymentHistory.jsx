// features/payment/pages/MyPaymentHistory.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { paymentApi } from '../api/paymentApi';
import styles from './MyPaymentHistory.module.css';

// ── 상수 ─────────────────────────────────────────────────────
const TARGET_TYPE_LABEL = {
  monthly_charge: '월세',
  order: '룸서비스',
  space_rental: '공간대여',
  tour: '방문예약',
  contract: '계약',
};

const PAYMENT_ST_LABEL = {
  paid: '결제완료',
  ready: '결제대기',
  pending: '처리중',
  cancelled: '취소됨',
  failed: '결제실패',
  disputed: '분쟁중',
};

const PAYMENT_ST_COLOR = {
  paid: '#16a34a',
  ready: '#9a8c70',
  pending: '#d97706',
  cancelled: '#dc2626',
  failed: '#e74c3c',
  disputed: '#7c3aed',
};

const TYPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'monthly_charge', label: '월세' },
  { value: 'order', label: '룸서비스' },
];

const now = new Date();
const YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// ── 상세 모달 ─────────────────────────────────────────────────
function PaymentDetailModal({ payment, onClose, inlineMode }) {
  if (!payment) return null;

  const rows = [
    { label: '결제 ID', value: payment.paymentId },
    {
      label: '구분',
      value: TARGET_TYPE_LABEL[payment.targetType] ?? payment.targetType,
    },
    {
      label: '결제 상태',
      value: PAYMENT_ST_LABEL[payment.paymentSt] ?? payment.paymentSt,
    },
    {
      label: '결제 금액',
      value: `${Number(payment.totalPrice ?? 0).toLocaleString()}원`,
    },
    {
      label: '실결제금액',
      value: `${Number(payment.capturedPrice ?? 0).toLocaleString()}원`,
    },
    { label: '결제 수단', value: payment.provider ?? '-' },
    { label: '주문번호', value: payment.merchantUid ?? '-' },
    { label: 'PG 거래번호', value: payment.providerPaymentId ?? '-' },
    {
      label: payment.paymentSt === 'paid' ? '결제일시'
           : payment.paymentSt === 'cancelled' ? '취소일시'
           : payment.paymentSt === 'failed' ? '실패일시'
           : '요청일시',
      value: payment.paidAt
        ? new Date(payment.paidAt).toLocaleString('ko-KR')
        : payment.createdAt
          ? new Date(payment.createdAt).toLocaleString('ko-KR')
          : '-',
    },
  ];

  const inner = (
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>결제 상세</h3>
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>
      </div>
      <div className={styles.modalBody}>
        <div
          className={styles.detailBadge}
          style={{
            background: PAYMENT_ST_COLOR[payment.paymentSt] + '20',
            color: PAYMENT_ST_COLOR[payment.paymentSt],
          }}
        >
          {PAYMENT_ST_LABEL[payment.paymentSt] ?? payment.paymentSt}
        </div>
        <table className={styles.detailTable}>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th>{r.label}</th>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 룸서비스 주문 상품 목록 */}
        {payment.targetType === 'order' &&
          payment.orderItems &&
          payment.orderItems.length > 0 && (
            <div className={styles.orderItemsWrap}>
              <p className={styles.orderItemsTitle}>주문 상품</p>
              <ul className={styles.orderItemsList}>
                {payment.orderItems.map((item, i) => (
                  <li key={i} className={styles.orderItem}>
                    <span className={styles.orderItemName}>
                      {item.productName}
                    </span>
                    <span className={styles.orderItemQty}>
                      ×{item.quantity}
                    </span>
                    <span className={styles.orderItemPrice}>
                      {Number(item.price ?? 0).toLocaleString()}원
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </div>
  );

  if (inlineMode) {
    return <div className={styles.inlinePanel}>{inner}</div>;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      {inner}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function MyPaymentHistory({ inlineMode = false }) {
  const [targetType, setTargetType] = useState('');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [page, setPage] = useState(1);
  const SIZE = 10;

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState(null);
  const [openPaymentId, setOpenPaymentId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentApi.getMyPayments({
        targetType: targetType || undefined,
        year,
        month,
        page,
        size: SIZE,
      });
      const d = res?.data?.data ?? res?.data ?? {};
      setItems(d.content ?? []);
      setTotalPages(d.totalPages ?? 1);
      setTotal(d.totalElements ?? 0);
    } catch (e) {
      setError(e?.message || '결제 내역을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [targetType, year, month, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleTypeChange = (v) => {
    setTargetType(v);
    setPage(1);
  };
  const handleYearChange = (v) => {
    setYear(Number(v));
    setPage(1);
  };
  const handleMonthChange = (v) => {
    setMonth(Number(v));
    setPage(1);
  };

  const openDetail = async (paymentId) => {
    // 같은 항목 클릭 시 닫기 (토글)
    if (openPaymentId === paymentId) {
      setOpenPaymentId(null);
      setDetail(null);
      return;
    }
    setOpenPaymentId(paymentId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await paymentApi.getMyPaymentDetail(paymentId);
      const d = res?.data?.data ?? res?.data ?? {};
      setDetail(d);
    } catch {
      alert('상세 정보를 불러올 수 없습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  // 월 이동
  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setPage(1);
  };
  const nextMonth = () => {
    const nm = new Date();
    if (
      year > nm.getFullYear() ||
      (year === nm.getFullYear() && month >= nm.getMonth() + 1)
    )
      return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setPage(1);
  };

  const isNextDisabled =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>전체 결제 내역</h2>

      {/* ── 필터 ── */}
      <div className={styles.filterRow}>
        {/* 구분 필터 */}
        <div className={styles.filterGroup}>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chip} ${targetType === opt.value ? styles.chipActive : ''}`}
              onClick={() => handleTypeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 월 네비게이터 */}
        <div className={styles.monthNav}>
          <button type="button" className={styles.navBtn} onClick={prevMonth}>
            ‹
          </button>
          <div className={styles.monthSelectors}>
            <select
              className={styles.monthSelect}
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <select
              className={styles.monthSelect}
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={styles.navBtn}
            onClick={nextMonth}
            disabled={isNextDisabled}
          >
            ›
          </button>
        </div>
      </div>

      {/* ── 요약 ── */}
      <div className={styles.summary}>
        <span className={styles.summaryMonth}>
          {year}년 {month}월
        </span>
        <span className={styles.summaryCount}>총 {total}건</span>
        {items.length > 0 && (
          <span className={styles.summaryAmount}>
            합계&nbsp;
            {Number(
              items.reduce(
                (s, p) => s + Number(p.capturedPrice ?? p.totalPrice ?? 0),
                0
              )
            ).toLocaleString()}
            원
          </span>
        )}
      </div>

      {/* ── 일반 모드: 오버레이 로딩 ── */}
      {detailLoading && !inlineMode && (
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            로딩 중...
          </div>
        </div>
      )}
      {!inlineMode && detail && (
        <PaymentDetailModal payment={detail} onClose={() => { setDetail(null); setOpenPaymentId(null); }} inlineMode={false} />
      )}

      {/* ── 목록 ── */}
      {loading ? (
        <div className={styles.stateBox}>불러오는 중...</div>
      ) : error ? (
        <div className={styles.stateBox} style={{ color: '#dc2626' }}>
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.stateBox}>해당 기간의 결제 내역이 없습니다.</div>
      ) : (
        <ul className={styles.list}>
          {items.map((p) => (
            <React.Fragment key={p.paymentId}>
              <li
                className={`${styles.item} ${openPaymentId === p.paymentId ? styles.itemOpen : ''}`}
                onClick={() => openDetail(p.paymentId)}
              >
                <div className={styles.itemLeft}>
                  <span className={styles.itemType}>
                    {TARGET_TYPE_LABEL[p.targetType] ?? p.targetType}
                  </span>
                  <span className={styles.itemDate}>
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : p.createdAt
                        ? new Date(p.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : ''}
                  </span>
                </div>
                <div className={styles.itemRight}>
                  <span className={styles.itemAmount}>
                    {Number(
                      p.capturedPrice ?? p.totalPrice ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                  <span
                    className={styles.itemStatus}
                    style={{ color: PAYMENT_ST_COLOR[p.paymentSt] ?? '#555' }}
                  >
                    {PAYMENT_ST_LABEL[p.paymentSt] ?? p.paymentSt}
                  </span>
                  <span className={`${styles.itemArrow} ${openPaymentId === p.paymentId ? styles.itemArrowOpen : ''}`}>›</span>
                </div>
              </li>
              {/* 클릭한 항목 바로 아래 인라인 패널 */}
              {inlineMode && openPaymentId === p.paymentId && (
                detailLoading
                  ? <li className={styles.itemDetailLoading}>불러오는 중…</li>
                  : detail && <li className={styles.itemDetailWrap}>
                      <PaymentDetailModal payment={detail} onClose={() => { setDetail(null); setOpenPaymentId(null); }} inlineMode={true} />
                    </li>
              )}
            </React.Fragment>
          ))}
        </ul>
      )}

      {/* ── 페이지네이션 ── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </button>
        </div>
      )}

    </div>
  );
}
