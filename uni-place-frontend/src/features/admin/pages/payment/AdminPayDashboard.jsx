import React, { useEffect, useMemo, useState } from 'react';
import styles from './AdminPayDashboard.module.css';
import { adminApi } from '../../api/adminApi';

/* ================= 유틸 ================= */
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const isPaid = (p) => p?.paymentSt === 'paid';

const isRent = (p) => {
  const t = String(p?.targetType ?? '').toLowerCase();
  return t === 'monthly_charge' || t === 'rent' || t === 'charge';
};

const isRoom = (p) => {
  const t = String(p?.targetType ?? '').toLowerCase();
  return t === 'order' || t === 'room_service' || t === 'roomservice';
};

/* ================= 차트 ================= */
function PayBarChart({ data }) {
  const [hover, setHover] = useState(null);

  const width = 520;
  const height = 220;
  const padX = 40;
  const padY = 40;

  const rawMax = Math.max(...data.map((d) => d.value), 1);
  const max = Math.ceil(rawMax / 10000) * 10000 || 10000;

  const getY = (v) => height - padY - (v / max) * (height - padY * 2);

  const ticks = [];
  for (let i = 0; i <= max; i += max / 5) ticks.push(i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
      {/* Y축 */}
      {ticks.map((t, i) => {
        const y = getY(t);
        return (
          <g key={i}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="#eee" />
            <text x={padX - 6} y={y + 4} fontSize="10" textAnchor="end">
              {Math.round(t / 10000)}만
            </text>
          </g>
        );
      })}

      {/* bars */}
      {data.map((d, i) => {
        const groupWidth = (width - padX * 2) / data.length;
        const xCenter = padX + i * groupWidth + groupWidth / 2;
        const barWidth = groupWidth * 0.4;

        const x = xCenter - barWidth / 2;
        const y = getY(d.value);
        const h = height - padY - y;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx="4"
              fill="#86efac"
              onMouseEnter={() => setHover({ x: xCenter, y, value: d.value })}
              onMouseLeave={() => setHover(null)}
            />

            <text
              x={xCenter}
              y={height - padY + 14}
              textAnchor="middle"
              fontSize="10"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* tooltip */}
      {hover && (
        <g>
          <rect
            x={hover.x - 40}
            y={hover.y - 30}
            width="80"
            height="24"
            rx="6"
            fill="#333"
          />
          <text
            x={hover.x}
            y={hover.y - 14}
            textAnchor="middle"
            fill="#fff"
            fontSize="12"
          >
            {hover.value.toLocaleString()}원
          </text>
        </g>
      )}
    </svg>
  );
}

/* ================= 메인 ================= */
export default function AdminPayDashboard() {
  const [payments, setPayments] = useState([]);
  const [charges, setCharges] = useState([]);

  const [period, setPeriod] = useState('day');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      const [p, c] = await Promise.all([
        adminApi.getPayments(),
        adminApi.getMonthlyCharges().catch(() => []),
      ]);

      setPayments(Array.isArray(p) ? p : (p?.content ?? []));
      setCharges(Array.isArray(c) ? c : []);
    };

    load();
  }, []);

  /* ================= 데이터 ================= */
  const chartData = useMemo(() => {
    const map = {};
    const now = new Date();

    const range = [];

    if (period === 'day') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        map[key] = 0;
        range.push(key);
      }
    }

    if (period === 'week') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i * 7);
        const week = Math.ceil(d.getDate() / 7);
        const key = `${d.getMonth() + 1}월 ${week}주`;
        map[key] = 0;
        range.push(key);
      }
    }

    if (period === 'month') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);

        const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
        map[key] = 0;
        range.push(key);
      }
    }

    if (period === 'quarter') {
      let year = now.getFullYear();
      let q = Math.floor(now.getMonth() / 3) + 1;

      for (let i = 0; i < 4; i++) {
        range.unshift(`${String(year).slice(2)}년 ${q}분기`);
        map[`${String(year).slice(2)}년 ${q}분기`] = 0;

        q--;
        if (q === 0) {
          q = 4;
          year--;
        }
      }
    }

    payments.forEach((p) => {
      if (!isPaid(p)) return;
      if (typeFilter === 'MONTH' && !isRent(p)) return;
      if (typeFilter === 'ROOM' && !isRoom(p)) return;

      const d = new Date(p.paidAt);

      let key;

      if (period === 'day') {
        key = `${d.getMonth() + 1}/${d.getDate()}`;
      } else if (period === 'week') {
        const week = Math.ceil(d.getDate() / 7);
        key = `${d.getMonth() + 1}월 ${week}주`;
      } else if (period === 'month') {
        const d = new Date(p.paidAt);
        key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        const q = Math.floor(d.getMonth() / 3) + 1;
        key = `${String(d.getFullYear()).slice(2)}년 ${q}분기`;
      }

      if (map[key] !== undefined) {
        map[key] += toNum(p.capturedPrice ?? p.totalPrice);
      }
    });

    return range.map((k) => ({
      label: k,
      value: map[k],
    }));
  }, [payments, period, typeFilter]);

  /* ================= 상태 분포 ================= */
  const statusData = useMemo(() => {
    const map = { paid: 0, fail: 0, cancelled: 0 };
    payments.forEach((p) => {
      const st = String(p.paymentSt ?? '').toLowerCase();
      if (map[st] !== undefined) map[st]++;
    });
    return map;
  }, [payments]);
  /* ================= 실패 분석 ================= */
  const failTop = useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      if (p.paymentSt !== 'fail') return;
      const reason = p.failReason || '기타';
      map[reason] = (map[reason] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [payments]);

  /* ================= 리스크 ================= */
  const risk = useMemo(() => {
    let unpaid = 0;
    let overdue = 0;

    const today = new Date();

    charges.forEach((c) => {
      const billingDate = new Date(c.billingDt || c.dueDt);

      if (c.chargeSt === 'unpaid' && billingDate && billingDate <= today) {
        unpaid++;
      }
      if (c.chargeSt === 'overdue') {
        overdue++;
      }
    });

    return { unpaid, overdue };
  }, [charges]);

  return (
    <div className={styles.wrap}>
      {/* 매출 */}
      <div className={styles.card}>
        <div className={styles.header}>
          <h3>📈 매출 트렌드</h3>

          <div className={styles.filters}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">전체</option>
              <option value="MONTH">월세</option>
              <option value="ROOM">룸서비스</option>
            </select>

            <div className={styles.filterGroup}>
              <button
                className={period === 'day' ? styles.activeBtn : ''}
                onClick={() => setPeriod('day')}
              >
                일
              </button>
              <button
                className={period === 'week' ? styles.activeBtn : ''}
                onClick={() => setPeriod('week')}
              >
                주
              </button>
              <button
                className={period === 'month' ? styles.activeBtn : ''}
                onClick={() => setPeriod('month')}
              >
                월
              </button>
              <button
                className={period === 'quarter' ? styles.activeBtn : ''}
                onClick={() => setPeriod('quarter')}
              >
                분기
              </button>
            </div>
          </div>
        </div>

        <PayBarChart data={chartData} />
      </div>

      {/* 상태 */}
      <div className={styles.card}>
        <h3>결제 현황</h3>
        <div className={styles.statusCol}>
          <div className={styles.infoText}>성공 {statusData.paid}건</div>
          <div className={styles.infoText}>실패 {statusData.fail}건</div>
          <div className={styles.infoText}>취소 {statusData.cancelled}건</div>
        </div>
      </div>

      {/* 실패 */}
      <div className={styles.card}>
        <h3>실패 사유</h3>
        <div className={styles.statusCol}>
          {failTop.map(([k, v], i) => (
            <div key={i} className={styles.infoText}>
              {k} {v}건
            </div>
          ))}
        </div>
      </div>

      {/* 리스크 */}
      <div className={styles.card}>
        <h3>월세 리스크</h3>
        <div className={styles.statusCol}>
          <div className={styles.infoText}>미납 {risk.unpaid}건</div>
          <div className={styles.infoText}>연체 {risk.overdue}건</div>
        </div>
      </div>
    </div>
  );
}
