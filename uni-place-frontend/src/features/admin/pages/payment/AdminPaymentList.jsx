import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import styles from './AdminPaymentTable.module.css';
import refundStyles from './AdminRefundModal.module.css';

// ── 상수 ─────────────────────────────────────────────────────
const PAYMENT_STATUS_OPTIONS = [
  { value: 'ready', label: '준비' },
  { value: 'paid', label: '결제완료' },
  { value: 'cancelled', label: '취소' },
  { value: 'pending', label: '대기' },
  { value: 'disputed', label: '결제분쟁' },
];
const PAYMENT_STATUS_LABELS = PAYMENT_STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});
const TARGET_LABELS = {
  order: '주문',
  room_service: '주문',
  roomservice: '주문',
  monthly_charge: '월세',
  rent: '월세',
  charge: '월세',
};

// ── 유틸 ─────────────────────────────────────────────────────
function formatMoney(value, currency = 'KRW') {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return '-';
  return `${safe.toLocaleString('ko-KR')} ${currency || ''}`.trim();
}
function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function pageWindow(page, totalPages, radius = 2) {
  const from = Math.max(1, page - radius),
    to = Math.min(totalPages, page + radius);
  const result = [];
  for (let p = from; p <= to; p++) result.push(p);
  return result;
}
function targetLabel(targetType, targetId) {
  const key = String(targetType ?? '').toLowerCase();
  const label = TARGET_LABELS[key] ?? (targetType || '미지정');
  return targetId != null ? `${label} #${targetId}` : label;
}
function isOrderPayment(payment) {
  const t = String(payment?.targetType ?? '').toLowerCase();
  return t === 'order' || t === 'room_service' || t === 'roomservice';
}
async function fetchAllUsers() {
  const users = [];
  let page = 1,
    totalPages = 1;
  while (page <= totalPages) {
    const res = await adminApi.users({
      page,
      size: 200,
      sort: 'userId',
      direct: 'ASC',
    });
    users.push(...(Array.isArray(res?.content) ? res.content : []));
    const n = Number(res?.totalPages ?? 1);
    totalPages = Number.isFinite(n) && n > 0 ? n : 1;
    page++;
  }
  return users;
}

// ── Badge ─────────────────────────────────────────────────────
function PaymentStatusBadge({ status }) {
  const key = String(status ?? '').toLowerCase();
  const className =
    key === 'paid'
      ? styles.badgePaid
      : key === 'fail'
        ? styles.badgeCancelled
        : key === 'cancelled'
          ? styles.badgeCancelled
          : key === 'pending'
            ? styles.badgePending
            : key === 'disputed'
              ? styles.badgeDisputed
              : styles.badgeReady;
  const label =
    key === 'fail' ? '실패' : (PAYMENT_STATUS_LABELS[key] ?? key) || '-';
  return <span className={`${styles.badge} ${className}`}>{label}</span>;
}

