import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from '../payment/AdminPaymentTable.module.css';

const CHARGE_STATUS_OPTIONS = [
  { value: 'unpaid', label: '미납' },
  { value: 'paid', label: '납부완료' },
];

function formatMoney(value) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return '-';
  return `${safe.toLocaleString('ko-KR')} KRW`;
}

function pageWindow(page, totalPages, radius = 2) {
  const from = Math.max(1, page - radius);
  const to = Math.min(totalPages, page + radius);
  const result = [];
  for (let p = from; p <= to; p += 1) result.push(p);
  return result;
}

function ChargeStatusBadge({ status }) {
  const key = String(status ?? '').toLowerCase();
  const className = key === 'paid' ? styles.badgePaid : styles.badgeReady;
  const label = key === 'paid' ? '납부완료' : key === 'unpaid' ? '미납' : key;
  return <span className={`${styles.badge} ${className}`}>{label || '-'}</span>;
}

export default function AdminMonthlyChargeList() {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [contractIdFilter, setContractIdFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const contractId = contractIdFilter.trim();
      const data = await adminApi.getMonthlyCharges(
        contractId === '' ? undefined : Number(contractId)
      );
      const rows = Array.isArray(data) ? data : [];
      rows.sort((a, b) => Number(b?.chargeId ?? 0) - Number(a?.chargeId ?? 0));
      setCharges(rows);
    } catch (e) {
      setCharges([]);
      setError(e?.message || '정산 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [contractIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return charges.filter((charge) => {
      if (statusFilter !== 'all' && charge?.chargeSt !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        charge?.chargeId,
        charge?.contractId,
        charge?.billingDt,
        charge?.chargeType,
        charge?.paymentId,
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');
      return haystack.includes(q);
    });
  }, [charges, keyword, statusFilter]);

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
          <h2 className={styles.title}>정산 내역</h2>
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
            {CHARGE_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>계약 ID</span>
          <input
            className={styles.input}
            value={contractIdFilter}
            placeholder="예: 101"
            onChange={(e) => {
              setContractIdFilter(e.target.value);
              setPage(1);
            }}
          />
        </label>

        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>검색</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="chargeId, billingDt, chargeType..."
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
            setContractIdFilter('');
            setKeyword('');
            setPage(1);
          }}
        >
          필터 초기화
        </button>
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      {!loading && rows.length === 0 ? (
        <div className={styles.empty}>조건에 맞는 정산 내역이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>정산 ID</th>
                <th>계약 ID</th>
                <th>청구월</th>
                <th>항목</th>
                <th>금액</th>
                <th>상태</th>
                <th>결제 ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((charge) => (
                <tr key={charge.chargeId}>
                  <td>
                    <strong>#{charge.chargeId}</strong>
                  </td>
                  <td>{charge.contractId ?? '-'}</td>
                  <td>{charge.billingDt || '-'}</td>
                  <td>{charge.chargeType || '-'}</td>
                  <td>{formatMoney(charge.price)}</td>
                  <td>
                    <ChargeStatusBadge status={charge.chargeSt} />
                  </td>
                  <td>{charge.paymentId ?? '-'}</td>
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
