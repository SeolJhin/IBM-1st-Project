import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import styles from './AdminPaymentTable.module.css';

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
      : key === 'fail'
        ? styles.badgeCancelled
      : key === 'cancelled'
        ? styles.badgeCancelled
        : key === 'pending'
          ? styles.badgePending
          : key === 'disputed'
            ? styles.badgeDisputed
            : styles.badgeReady;
  const label = key === 'fail' ? '실패' : ((PAYMENT_STATUS_LABELS[key] ?? key) || '-');

  return (
    <span className={`${styles.badge} ${className}`}>
      {label}
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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [paymentData, users] = await Promise.all([
        adminApi.getPayments(),
        fetchAllUsers().catch(() => []),
      ]);

      const rows = Array.isArray(paymentData) ? paymentData : [];
      rows.sort((a, b) => Number(b?.paymentId ?? 0) - Number(a?.paymentId ?? 0));
      setPayments(rows);

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
      setPayments([]);
      setUserNameById({});
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
    const paymentId = (params.get('paymentId') || '').trim();
    const keywordParam = (params.get('keyword') || '').trim();
    const nextKeyword = paymentId || keywordParam;
    if (!nextKeyword) return;
    setKeyword(nextKeyword);
    setPage(1);
  }, [searchKey]);

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
      if (statusFilter !== 'all' && payment?.paymentSt !== statusFilter) return false;
      if (providerFilter !== 'all' && payment?.provider !== providerFilter) return false;
      if (!q) return true;

      const userId = String(payment?.userId ?? '').trim();
      const userName = userNameById[userId] || '';
      const haystack = [
        payment?.paymentId,
        payment?.merchantUid,
        payment?.provider,
        payment?.providerPaymentId,
        payment?.targetType,
        payment?.targetId,
        userId,
        userName,
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
              {rows.map((payment) => {
                const userId = String(payment?.userId ?? '').trim();
                const userName = userNameById[userId] || '-';

                return (
                  <tr key={payment.paymentId}>
                    <td>{targetLabel(payment.targetType, payment.targetId)}</td>
                    <td>
                      <div>#{payment.paymentId ?? '-'}</div>
                      <div className={styles.subCell}>서비스ID: {payment.serviceGoodsId ?? '-'}</div>
                    </td>
                    <td>
                      <div>{userName}</div>
                      <div className={styles.subCell}>회원ID: {userId || '-'}</div>
                    </td>
                    <td>
                      <div>{formatMoney(payment.totalPrice, payment.currency)}</div>
                      <div className={styles.subCell}>
                        실결제: {formatMoney(payment.capturedPrice, payment.currency)}
                      </div>
                    </td>
                    <td>
                      <PaymentStatusBadge status={payment.paymentSt} />
                    </td>
                    <td>
                      <div>{payment.provider || '-'}</div>
                      <div className={styles.subCell}>결제사 ID: {payment.providerPaymentId || '-'}</div>
                      <div className={styles.subCell}>결제수단 ID: {payment.paymentMethodId ?? '-'}</div>
                    </td>
                    <td>
                      <div className={styles.ellipsis}>{payment.merchantUid || '-'}</div>
                      <div className={styles.subCell}>멱등키: {payment.idempotencyKey || '-'}</div>
                    </td>
                    <td>{formatDateTime(payment.paidAt || payment.createdAt)}</td>
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