// ── 일반 환불 모달 (월세 등) ──────────────────────────────────
function GeneralRefundModal({ payment, userName, onClose, onSuccess }) {
  const [refundType, setRefundType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const paidAmount = Number(payment?.capturedPrice ?? payment?.totalPrice ?? 0);
  const currency = payment?.currency || 'KRW';

  const handleSubmit = async () => {
    setError('');
    const refundPrice = refundType === 'full' ? null : Number(partialAmount);
    if (refundType === 'partial') {
      if (!partialAmount || isNaN(refundPrice) || refundPrice <= 0)
        return setError('환불 금액을 올바르게 입력해주세요.');
      if (refundPrice > paidAmount)
        return setError(
          `결제 금액(${paidAmount.toLocaleString()}원)을 초과할 수 없습니다.`
        );
    }
    if (!reason.trim()) return setError('환불 사유를 입력해주세요.');
    if (
      !window.confirm(
        `${userName}님 결제(#${payment.paymentId})를 ${refundType === 'full' ? '전체' : `${Number(refundPrice).toLocaleString()}원 부분`} 환불하시겠습니까?`
      )
    )
      return;
    setSubmitting(true);
    try {
      await adminApi.adminRefund(payment.paymentId, {
        refundPrice,
        refundReason: reason.trim(),
      });
      onSuccess();
    } catch (e) {
      setError(e?.message || '환불 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={refundStyles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={refundStyles.modal}>
        <div className={refundStyles.header}>
          <h3 className={refundStyles.title}>환불 처리</h3>
          <button className={refundStyles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={refundStyles.infoBox}>
          <div className={refundStyles.infoRow}>
            <span className={refundStyles.infoLabel}>결제 ID</span>
            <span>#{payment.paymentId}</span>
          </div>
          <div className={refundStyles.infoRow}>
            <span className={refundStyles.infoLabel}>결제 대상</span>
            <span>{targetLabel(payment.targetType, payment.targetId)}</span>
          </div>
          <div className={refundStyles.infoRow}>
            <span className={refundStyles.infoLabel}>유저</span>
            <span>
              {userName} ({payment.userId})
            </span>
          </div>
          <div className={refundStyles.infoRow}>
            <span className={refundStyles.infoLabel}>결제 금액</span>
            <span className={refundStyles.infoAmount}>
              {formatMoney(paidAmount, currency)}
            </span>
          </div>
          <div className={refundStyles.infoRow}>
            <span className={refundStyles.infoLabel}>결제사</span>
            <span>{payment.provider || '-'}</span>
          </div>
        </div>

        <div className={refundStyles.section}>
          <div className={refundStyles.sectionLabel}>환불 유형</div>
          <div className={refundStyles.typeRow}>
            {[
              ['full', '💰', '전체 환불', formatMoney(paidAmount, currency)],
              ['partial', '✂️', '부분 환불', '금액 직접 입력'],
            ].map(([val, icon, label, sub]) => (
              <label
                key={val}
                className={`${refundStyles.typeCard} ${refundType === val ? refundStyles.typeCardActive : ''}`}
              >
                <input
                  type="radio"
                  name="refundType"
                  value={val}
                  checked={refundType === val}
                  onChange={() => {
                    setRefundType(val);
                    if (val === 'full') setPartialAmount('');
                  }}
                  style={{ display: 'none' }}
                />
                <span className={refundStyles.typeIcon}>{icon}</span>
                <span>{label}</span>
                <span className={refundStyles.typeAmount}>{sub}</span>
              </label>
            ))}
          </div>
        </div>

        {refundType === 'partial' && (
          <div className={refundStyles.section}>
            <label className={refundStyles.sectionLabel}>
              환불 금액 (최대 {formatMoney(paidAmount, currency)})
            </label>
            <div className={refundStyles.amountRow}>
              <input
                className={refundStyles.amountInput}
                type="number"
                min="1"
                max={paidAmount}
                placeholder="환불할 금액"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                disabled={submitting}
              />
              <span className={refundStyles.amountUnit}>원</span>
            </div>
            {partialAmount && !isNaN(Number(partialAmount)) && (
              <div className={refundStyles.amountPreview}>
                잔여 예상:{' '}
                {formatMoney(paidAmount - Number(partialAmount), currency)}
              </div>
            )}
          </div>
        )}

        <div className={refundStyles.section}>
          <label className={refundStyles.sectionLabel}>
            환불 사유 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            className={refundStyles.textarea}
            placeholder="환불 사유를 입력해주세요."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            rows={3}
          />
        </div>

        {error && <div className={refundStyles.errorMsg}>⚠️ {error}</div>}
        <div className={refundStyles.btnRow}>
          <button
            className={refundStyles.cancelBtn}
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
          <button
            className={refundStyles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '처리 중...' : '환불 실행'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 룸서비스 주문 상품별 환불 모달 ───────────────────────────
function OrderRefundModal({ payment, userName, onClose, onSuccess }) {
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selected, setSelected] = useState({}); // orderItemId → qty (0 = 미선택)
  const [selectAll, setSelectAll] = useState(false);
  const [reason, setReason] = useState('');
  const [restoreStock, setRestoreStock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const paidAmount = Number(payment?.capturedPrice ?? payment?.totalPrice ?? 0);
  const currency = payment?.currency || 'KRW';

  useEffect(() => {
    adminApi
      .getRefundOrderItems(payment.paymentId)
      .then((items) => {
        const list = Array.isArray(items?.data)
          ? items.data
          : Array.isArray(items)
            ? items
            : [];
        setOrderItems(list);
        // 초기 선택 상태: 전체 선택
        const init = {};
        list.forEach((item) => {
          init[item.orderItemId] = item.orderQuantity;
        });
        setSelected(init);
        setSelectAll(true);
      })
      .catch(() => setOrderItems([]))
      .finally(() => setLoadingItems(false));
  }, [payment.paymentId]);

  const toggleAll = (checked) => {
    setSelectAll(checked);
    const next = {};
    orderItems.forEach((item) => {
      next[item.orderItemId] = checked ? item.orderQuantity : 0;
    });
    setSelected(next);
  };

  const setItemQty = (orderItemId, qty, maxQty) => {
    const safeQty = Math.max(0, Math.min(Number(qty) || 0, maxQty));
    setSelected((prev) => {
      const next = { ...prev, [orderItemId]: safeQty };
      const allFull = orderItems.every(
        (i) => next[i.orderItemId] === i.orderQuantity
      );
      setSelectAll(allFull);
      return next;
    });
  };

  // 환불 금액 계산
  const refundPrice = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const qty = selected[item.orderItemId] ?? 0;
      if (qty <= 0) return sum;
      const unitPrice = Number(item.orderPrice) / item.orderQuantity;
      return sum + unitPrice * qty;
    }, 0);
  }, [selected, orderItems]);

  const selectedItems = orderItems.filter(
    (i) => (selected[i.orderItemId] ?? 0) > 0
  );
  const isFullRefund =
    selectedItems.length === orderItems.length &&
    orderItems.every((i) => selected[i.orderItemId] === i.orderQuantity);

  const handleSubmit = async () => {
    setError('');
    if (selectedItems.length === 0)
      return setError('환불할 상품을 1개 이상 선택해주세요.');
    if (!reason.trim()) return setError('환불 사유를 입력해주세요.');
    if (refundPrice <= 0) return setError('환불 금액이 0원입니다.');

    const confirmMsg = isFullRefund
      ? `${userName}님의 전체 주문(#${payment.paymentId})을 환불하시겠습니까?\n${restoreStock ? '재고가 복원됩니다.' : ''}`
      : `선택한 ${selectedItems.length}개 상품 (${Math.round(refundPrice).toLocaleString()}원)을 부분 환불하시겠습니까?\n${restoreStock ? '선택한 상품 재고가 복원됩니다.' : ''}`;
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const refundItems = isFullRefund
        ? null
        : selectedItems.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: selected[item.orderItemId],
          }));

      await adminApi.adminOrderRefund(payment.paymentId, {
        refundReason: reason.trim(),
        restoreStock,
        refundItems,
      });
      onSuccess();
    } catch (e) {
      setError(e?.message || '환불 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={refundStyles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={refundStyles.modal} style={{ maxWidth: 560 }}>
        <div className={refundStyles.header}>
          <h3 className={refundStyles.title}>주문 환불 처리</h3>
          <button className={refundStyles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 결제 요약 */}
        <div className={refundStyles.infoBox}>
          <div className={refundStyles.infoRow}>
            <span className={refundStyles.infoLabel}>결제 ID</span>
            <span>
              #{payment.paymentId} (주문 #{payment.targetId})
            </span>
          </div>
          <div className={refundStyles.infoRow}>
            <span className={refundStyles.infoLabel}>유저</span>
            <span>
              {userName} ({payment.userId})
            </span>
          </div>
          <div className={refundStyles.infoRow}>
            <span className={refundStyles.infoLabel}>결제 금액</span>
            <span className={refundStyles.infoAmount}>
              {formatMoney(paidAmount, currency)}
            </span>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className={refundStyles.section}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div className={refundStyles.sectionLabel}>환불할 상품 선택</div>
            {!loadingItems && orderItems.length > 0 && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                전체 선택
              </label>
            )}
          </div>

          {loadingItems ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: 13,
              }}
            >
              상품 목록 불러오는 중…
            </div>
          ) : orderItems.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: 13,
              }}
            >
              상품 정보를 불러올 수 없습니다.
            </div>
          ) : (
            <div className={refundStyles.itemList}>
              {orderItems.map((item) => {
                const qty = selected[item.orderItemId] ?? 0;
                const isSelected = qty > 0;
                return (
                  <div
                    key={item.orderItemId}
                    className={`${refundStyles.itemRow} ${isSelected ? refundStyles.itemRowSelected : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        setItemQty(
                          item.orderItemId,
                          e.target.checked ? item.orderQuantity : 0,
                          item.orderQuantity
                        )
                      }
                      style={{ marginTop: 2 }}
                    />
                    <div className={refundStyles.itemInfo}>
                      <div className={refundStyles.itemName}>{item.prodNm}</div>
                      <div className={refundStyles.itemMeta}>
                        단가{' '}
                        {formatMoney(
                          Number(item.orderPrice) / item.orderQuantity,
                          currency
                        )}{' '}
                        × 주문 {item.orderQuantity}개
                        {item.buildingId && (
                          <span style={{ marginLeft: 6, color: '#9ca3af' }}>
                            빌딩 #{item.buildingId}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* 수량 입력 (선택된 경우만) */}
                    {isSelected && (
                      <div className={refundStyles.itemQtyBox}>
                        <button
                          type="button"
                          className={refundStyles.qtyBtn}
                          onClick={() =>
                            setItemQty(
                              item.orderItemId,
                              qty - 1,
                              item.orderQuantity
                            )
                          }
                          disabled={qty <= 1}
                        >
                          −
                        </button>
                        <span className={refundStyles.qtyVal}>{qty}</span>
                        <button
                          type="button"
                          className={refundStyles.qtyBtn}
                          onClick={() =>
                            setItemQty(
                              item.orderItemId,
                              qty + 1,
                              item.orderQuantity
                            )
                          }
                          disabled={qty >= item.orderQuantity}
                        >
                          +
                        </button>
                      </div>
                    )}
                    <div
                      className={refundStyles.itemPrice}
                      style={{ color: isSelected ? '#b8860b' : '#d1d5db' }}
                    >
                      {isSelected
                        ? formatMoney(
                            Math.round(
                              (Number(item.orderPrice) / item.orderQuantity) *
                                qty
                            ),
                            currency
                          )
                        : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 환불 금액 합계 */}
          {refundPrice > 0 && (
            <div className={refundStyles.refundSummary}>
              <span>
                {isFullRefund
                  ? '전체 환불'
                  : `${selectedItems.length}개 상품 부분 환불`}
              </span>
              <span className={refundStyles.refundSummaryAmt}>
                {formatMoney(Math.round(refundPrice), currency)}
              </span>
            </div>
          )}
        </div>

        {/* 재고 복원 */}
        <div className={refundStyles.section}>
          <label className={refundStyles.stockRestoreRow}>
            <input
              type="checkbox"
              checked={restoreStock}
              onChange={(e) => setRestoreStock(e.target.checked)}
            />
            <div>
              <div className={refundStyles.stockRestoreLabel}>
                재고 원상복구
              </div>
              <div className={refundStyles.stockRestoreDesc}>
                선택한 상품의 수량만큼 건물별 재고를 복원합니다.
              </div>
            </div>
          </label>
        </div>

        {/* 환불 사유 */}
        <div className={refundStyles.section}>
          <label className={refundStyles.sectionLabel}>
            환불 사유 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            className={refundStyles.textarea}
            placeholder="환불 사유를 입력해주세요."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            rows={2}
          />
        </div>

        {error && <div className={refundStyles.errorMsg}>⚠️ {error}</div>}

        <div className={refundStyles.btnRow}>
          <button
            className={refundStyles.cancelBtn}
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
          <button
            className={refundStyles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || selectedItems.length === 0}
          >
            {submitting
              ? '처리 중...'
              : isFullRefund
                ? '전체 환불'
                : '부분 환불'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function AdminPaymentList() {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [userNameById, setUserNameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1);
  const searchKey = searchParams.toString();

  const [refundTarget, setRefundTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentData, users] = await Promise.all([
        adminApi.getPayments(),
        fetchAllUsers().catch(() => []),
      ]);
      const rows = Array.isArray(paymentData) ? paymentData : [];
      rows.sort(
        (a, b) => Number(b?.paymentId ?? 0) - Number(a?.paymentId ?? 0)
      );
      setPayments(rows);
      setUserNameById(
        users.reduce((acc, u) => {
          const id = String(u?.userId ?? '').trim();
          if (id)
            acc[id] = String(
              u?.userNm ??
                u?.userName ??
                u?.name ??
                u?.nickname ??
                u?.email ??
                id
            );
          return acc;
        }, {})
      );
    } catch (e) {
      setPayments([]);
      setError(e?.message || '결제 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const next = (
      params.get('paymentId') ||
      params.get('keyword') ||
      ''
    ).trim();
    if (!next) return;
    setKeyword(next);
    setPage(1);
  }, [searchKey]);

  const providerOptions = useMemo(() => {
    const set = new Set();
    payments.forEach((p) => {
      const v = String(p?.provider ?? '').trim();
      if (v) set.add(v);
    });
    return [...set].sort();
  }, [payments]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter !== 'all' && payment?.paymentSt !== statusFilter)
        return false;
      if (providerFilter !== 'all' && payment?.provider !== providerFilter)
        return false;
      if (!q) return true;
      const userId = String(payment?.userId ?? '').trim();
      const haystack = [
        payment?.paymentId,
        payment?.merchantUid,
        payment?.provider,
        payment?.providerPaymentId,
        payment?.targetType,
        payment?.targetId,
        userId,
        userNameById[userId] || '',
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');
      return haystack.includes(q);
    });
  }, [keyword, payments, providerFilter, statusFilter, userNameById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, totalPages);
  const rows = useMemo(() => {
    const from = (safePage - 1) * size;
    return filtered.slice(from, from + size);
  }, [filtered, safePage, size]);
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);
  const pages = useMemo(
    () => pageWindow(safePage, totalPages),
    [safePage, totalPages]
  );

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>결제 내역</h2>
          <p className={styles.sub}>
            총 <strong>{filtered.length}</strong>건
          </p>
        </div>
        <div className={styles.actions}>
          <select
            className={styles.select}
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}개 / 페이지
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={load}
            disabled={loading}
          >
            {loading ? '로딩중...' : '새로고침'}
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>상태</span>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">전체</option>
            {PAYMENT_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>결제사</span>
          <select
            className={styles.select}
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">전체</option>
            {providerOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>검색</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="결제ID, 유저이름, 식별키"
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            setStatusFilter('all');
            setProviderFilter('all');
            setKeyword('');
            setPage(1);
          }}
        >
          필터 초기화
        </button>
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      {!loading && rows.length === 0 ? (
        <div className={styles.empty}>조건에 맞는 결제 내역이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>결제대상</th>
                <th>유저</th>
                <th>금액</th>
                <th>상태</th>
                <th>결제사</th>
                <th>식별키</th>
                <th>결제시각</th>
                <th>환불</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((payment) => {
                const userId = String(payment?.userId ?? '').trim();
                const userName = userNameById[userId] || '-';
                const canRefund = payment?.paymentSt === 'paid';
                const isOrder = isOrderPayment(payment);

                return (
                  <tr key={payment.paymentId}>
                    <td>
                      <div>
                        {targetLabel(payment.targetType, payment.targetId)}
                      </div>
                      <div className={styles.subCell}>
                        #{payment.paymentId ?? '-'}
                      </div>
                    </td>
                    <td>
                      <div>{userName}</div>
                      <div className={styles.subCell}>{userId || '-'}</div>
                    </td>
                    <td>
                      <div>
                        {formatMoney(
                          payment.capturedPrice ?? payment.totalPrice,
                          payment.currency
                        )}
                      </div>
                    </td>
                    <td>
                      <PaymentStatusBadge status={payment.paymentSt} />
                    </td>
                    <td>
                      <div>{payment.provider || '-'}</div>
                    </td>
                    <td>
                      <div className={styles.ellipsis}>
                        {payment.merchantUid || '-'}
                      </div>
                    </td>
                    <td className={styles.dateCell}>
                      {formatDateTime(payment.paidAt || payment.createdAt)}
                    </td>
                    <td>
                      {canRefund ? (
                        <button
                          type="button"
                          className={refundStyles.refundBtn}
                          onClick={() => setRefundTarget(payment)}
                        >
                          {isOrder ? '상품별' : '환불'}
                        </button>
                      ) : (
                        <span className={refundStyles.refundNA}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1 || loading}
          >
            {'<'}
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === safePage ? styles.pageBtnActive : ''}`}
              onClick={() => setPage(p)}
              disabled={loading}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages || loading}
          >
            {'>'}
          </button>
        </div>
      )}

      {/* 환불 모달 분기: 주문이면 상품별, 아니면 일반 */}
      {refundTarget && isOrderPayment(refundTarget) && (
        <OrderRefundModal
          payment={refundTarget}
          userName={
            userNameById[String(refundTarget.userId ?? '')] ||
            refundTarget.userId ||
            '-'
          }
          onClose={() => setRefundTarget(null)}
          onSuccess={() => {
            setRefundTarget(null);
            load();
          }}
        />
      )}
      {refundTarget && !isOrderPayment(refundTarget) && (
        <GeneralRefundModal
          payment={refundTarget}
          userName={
            userNameById[String(refundTarget.userId ?? '')] ||
            refundTarget.userId ||
            '-'
          }
          onClose={() => setRefundTarget(null)}
          onSuccess={() => {
            setRefundTarget(null);
            load();
          }}
        />
      )}
    </section>
  );
}
