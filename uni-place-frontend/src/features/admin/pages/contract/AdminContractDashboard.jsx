import React, { useEffect, useState } from 'react';
import styles from './AdminContractDashboard.module.css';
import { adminApi } from '../../api/adminApi';

/* ========= 유틸 ========= */
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const formatPercent = (v) => `${toNum(v).toFixed(1)}%`;

const isToday = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

/* ========= 도넛 ========= */
function Donut({ percent, label }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));

  const r = 52; // 🔥 키움 (기존 36 → 52)
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 140 140" className={styles.donut}>
        {/* 배경 */}
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="#eee"
          strokeWidth="14"
          fill="none"
        />

        {/* 값 */}
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="#5b5bd6"
          strokeWidth="14"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>

      <div className={styles.donutCenter}>
        <strong>{p.toFixed(1)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function summarizeRow(contract, charges, now) {
  const start = new Date(contract?.contractStart);
  const end = new Date(contract?.contractEnd);

  const totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;

  const scheduledRaw =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    1;

  const scheduledMonths = Math.max(0, Math.min(totalMonths, scheduledRaw));

  const rentCharges = (charges ?? []).filter((c) => {
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
  }

  return {
    contractId: contract.contractId,
    status,
  };
}

export default function AdminContractDashboard() {
  const [metrics, setMetrics] = useState({
    approvalRate: 0,
    requested: 0,
    approved: 0,
    active: 0,
    todayCheckin: 0,
    todayCheckout: 0,
    longUnpaid: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        /* ========= 계약 전체 조회 ========= */
        let page = 1;
        let totalPages = 1;
        let contracts = [];

        while (page <= totalPages) {
          const res = await adminApi.getContracts({
            page,
            size: 50,
            sort: 'contractId',
            direct: 'DESC',
          });

          contracts = [...contracts, ...(res?.content ?? [])];
          totalPages = res?.totalPages ?? 1;
          page++;
        }

        /* ========= 상태 분류 ========= */
        const total = contracts.length;

        const requested = contracts.filter(
          (c) => c.contractStatus === 'requested'
        ).length;

        const approved = contracts.filter(
          (c) => c.contractStatus === 'approved'
        ).length;

        const active = contracts.filter(
          (c) => c.contractStatus === 'active'
        ).length;

        /* ========= 승인율 ========= */
        const approvalRate =
          total > 0 ? ((approved + active) / total) * 100 : 0;

        /* ========= 체크인/아웃 ========= */
        const todayCheckin = contracts.filter((c) =>
          isToday(c.contractStart)
        ).length;

        const todayCheckout = contracts.filter((c) =>
          isToday(c.contractEnd)
        ).length;

        /* ========= 월세 데이터 ========= */
        const charges = await adminApi.getMonthlyCharges();

        // contract별 묶기
        const chargeMap = new Map();

        (charges ?? []).forEach((c) => {
          const id = c.contractId;
          if (!id) return;

          if (!chargeMap.has(id)) chargeMap.set(id, []);
          chargeMap.get(id).push(c);
        });

        const now = new Date();

        const rows = contracts.map((contract) =>
          summarizeRow(contract, chargeMap.get(contract.contractId), now)
        );

        const longUnpaid = rows.filter((row) => {
          const match = row.status.match(/\((\d+)\)/);
          const count = match ? Number(match[1]) : 0;

          return (
            (row.status.includes('미납') || row.status.includes('연체')) &&
            count >= 2
          );
        }).length;

        setMetrics({
          approvalRate,
          requested,
          approved,
          active,
          todayCheckin,
          todayCheckout,
          longUnpaid,
        });
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, []);

  return (
    <div className={styles.grid}>
      {/* 계약 승인율 */}
      <div className={styles.card}>
        <div className={styles.title}>계약 확률</div>
        <Donut percent={metrics.approvalRate} label="승인율" />
      </div>

      {/* 계약 신청 */}
      <div className={styles.card}>
        <div className={styles.title}>계약 상태</div>
        <div className={styles.value}>
          <p>요청 {metrics.requested}건</p>
          <p>승인 {metrics.approved}건</p>
          <p>활성 {metrics.active}건</p>
        </div>
      </div>

      {/* 체크인/아웃 */}
      <div className={styles.card}>
        <div className={styles.title}>오늘 입퇴실 예정</div>
        <div className={styles.value}>
          <p>입실 {metrics.todayCheckin}건</p>
          <div className={styles.divider} />
          <p>퇴실 {metrics.todayCheckout}건</p>
        </div>
      </div>

      {/* 장기 미납 */}
      <div className={styles.card}>
        <div className={styles.title}>장기 미납</div>
        <div className={styles.value}>{metrics.longUnpaid}세대</div>
      </div>
    </div>
  );
}
