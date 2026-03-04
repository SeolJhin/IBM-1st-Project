import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminPaymentTable.module.css';

const REFUND_STATUS_OPTIONS = [
  { value: 'requested', label: '요청' },
  { value: 'done', label: '완료' },
  { value: 'failed', label: '실패' },
];

const REFUND_STATUS_LABELS = REFUND_STATUS_OPTIONS.reduce((acc, item) => {
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

function RefundStatusBadge({ status }) {
  const key = String(status ?? '').toLowerCase();
  const className =
    key === 'done' ? styles.badgeDone : key === 'failed' ? styles.badgeFailed : styles.badgeRequested;

  return (
    <span className={`${styles.badge} ${className}`}>
      {(REFUND_STATUS_LABELS[key] ?? key) || '-'}
    </span>
  );
}

async function fetchAllUsers() {
  const users = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await adminApi.users({ page, size: 200, sort: 'userId', direct: 'ASC' });
    const content = Array.isArray(res?.content) ? res.content : [];
    users.push(...content);

    const nextTotal = Number(res?.totalPages ?? 1);
    totalPages = Number.isFinite(nextTotal) && nextTotal > 0 ? nextTotal : 1;
    page += 1;
  }

  return users;
}

function targetLabel(targetType, targetId) {
  const key = String(targetType ?? '').toLowerCase();
  const label = TARGET_LABELS[key] ?? (targetType ? String(targetType) : '미지정');
  return targetId != null ? `${label} #${targetId}` : label;
}

export default function AdminRefundList() {
  const [refunds, setRefunds] = useState([]);
  const [paymentById, setPaymentById] = useState({});
  const [userNameById, setUserNameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [refundData, paymentData, users] = await Promise.all([
        adminApi.getRefunds(),
        adminApi.getPayments(),
        fetchAllUsers().catch(() => []),
      ]);

      const refundRows = Array.isArray(refundData) ? refundData : [];
      refundRows.sort((a, b) => Number(b?.refundId ?? 0) - Number(a?.refundId ?? 0));
      setRefunds(refundRows);

      const paymentRows = Array.isArray(paymentData) ? paymentData : [];
      const map = paymentRows.reduce((acc, payment) => {
        acc[payment.paymentId] = payment;
        return acc;
      }, {});
      setPaymentById(map);

      const nameMap = users.reduce((acc, user) => {
        const id = String(user?.userId ?? '').trim();
        if (!id) return acc;
        acc[id] = String(
          user?.userNm ?? user?.userName ?? user?.name ?? user?.nickName ?? user?.nickname ?? user?.email ?? id
        );
        return acc;
      }, {});
      setUserNameById(nameMap);
    } catch (e) {
      setRefunds([]);
      setPaymentById({});
      setUserNameById({});
      setError(e?.message || '환불 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return refunds.filter((refund) => {
      if (statusFilter !== 'all' && refund?.refundSt !== statusFilter) return false;
      if (!q) return true;

      const payment = paymentById[refund?.paymentId];
      const userId = String(payment?.userId ?? '').trim();
      const userName = userNameById[userId] || '';
      const haystack = [
        refund?.refundId,
        refund?.paymentId,
        refund?.refundReason,
        payment?.provider,
        payment?.merchantUid,
        payment?.idempotencyKey,
        userId,
        userName,
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');

      return haystack.includes(q);
    });
  }, [keyword, paymentById, refunds, statusFilter, userNameById]);

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
          <h2 className={styles.title}>환불 내역</h2>
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
            {REFUND_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>검색</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="환불ID, 결제ID, 유저이름"
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
            setKeyword('');
            setPage(1);
          }}
        >
          필터 초기화
        </button>
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      {!loading && rows.length === 0 ? (
        <div className={styles.empty}>조건에 맞는 환불 내역이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>결제대상</th>
                <th>결제ID</th>
                <th>유저이름</th>
                <th>금액</th>
                <th>상태</th>
                <th>결제사 정보</th>
                <th>식별키</th>
                <th>결제시각</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((refund) => {
                const payment = paymentById[refund.paymentId] || {};
                const userId = String(payment?.userId ?? '').trim();
                const userName = userNameById[userId] || '-';

                return (
                  <tr key={refund.refundId}>
                    <td>{targetLabel(payment?.targetType, payment?.targetId)}</td>
                    <td>
                      <div>#{refund.paymentId ?? '-'}</div>
                      <div className={styles.subCell}>환불ID: #{refund.refundId ?? '-'}</div>
                    </td>
                    <td>
                      <div>{userName}</div>
                      <div className={styles.subCell}>회원ID: {userId || '-'}</div>
                    </td>
                    <td>{formatMoney(refund.refundPrice, payment?.currency || 'KRW')}</td>
                    <td>
                      <RefundStatusBadge status={refund.refundSt} />
                    </td>
                    <td>
                      <div>{payment?.provider || '-'}</div>
                      <div className={styles.subCell}>결제사 ID: {payment?.providerPaymentId || '-'}</div>
                    </td>
                    <td>
                      <div className={styles.ellipsis}>{payment?.merchantUid || '-'}</div>
                      <div className={styles.subCell}>멱등키: {payment?.idempotencyKey || '-'}</div>
                    </td>
                    <td>{formatDateTime(refund.completedAt || payment?.paidAt)}</td>
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