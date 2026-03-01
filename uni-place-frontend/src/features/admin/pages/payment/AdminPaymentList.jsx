import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminPaymentTable.module.css';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'ready', label: '준비' },
  { value: 'paid', label: '결제완료' },
  { value: 'cancelled', label: '취소' },
  { value: 'pending', label: '대기' },
  { value: 'disputed', label: '분쟁' },
];

const PAYMENT_STATUS_LABELS = PAYMENT_STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

function formatMoney(value, currency = 'KRW') {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return '-';
  return `${safe.toLocaleString('ko-KR')} ${currency || ''}`.trim();
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function pageWindow(page, totalPages, radius = 2) {
  const from = Math.max(1, page - radius);
  const to = Math.min(totalPages, page + radius);
  const result = [];
  for (let p = from; p <= to; p += 1) result.push(p);
  return result;
}

function PaymentStatusBadge({ status }) {
  const key = String(status ?? '').toLowerCase();
  const className =
    key === 'paid'
      ? styles.badgePaid
      : key === 'cancelled'
        ? styles.badgeCancelled
        : key === 'pending'
          ? styles.badgePending
          : key === 'disputed'
            ? styles.badgeDisputed
            : styles.badgeReady;

  return (
    <span className={`${styles.badge} ${className}`}>
      {(PAYMENT_STATUS_LABELS[key] ?? key) || '-'}
    </span>
  );
}

export default function AdminPaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getPayments();
      const rows = Array.isArray(data) ? data : [];
      rows.sort((a, b) => Number(b?.paymentId ?? 0) - Number(a?.paymentId ?? 0));
      setPayments(rows);
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

  const providerOptions = useMemo(() => {
    const set = new Set();
    payments.forEach((payment) => {
      const provider = String(payment?.provider ?? '').trim();
      if (provider) set.add(provider);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [payments]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter !== 'all' && payment?.paymentSt !== statusFilter) {
        return false;
      }
      if (providerFilter !== 'all' && payment?.provider !== providerFilter) {
        return false;
      }
      if (!q) return true;

      const haystack = [
        payment?.paymentId,
        payment?.userId,
        payment?.merchantUid,
        payment?.provider,
        payment?.providerPaymentId,
        payment?.targetType,
        payment?.targetId,
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');

      return haystack.includes(q);
    });
  }, [keyword, payments, providerFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, totalPages);

  const rows = useMemo(() => {
    const from = (safePage - 1) * size;
    return filtered.slice(from, from + size);
  }, [filtered, safePage, size]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pages = useMemo(() => pageWindow(safePage, totalPages), [safePage, totalPages]);

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
            {providerOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>검색</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="paymentId, userId, merchantUid..."
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
                <th>결제 ID</th>
                <th>사용자 / 대상</th>
                <th>금액</th>
                <th>상태</th>
                <th>결제사 정보</th>
                <th>식별키</th>
                <th>결제시각</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((payment) => (
                <tr key={payment.paymentId}>
                  <td>
                    <strong>#{payment.paymentId}</strong>
                    <div className={styles.subCell}>
                      serviceGoodsId: {payment.serviceGoodsId ?? '-'}
                    </div>
                  </td>
                  <td>
                    <div>{payment.userId || '-'}</div>
                    <div className={styles.subCell}>
                      {payment.targetType || '-'} #{payment.targetId ?? '-'}
                    </div>
                  </td>
                  <td>
                    <div>{formatMoney(payment.totalPrice, payment.currency)}</div>
                    <div className={styles.subCell}>
                      captured: {formatMoney(payment.capturedPrice, payment.currency)}
                    </div>
                  </td>
                  <td>
                    <PaymentStatusBadge status={payment.paymentSt} />
                  </td>
                  <td>
                    <div>{payment.provider || '-'}</div>
                    <div className={styles.subCell}>
                      providerPaymentId: {payment.providerPaymentId || '-'}
                    </div>
                    <div className={styles.subCell}>
                      paymentMethodId: {payment.paymentMethodId ?? '-'}
                    </div>
                  </td>
                  <td>
                    <div className={styles.ellipsis}>{payment.merchantUid || '-'}</div>
                    <div className={styles.subCell}>
                      idem: {payment.idempotencyKey || '-'}
                    </div>
                  </td>
                  <td>{formatDateTime(payment.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages || loading}
          >
            {'>'}
          </button>
        </div>
      )}
    </section>
  );
}
