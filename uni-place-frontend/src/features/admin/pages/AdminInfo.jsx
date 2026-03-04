import React, { useCallback, useEffect, useState } from 'react';
import styles from './AdminInfo.module.css';
import { adminApi } from '../api/adminApi';

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatNumber(value) {
  return toNum(value).toLocaleString('ko-KR');
}

function formatMoney(value) {
  return `${toNum(value).toLocaleString('ko-KR')}원`;
}

function formatPercent(value) {
  return `${toNum(value).toFixed(1)}%`;
}

function monthKey(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function sameMonth(value, base) {
  return monthKey(value) === monthKey(base);
}

function pct(num, den) {
  if (!den) return 0;
  return (toNum(num) / toNum(den)) * 100;
}

function dayDiff(from, to) {
  const a = toDate(from);
  const b = toDate(to);
  if (!a || !b) return null;
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function fetchAllPages(fetchPage) {
  let page = 1;
  let totalPages = 1;
  const rows = [];

  while (page <= totalPages) {
    const res = await fetchPage(page);
    const content = Array.isArray(res?.content) ? res.content : [];
    rows.push(...content);

    const nextTotal = Number(res?.totalPages ?? 1);
    totalPages = Number.isFinite(nextTotal) && nextTotal > 0 ? nextTotal : 1;
    page += 1;
  }

  return rows;
}

function Donut({ percent, label }) {
  const p = Math.max(0, Math.min(100, toNum(percent)));
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 140 140" className={styles.donut}>
        <circle cx="70" cy="70" r={r} className={styles.donutTrack} />
        <circle
          cx="70"
          cy="70"
          r={r}
          className={styles.donutValue}
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className={styles.donutCenter}>
        <strong>{formatPercent(p)}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function LineChart({ data }) {
  const width = 520;
  const height = 220;
  const padX = 26;
  const padY = 18;
  const values = data.map((d) => toNum(d.value));
  const max = Math.max(1, ...values);

  const points = data.map((d, idx) => {
    const x = padX + ((width - padX * 2) * idx) / Math.max(1, data.length - 1);
    const y = height - padY - (toNum(d.value) / max) * (height - padY * 2);
    return { ...d, x, y };
  });

  const pathD = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  return (
    <div className={styles.lineWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineSvg}>
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} className={styles.axis} />
        <path d={pathD} className={styles.linePath} />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3.5" className={styles.lineDot} />
        ))}
      </svg>
      <div className={styles.lineLabels}>
        {data.map((d) => (
          <span key={`l-${d.label}`}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function AdminInfo() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [buildings, rooms, spaces, contracts, paymentsRaw, chargesRaw, complains, userCount] =
        await Promise.all([
          fetchAllPages((page) =>
            adminApi.getBuildings({ page, size: 200, sort: 'buildingId', direct: 'ASC' })
          ),
          fetchAllPages((page) =>
            adminApi.getRooms({ page, size: 200, sort: 'roomId', direct: 'ASC' })
          ),
          fetchAllPages((page) =>
            adminApi.getSpaces({ page, size: 200, sort: 'spaceId', direct: 'ASC' })
          ),
          fetchAllPages((page) =>
            adminApi.getContracts({ page, size: 200, sort: 'contractId', direct: 'DESC' })
          ),
          adminApi.getPayments().catch(() => []),
          adminApi.getMonthlyCharges().catch(() => []),
          fetchAllPages((page) =>
            adminApi.getComplains({ page, size: 200, sort: 'compId', direct: 'DESC' })
          ).catch(() => []),
          adminApi.userCountByRole('user').catch(() => 0),
        ]);

      const payments = Array.isArray(paymentsRaw) ? paymentsRaw : [];
      const charges = Array.isArray(chargesRaw) ? chargesRaw : [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const activeContracts = contracts.filter(
        (c) => String(c?.contractStatus ?? '').toLowerCase() === 'active'
      );
      const endedContracts = contracts.filter((c) => {
        const st = String(c?.contractStatus ?? '').toLowerCase();
        return st === 'ended' || st === 'cancelled';
      });

      const occupiedRoomIds = new Set(activeContracts.map((c) => c?.roomId).filter((v) => v != null));
      const activeTenantIds = new Set(
        activeContracts.map((c) => String(c?.tenantUserId ?? '').trim()).filter(Boolean)
      );

      const totalRooms = rooms.length;
      const occupiedRooms = occupiedRoomIds.size;
      const vacancyRate = pct(totalRooms - occupiedRooms, totalRooms);

      const avgContractPeriodDays = activeContracts.length
        ? activeContracts.reduce((sum, c) => {
            const s = toDate(c?.contractStart);
            const e = toDate(c?.contractEnd);
            if (!s || !e) return sum;
            return sum + Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
          }, 0) / activeContracts.length
        : 0;
      const avgContractPeriodMonths = avgContractPeriodDays / 30;

      const monthlyRevenue = payments
        .filter(
          (p) => String(p?.paymentSt ?? '').toLowerCase() === 'paid' && sameMonth(p?.paidAt, now)
        )
        .reduce((sum, p) => sum + toNum(p?.capturedPrice ?? p?.totalPrice), 0);

      const unpaidMonthlyRent = charges.filter(
        (c) => String(c?.chargeSt ?? '').toLowerCase() === 'unpaid'
      ).length;

      const expiringContracts = activeContracts.filter((c) => {
        const d = dayDiff(today, c?.contractEnd);
        return d != null && d >= 0 && d <= 30;
      }).length;

      const newMoveIn = activeContracts.filter((c) => sameMonth(c?.contractStart, now)).length;
      const checkOut = endedContracts.filter((c) => sameMonth(c?.contractEnd, now)).length;

      const unresolvedComplaints = complains.filter(
        (c) => String(c?.compSt ?? '').toLowerCase() !== 'resolved'
      ).length;

      const unavailableSpaceCount = spaces.filter((s) => {
        const options = String(s?.spaceOptions ?? '').toLowerCase();
        return options.includes('사용불가') || options.includes('점검') || options.includes('공사');
      }).length;
      const facilityUtilRate = pct(spaces.length - unavailableSpaceCount, spaces.length);

      const months = Array.from({ length: 6 }, (_, idx) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
        return d;
      });

      const monthlyRevenueSeries = months.map((m) => {
        const label = `${m.getMonth() + 1}월`;
        const value = payments
          .filter(
            (p) => String(p?.paymentSt ?? '').toLowerCase() === 'paid' && sameMonth(p?.paidAt, m)
          )
          .reduce((sum, p) => sum + toNum(p?.capturedPrice ?? p?.totalPrice), 0);
        return { label, value };
      });

      setMetrics({
        totalBuildings: buildings.length,
        totalRooms,
        occupiedRooms,
        vacancyRate,
        generalUsers: toNum(userCount),
        activeTenants: activeTenantIds.size,
        avgContractPeriodMonths,
        monthlyRevenue,
        unpaidMonthlyRent,
        expiringContracts,
        newMoveIn,
        checkOut,
        unresolvedComplaints,
        totalFacilities: spaces.length,
        unavailableSpaceCount,
        facilityUtilRate,
        monthlyRevenueSeries,
      });

      setLastUpdated(new Date());
    } catch (e) {
      setError(e?.message || '대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={styles.page} aria-busy={loading}>
      <div className={styles.header}>
        <div>
          <h1>관리자 운영 대시보드</h1>
          <p>공유주거 플랫폼의 운영 상태를 한눈에 확인합니다.</p>
        </div>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? '갱신 중...' : '새로고침'}
        </button>
      </div>

      <div className={styles.meta}>마지막 갱신: {lastUpdated ? lastUpdated.toLocaleString('ko-KR') : '-'}</div>
      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.section}>
        <h2>운영 KPI</h2>
        <div className={styles.kpiGrid}>
          <div className={styles.kpi}><span>총 등록 건물 수</span><strong>{loading ? '...' : formatNumber(metrics?.totalBuildings)}</strong></div>
          <div className={styles.kpi}><span>총 등록 방 수</span><strong>{loading ? '...' : formatNumber(metrics?.totalRooms)}</strong></div>
          <div className={styles.kpi}><span>공실률</span><strong>{loading ? '...' : formatPercent(metrics?.vacancyRate)}</strong></div>
          <div className={styles.kpi}><span>일반회원 수</span><strong>{loading ? '...' : formatNumber(metrics?.generalUsers)}</strong></div>
          <div className={styles.kpi}><span>입주자 수(계약 진행중)</span><strong>{loading ? '...' : formatNumber(metrics?.activeTenants)}</strong></div>
          <div className={styles.kpi}><span>평균 계약 기간</span><strong>{loading ? '...' : `${toNum(metrics?.avgContractPeriodMonths).toFixed(1)}개월`}</strong></div>
          <div className={styles.kpi}><span>월 매출</span><strong>{loading ? '...' : formatMoney(metrics?.monthlyRevenue)}</strong></div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>그래프</h2>
        <div className={styles.chartGrid}>
          <div className={styles.panel}>
            <h3>공실률 도넛 그래프</h3>
            <Donut percent={metrics?.vacancyRate} label="공실률" />
            <p className={styles.helper}>공실률 = (전체 등록 방 수 - 계약 진행중인 방 수) / 전체 등록 방 수</p>
          </div>
          <div className={styles.panel}>
            <h3>월매출 선그래프 (최근 6개월)</h3>
            <LineChart data={metrics?.monthlyRevenueSeries || []} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>운영 상태</h2>
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}><span>미납 월세</span><strong>{loading ? '...' : formatNumber(metrics?.unpaidMonthlyRent)}건</strong></div>
          <div className={styles.statusCard}><span>계약 만료 예정</span><strong>{loading ? '...' : formatNumber(metrics?.expiringContracts)}건</strong></div>
          <div className={styles.statusCard}><span>신규 입주</span><strong>{loading ? '...' : formatNumber(metrics?.newMoveIn)}건</strong></div>
          <div className={styles.statusCard}><span>퇴실</span><strong>{loading ? '...' : formatNumber(metrics?.checkOut)}건</strong></div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>서비스</h2>
        <div className={styles.serviceGrid}>
          <div className={styles.serviceCard}>
            <span>미처리 민원 수</span>
            <strong>{loading ? '...' : formatNumber(metrics?.unresolvedComplaints)}건</strong>
          </div>
          <div className={styles.serviceCard}>
            <span>시설 가동률</span>
            <strong>{loading ? '...' : formatPercent(metrics?.facilityUtilRate)}</strong>
            <p className={styles.helper}>전체 시설 {formatNumber(metrics?.totalFacilities)}개 / 사용불가 {formatNumber(metrics?.unavailableSpaceCount)}개</p>
          </div>
        </div>
      </section>
    </div>
  );
}
