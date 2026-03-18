import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminRentManagement.module.css';

const CONTRACT_FILTERS = [
  { key: 'active', label: '계약중' },
  { key: 'ended', label: '종료 내역' },
];

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthDiff(start, end) {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

function monthRangeInclusive(start, end) {
  if (!start || !end) return 0;
  const diff = monthDiff(toMonthStart(start), toMonthStart(end));
  return diff >= 0 ? diff + 1 : 0;
}

function fmtDate(v) {
  return v ? String(v).slice(0, 10) : '-';
}

function fmtMoney(v) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('ko-KR');
}

function contractStatusKey(contractStatus) {
  const key = String(contractStatus || '').toLowerCase();
  if (key === 'cancelled') return 'cancelled'; // 취소된 계약은 별도 분류
  if (key === 'active' || key === 'approved' || key === 'requested')
    return 'active';
  return 'ended';
}

function summarizeRow(contract, charges, now) {
  const start = parseDate(contract?.contractStart);
  const end = parseDate(contract?.contractEnd);
  const totalMonths = monthRangeInclusive(start, end);
  const scheduledRaw =
    start && now ? monthDiff(toMonthStart(start), toMonthStart(now)) + 1 : 0;
  const scheduledMonths = Math.max(0, Math.min(totalMonths, scheduledRaw));

  const rentCharges = (Array.isArray(charges) ? charges : []).filter((c) => {
    const type = String(c?.chargeType || '').toLowerCase();
    return !type || type === 'rent';
  });

  const paid = rentCharges.filter(
    (c) => String(c?.chargeSt || '').toLowerCase() === 'paid'
  ).length;
  const overdue = rentCharges.filter(
    (c) => String(c?.chargeSt || '').toLowerCase() === 'overdue'
  ).length;

  let status = '완납';
  if (overdue > 0) {
    status = `연체(${overdue})`;
  } else if (paid < scheduledMonths) {
    status = `미납(${scheduledMonths - paid})`;
  } else if (paid > scheduledMonths) {
    status = `선납(${paid - scheduledMonths})`;
  }

  return {
    contractId: contract.contractId,
    buildingNm: contract.buildingNm ?? '-',
    roomNo: contract.roomNo ?? '-',
    tenantUserId: contract.tenantUserId ?? '-',
    contractPeriod: `${fmtDate(contract.contractStart)} ~ ${fmtDate(
      contract.contractEnd
    )}`,
    progress: `${totalMonths} / ${scheduledMonths} / ${paid}`,
    status,
    rentPrice: contract.rentPrice,
    contractStatusKey: contractStatusKey(contract.contractStatus),
  };
}

async function fetchAllContracts() {
  const all = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await adminApi.getContracts({
      page,
      size: 100,
      sort: 'contractId',
      direct: 'DESC',
    });
    const content = Array.isArray(res?.content) ? res.content : [];
    all.push(...content);
    totalPages = Number(res?.totalPages ?? 1);
    page += 1;
  }
  return all;
}

export default function AdminRentManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [contracts, charges] = await Promise.all([
        fetchAllContracts(),
        adminApi.getMonthlyCharges(),
      ]);

      const byContract = new Map();
      (Array.isArray(charges) ? charges : []).forEach((charge) => {
        const id = charge?.contractId;
        if (!id) return;
        if (!byContract.has(id)) byContract.set(id, []);
        byContract.get(id).push(charge);
      });

      const now = new Date();
      const nextRows = contracts.map((contract) =>
        summarizeRow(contract, byContract.get(contract.contractId), now)
      );
      setRows(nextRows);
    } catch (e) {
      setRows([]);
      setError(e?.message || '월세 관리 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFilter = (key) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredRows = useMemo(() => {
    // 취소된 계약은 월세 관리에서 제외
    const nonCancelled = rows.filter(
      (row) => row.contractStatusKey !== 'cancelled'
    );
    if (filters.size === 0 || filters.has('all')) return nonCancelled;
    return nonCancelled.filter((row) => filters.has(row.contractStatusKey));
  }, [rows, filters]);

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <div>
          <h2 className={styles.title}>월세 관리</h2>
          <p className={styles.sub}>
            전체 계약 <strong>{filteredRows.length}</strong>건
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={load}
          disabled={loading}
        >
          {loading ? '로딩중...' : '새로고침'}
        </button>
      </div>

      <div className={styles.filterBox}>
        {CONTRACT_FILTERS.map((item) => (
          <label key={item.key} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filters.has(item.key)}
              onChange={() => toggleFilter(item.key)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {!loading && !error && filteredRows.length === 0 ? (
        <div className={styles.emptyBox}>조회 결과가 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>계약 ID</th>
                <th>건물명</th>
                <th>방호실</th>
                <th>회원 ID</th>
                <th>계약기간</th>
                <th>계약/예정/납입</th>
                <th>상태</th>
                <th>가격(원)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.contractId}>
                  <td>#{row.contractId}</td>
                  <td>{row.buildingNm}</td>
                  <td>{row.roomNo}호</td>
                  <td>{row.tenantUserId}</td>
                  <td>{row.contractPeriod}</td>
                  <td>{row.progress}</td>
                  <td>{row.status}</td>
                  <td>{fmtMoney(row.rentPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
