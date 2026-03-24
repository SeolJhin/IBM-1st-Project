import React, { useCallback, useEffect, useState } from 'react';
import styles from './AdminInfo.module.css';
import { adminApi } from '../api/adminApi';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const formatNumber = (v) => toNum(v).toLocaleString('ko-KR');
const formatMoney = (v) => `${toNum(v).toLocaleString('ko-KR')}원`;
const formatPercent = (v) => `${toNum(v).toFixed(1)}%`;

/* ================= 날짜 유틸 ================= */
const isToday = (date) => {
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isTodaySafe = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const eq = (a, b) => String(a || '').toLowerCase() === String(b).toLowerCase();

const isYesterday = (date) => {
  const d = new Date(date);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
};

const diffDays = (date) =>
  (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);

const diffFromNowDays = (date) =>
  (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);

const getPaymentDate = (p) => {
  if (p.paidAt) return new Date(p.paidAt);
  return null;
};
const getPaymentAmount = (p) => toNum(p?.capturedPrice ?? p?.totalPrice);

const isRentPayment = (p) => {
  const t = String(p?.targetType ?? '').toLowerCase();
  return t === 'monthly_charge' || t === 'rent' || t === 'charge';
};

const isOrderPayment = (p) => {
  const t = String(p?.targetType ?? '').toLowerCase();
  return t === 'order' || t === 'room_service' || t === 'roomservice';
};

/* ================= 알림 컴포넌트 ================= */
function AlertSection({ alerts }) {
  const renderList = (list) =>
    list.map((item, i) => (
      <div key={i} className={styles.alertItem}>
        - {item.text}
      </div>
    ));

  return (
    <div className={styles.alertGrid}>
      <div className={styles.alertCol}>
        <div className={`${styles.alertTitle} ${styles.danger}`}>
          🔴 긴급 (즉시 처리)
        </div>
        {alerts.danger.length > 0 ? (
          renderList(alerts.danger)
        ) : (
          <div>- 없음</div>
        )}
      </div>

      <div className={styles.alertCol}>
        <div className={`${styles.alertTitle} ${styles.warning}`}>🟡 주의</div>
        {alerts.warning.length > 0 ? (
          renderList(alerts.warning)
        ) : (
          <div>- 없음</div>
        )}
      </div>

      <div className={styles.alertCol}>
        <div className={`${styles.alertTitle} ${styles.info}`}>🟢 참고</div>
        {alerts.info.length > 0 ? renderList(alerts.info) : <div>- 없음</div>}
      </div>
    </div>
  );
}

/* ================= 알림 생성 ================= */
function buildAlerts(metrics) {
  const danger = [];
  const warning = [];
  const info = [];

  if (metrics?.unpaidMonthlyRent > 0) {
    danger.push({
      text: `월세 미납 (${metrics.unpaidMonthlyRent}건)`,
    });
  }

  if (metrics?.paymentFailSpike >= 5) {
    danger.push({
      text: `결제 실패 급증 (${metrics.paymentFailSpike}건)`,
    });
  }

  if (metrics?.expiringContracts > 0) {
    warning.push({
      text: `계약 만료 임박 (${metrics.expiringContracts}건)`,
    });
  }

  if (metrics?.longVacancyRooms > 0) {
    warning.push({
      text: `공실 장기 방치 (${metrics.longVacancyRooms}개)`,
    });
  }

  if (metrics?.newUsers > 0) {
    info.push({
      text: `신규 가입자 (${metrics.newUsers}명)`,
    });
  }

  if (metrics?.qnaCount > 0) {
    info.push({
      text: `1:1문의 (${metrics.qnaCount}건)`,
    });
  }

  return { danger, warning, info };
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

const formatYAxis = (v) => `${Math.round(v / 10000)}만`;

function LineChart({ data, rangeType }) {
  const width = 520;
  const height = 220;
  const padX = 40;
  const padY = 20;

  const unitMap = {
    daily: 100000, // 10만
    monthly: 1000000, // 100만
    yearly: 10000000, // 1000만
  };

  const unit = unitMap[rangeType];

  const rawMax = Math.max(...data.map((d) => toNum(d.value)), 1);

  const max = Math.ceil(rawMax / unit) * unit;
  const scaledMax = Math.ceil(max / unit) * unit;

  const steps = 5;

  const yTicks = Array.from({ length: steps + 1 }, (_, i) => {
    const value = (max / steps) * i;

    const y = height - padY - (value / max) * (height - padY * 2);

    return { value, y };
  });

  const points = data.map((d, idx) => {
    const x = padX + ((width - padX * 2) * idx) / Math.max(1, data.length - 1);
    const y =
      height - padY - (toNum(d.value) / scaledMax) * (height - padY * 2);
    return { ...d, x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const [hover, setHover] = useState(null);

  return (
    <div className={styles.lineWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineSvg}>
        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="#ddd"
          strokeWidth="4"
        />

        <path d={pathD} className={styles.linePath} strokeDasharray="5 5" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            className={styles.lineDot}
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {points.map((p, i) => (
          <line
            key={`tick-${i}`}
            x1={p.x}
            y1={height - padY}
            x2={p.x}
            y2={height - padY + 6}
            stroke="#999"
          />
        ))}

        {points.map((p) => (
          <text
            key={`label-${p.label}`}
            x={p.x}
            y={height - padY + 18}
            textAnchor="middle"
            fontSize="10"
            fill="#666"
          >
            {p.label}
          </text>
        ))}

        {hover && (
          <g>
            <rect
              x={hover.x - 40}
              y={hover.y - 40}
              width="80"
              height="24"
              rx="6"
              fill="#333"
            />
            <text
              x={hover.x}
              y={hover.y - 24}
              textAnchor="middle"
              fill="#fff"
              fontSize="13"
            >
              {formatMoney(hover.value)}
            </text>
          </g>
        )}

        {yTicks.map((t, i) => (
          <line
            key={`y-line-${i}`}
            x1={padX}
            y1={t.y}
            x2={width - padX}
            y2={t.y}
            stroke="#eee"
          />
        ))}

        {yTicks.map((t, i) => (
          <text
            key={`y-text-${i}`}
            x={padX - 8}
            y={t.y + 3}
            textAnchor="end"
            fontSize="10"
            fill="#888"
          >
            {formatYAxis(t.value, rangeType)}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ================= 메인 ================= */

export default function AdminInfo() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [rangeType, setRangeType] = useState('daily');
  const [isOpen, setIsOpen] = useState(false);

  const getDateKey = (date, type) => {
    const d = new Date(date);

    if (type === 'daily') {
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    }

    if (type === 'monthly') {
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    if (type === 'yearly') {
      return `${d.getFullYear()}`;
    }
  };

  const generateRange = (type) => {
    const now = new Date();
    const arr = [];

    if (type === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        arr.push(getDateKey(d, 'daily'));
      }
    }

    if (type === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        arr.push(getDateKey(d, 'monthly'));
      }
    }

    if (type === 'yearly') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setFullYear(now.getFullYear() - i);
        arr.push(getDateKey(d, 'yearly'));
      }
    }

    return arr;
  };

  const buildRevenueSeries = (payments, type) => {
    const range = generateRange(type);

    const map = {};
    range.forEach((k) => (map[k] = 0));

    payments.forEach((p) => {
      if (!p.paidAt) return;

      const key = getDateKey(p.paidAt, type);
      if (map[key] !== undefined) {
        map[key] += toNum(p.totalPrice);
      }
    });

    return range.map((k) => ({
      label: k,
      value: map[k],
    }));
  };

  const alerts = buildAlerts(metrics);

  const fetchAllUsers = async () => {
    let page = 1;
    let all = [];

    while (true) {
      const res = await adminApi.users({ page, size: 10 });
      const content = res?.content ?? [];
      all = [...all, ...content];

      if (page >= (res?.totalPages ?? 1)) break;
      page++;
    }

    return all;
  };

  const fetchAllReservations = async () => {
    let page = 1;
    let all = [];

    while (true) {
      const res = await adminApi.tourReservations({
        page,
        size: 15,
        sort: 'tourId',
        direct: 'DESC',
      });

      const content = res?.content ?? [];
      all = [...all, ...content];

      if (page >= (res?.totalPages ?? 1)) break;
      page++;
    }

    return all;
  };

  const fetchAllContracts = async () => {
    let page = 1;
    let all = [];

    while (true) {
      const res = await adminApi.getContracts({
        page,
        size: 50,
        sort: 'contractId',
        direct: 'DESC',
      });

      const content = res?.content ?? [];
      all = [...all, ...content];

      if (page >= (res?.totalPages ?? 1)) break;
      page++;
    }

    return all;
  };

  const fetchAllRooms = async () => {
    let page = 1;
    let all = [];

    while (true) {
      const res = await adminApi.getRooms({
        page,
        size: 50, // 넉넉하게 (성능 고려해서 50~100 추천)
        sort: 'roomId',
        direct: 'DESC',
      });

      const content = res?.content ?? [];
      all = [...all, ...content];

      if (page >= (res?.totalPages ?? 1)) break;
      page++;
    }

    return all;
  };

  const fetchAllQna = async () => {
    let page = 1;
    let all = [];

    while (true) {
      const res = await adminApi.getQna({
        page,
        size: 50,
        sort: 'qnaId',
        direct: 'DESC',
      });

      const content = res?.content ?? [];
      all = [...all, ...content];

      if (page >= (res?.totalPages ?? 1)) break;
      page++;
    }

    return all;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const contracts = await fetchAllContracts().catch(() => []);
      const paymentsRes = await adminApi.getPayments().catch(() => []);
      const complainsRes = await adminApi
        .getComplains()
        .catch(() => ({ content: [] }));
      const users = await fetchAllUsers();
      const reservations = await fetchAllReservations();
      const qnas = await fetchAllQna().catch((e) => {
        console.error('QNA API ERROR:', e);
        return [];
      });
      const rooms = await fetchAllRooms().catch(() => []);
      const payments = paymentsRes?.content ?? paymentsRes ?? [];
      const complains = complainsRes?.content ?? complainsRes ?? [];

      /* ================= ALERT ================= */

      const unpaidMonthlyRent = payments.filter(
        (p) => p.paymentSt === 'unpaid'
      ).length;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const paymentFailSpike = payments.filter(
        (p) =>
          eq(p.paymentSt, 'fail') &&
          getPaymentDate(p) &&
          new Date(getPaymentDate(p)) >= oneHourAgo
      ).length;

      const expiringContracts = contracts.filter((c) => {
        const d = diffDays(c.contractEnd);
        return d <= 7 && d >= 0;
      }).length;

      const roomSet = new Set();

      contracts.forEach((c) => {
        if (c.contractEnd && diffFromNowDays(c.contractEnd) >= 365) {
          roomSet.add(c.roomId);
        }
      });

      rooms.forEach((r) => {
        if (r.createdAt && diffFromNowDays(r.createdAt) >= 365) {
          roomSet.add(r.roomId);
        }
      });

      const longVacancyRooms = roomSet.size;

      /* ================= KPI ================= */
      const today = new Date().toISOString().slice(0, 10);
      const todayVisitors = users.filter(
        (u) => u.lastLoginAt?.slice(0, 10) === today
      ).length;

      const newUsers = users.filter((u) => isToday(u.createdAt)).length;

      const activeContracts = contracts.filter((c) =>
        eq(c.contractSt ?? c.contractStatus, 'active')
      );

      const todayConfirmedTours = reservations.filter(
        (r) => r.tourSt === 'confirmed' && r.tourStartAt?.slice(0, 10) === today
      ).length;

      const todayRevenue = payments
        .filter(
          (p) => eq(p.paymentSt, 'paid') && isTodaySafe(getPaymentDate(p))
        )
        .reduce((sum, p) => sum + getPaymentAmount(p), 0);

      const yesterdayRevenue = payments
        .filter(
          (p) => eq(p.paymentSt, 'paid') && isYesterday(getPaymentDate(p))
        )
        .reduce((sum, p) => sum + getPaymentAmount(p), 0);

      const revenueGrowth =
        yesterdayRevenue > 0
          ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
          : 0;

      const unresolvedComplaintsToday = complains.filter(
        (c) => isTodaySafe(c.createdAt) && !eq(c.compSt, 'resolved')
      ).length;

      const unresolvedComplaints = complains.filter(
        (c) => !eq(c.compSt, 'resolved')
      ).length;

      const unresolvedQna = qnas.filter((q) => eq(q.qnaSt, 'waiting')).length;

      /* ================= 운영 ================= */

      const occupiedRoomIds = new Set(
        contracts
          .filter((c) => eq(c.contractSt ?? c.contractStatus, 'active'))
          .map((c) => c.roomId)
          .filter(Boolean)
      );

      const occupancyRate =
        rooms.length > 0 ? (occupiedRoomIds.size / rooms.length) * 100 : 0;

      const vacancyRate = 100 - occupancyRate;

      const todayCheckin = contracts.filter((c) =>
        isToday(c.contractStart)
      ).length;

      const todayCheckout = contracts.filter((c) =>
        isToday(c.contractEnd)
      ).length;

      const totalPayments = payments.length;

      const failCount = payments.filter((p) => p.paymentSt === 'fail').length;

      const todayPaidPayments = payments.filter(
        (p) => eq(p.paymentSt, 'paid') && isTodaySafe(getPaymentDate(p))
      );

      const rentRevenue = todayPaidPayments
        .filter(isRentPayment)
        .reduce((sum, p) => sum + getPaymentAmount(p), 0);

      const serviceRevenue = todayPaidPayments
        .filter(isOrderPayment)
        .reduce((sum, p) => sum + getPaymentAmount(p), 0);

      const paymentFailRate =
        totalPayments > 0 ? (failCount / totalPayments) * 100 : 0;

      const monthlyMap = {};

      payments.forEach((p) => {
        if (!eq(p.paymentSt, 'paid')) return;

        const date = getPaymentDate(p);
        if (!date) return;

        const d = new Date(date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        monthlyMap[key] = (monthlyMap[key] || 0) + getPaymentAmount(p);
      });

      const revenueSeries = buildRevenueSeries(payments, rangeType);
      // 최근 6개월만 정렬
      const monthlyRevenueSeries = Object.entries(monthlyMap)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .slice(-6)
        .map(([label, value]) => ({
          label: label.slice(5), // "03" 이런식
          value,
        }));

      setMetrics({
        unpaidMonthlyRent,
        paymentFailSpike,
        expiringContracts,
        longVacancyRooms,

        todayVisitors,
        newUsers,
        activeContracts: activeContracts.length,
        todayReservations: todayConfirmedTours,
        monthlyRevenue: todayRevenue,
        revenueGrowth,
        unresolvedComplaints,
        unresolvedComplaintsToday,
        unresolvedQna,
        monthlyRevenueSeries,
        payments,

        vacancyRate,
        occupancyRate,
        todayCheckin,
        todayCheckout,
        paymentFailRate,
        rentRevenue,
        serviceRevenue,
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

  if (loading) return <div className={styles.page}>로딩중...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>운영 대시보드</h1>
          <p>공유주거 플랫폼의 운영 상태를 한눈에 확인합니다.</p>
        </div>
        <button onClick={load} disabled={loading}>{loading ? '갱신 중...' : '새로고침'}</button>
      </div>

      <div className={styles.meta}>
        마지막 갱신: {lastUpdated?.toLocaleString('ko-KR') ?? '-'}
      </div>

      <section className={styles.section}>
        <div className={styles.alertHeader} onClick={() => setIsOpen(!isOpen)}>
          <div className={styles.alertLeft}>
            <h2>알림</h2>

            <div className={styles.alertSummary}>
              {alerts.danger.length > 0 && (
                <span className={styles.red}>🔴 {alerts.danger.length}</span>
              )}
              {alerts.warning.length > 0 && (
                <span className={styles.yellow}>
                  🟡 {alerts.warning.length}
                </span>
              )}
              {alerts.info.length > 0 && (
                <span className={styles.green}>🟢 {alerts.info.length}</span>
              )}
            </div>
          </div>

          <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
        </div>

        {isOpen && <AlertSection alerts={alerts} />}
      </section>

      <section className={styles.section}>
        <h2>Today KPI</h2>

        <div className={styles.topCards}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>💰 매출</span>
            </div>

            <div className={styles.kpiValue}>
              {formatMoney(metrics.monthlyRevenue)} (
              {formatPercent(metrics.revenueGrowth)})
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>👥 방문자</span>
            </div>

            <div className={styles.kpiValue}>{metrics.todayVisitors}</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>📄 활성 계약</span>
            </div>

            <div className={styles.kpiValue}>{metrics.activeContracts}</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>📅 투어 예약</span>
            </div>

            <div className={styles.kpiValue}>{metrics.todayReservations}</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.chartGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>📈 매출 추이</h3>
              <div className={styles.filterButtons}>
                <button
                  onClick={() => setRangeType('daily')}
                  className={rangeType === 'daily' ? styles.active : ''}
                >
                  일별
                </button>
                <button
                  onClick={() => setRangeType('monthly')}
                  className={rangeType === 'monthly' ? styles.active : ''}
                >
                  월별
                </button>
                <button
                  onClick={() => setRangeType('yearly')}
                  className={rangeType === 'yearly' ? styles.active : ''}
                >
                  연별
                </button>
              </div>
            </div>
            <LineChart
              data={buildRevenueSeries(metrics.payments, rangeType)}
              rangeType={rangeType}
            />
          </div>
          <div className={styles.chartCard}>
            <h3>🏠 방 현황</h3>
            <div
              style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Donut percent={metrics.occupancyRate} label="입주율" />
              <Donut percent={metrics.vacancyRate} label="공실률" />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>운영 현황</h2>

        <div className={styles.operationGrid}>
          <div className={styles.opCard}>
            <h3>🏠 숙소 운영</h3>
            <p>
              체크인: <strong>{metrics.todayCheckin}</strong>
            </p>
            <p>
              체크아웃: <strong>{metrics.todayCheckout}</strong>
            </p>
          </div>

          <div className={styles.opCard}>
            <h3>💳 결제 현황</h3>
            <p>
              월세: <strong>{formatMoney(metrics.rentRevenue)}</strong>
            </p>
            <p>
              룸서비스: <strong>{formatMoney(metrics.serviceRevenue)}</strong>
            </p>
            <p>
              실패율: <strong>{formatPercent(metrics.paymentFailRate)}</strong>
            </p>
          </div>

          <div className={styles.opCard}>
            <h3>📞 고객 대응</h3>
            <p>
              미처리 민원: <strong>{metrics.unresolvedComplaints}</strong>
            </p>
            <p>
              미처리 질문: <strong>{metrics.unresolvedQna}</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
