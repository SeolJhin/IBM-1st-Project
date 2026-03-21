// features/admin/pages/user/AdminUserDashboard.jsx
import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminUserDashboard.module.css';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const formatPercent = (v) => `${toNum(v).toFixed(1)}%`;

function getDateRange(period) {
  const today = new Date();
  const dates = [];

  if (period === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d);
    }
  }

  if (period === 'weekly') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d);
    }
  }

  if (period === 'monthly') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      dates.push(d);
    }
  }

  return dates;
}

function getWeekKey(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = d.getMonth();

  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  let count = 0;
  for (let i = 0; i < 7; i++) {
    const temp = new Date(monday);
    temp.setDate(monday.getDate() + i);
    if (temp.getMonth() === month) count++;
  }

  let targetMonth = month;
  let targetYear = year;

  if (count < 4) {
    targetMonth -= 1;
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    }
  }

  const firstDay = new Date(targetYear, targetMonth, 1);

  const firstDayWeek = firstDay.getDay() || 7;

  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() - firstDayWeek + 1);

  const weekNo =
    Math.floor((monday - firstMonday) / (1000 * 60 * 60 * 24 * 7)) +
    1 -
    (count < 4 ? 0 : 1);

  return `${targetMonth + 1}월 ${weekNo}주차`;
}

function groupByPeriod(users, period) {
  if (period === 'weekly') {
    const today = new Date();

    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i * 7);
      weeks.push(getWeekKey(d));
    }

    const uniqueWeeks = [...new Set(weeks)];

    const map = {};
    uniqueWeeks.forEach((k) => {
      map[k] = {
        label: k,
        newUsers: 0,
        inactive: 0,
        deleted: 0,
      };
    });

    users.forEach((u) => {
      const key = getWeekKey(u.createdAt);

      if (map[key]) {
        map[key].newUsers += 1;
        if (u.userSt === 'inactive') map[key].inactive += 1;
        if (u.deleteYN === 'Y') map[key].deleted += 1;
      }
    });

    return uniqueWeeks.map((k) => map[k]);
  }

  // ✅ 기존 로직 (daily / monthly)
  const range = getDateRange(period);
  const map = {};

  range.forEach((d) => {
    let key;

    if (period === 'daily') {
      key = d.toISOString().slice(5, 10);
    } else {
      key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    map[key] = {
      label: key,
      newUsers: 0,
      inactive: 0,
      deleted: 0,
    };
  });

  users.forEach((u) => {
    let key;

    if (period === 'daily') {
      key = new Date(u.createdAt).toISOString().slice(5, 10);
    } else {
      const d = new Date(u.createdAt);
      key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    if (map[key]) {
      map[key].newUsers += 1;
      if (u.userSt === 'inactive') map[key].inactive += 1;
      if (u.deleteYN === 'Y') map[key].deleted += 1;
    }
  });

  return Object.values(map);
}

function GroupBarChart({ data }) {
  const [hover, setHover] = useState(null);

  const width = 520;
  const height = 220;
  const padX = 40;
  const padY = 20;

  const rawMax = Math.max(
    ...data.flatMap((d) => [d.newUsers, d.inactive, d.deleted]),
    1
  );

  const max = rawMax < 10 ? 20 : Math.ceil(rawMax / 10) * 10;

  const groupWidth = (width - padX * 2) / data.length;
  const barWidth = groupWidth / 4;

  const getY = (v) => height - padY - (v / max) * (height - padY * 2);

  const ticks = [];
  for (let i = 0; i <= max; i += 20) ticks.push(i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineSvg}>
      {/* Y grid */}
      {ticks.map((t, i) => {
        const y = getY(t);
        return (
          <g key={i}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="#eee" />
            <text
              x={padX - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#888"
            >
              {t}
            </text>
          </g>
        );
      })}

      {/* X축 */}
      <line
        x1={padX}
        x2={width - padX}
        y1={height - padY}
        y2={height - padY}
        stroke="#ddd"
      />

      {/* bars */}
      {data.map((d, i) => {
        const baseX = padX + i * groupWidth;

        const values = [
          { v: d.newUsers, color: '#86efac' },
          { v: d.inactive, color: '#93c5fd' },
          { v: d.deleted, color: '#fca5a5' },
        ];

        return (
          <g key={i}>
            {values.map((item, j) => {
              if (item.v === 0) return null;

              const x = baseX + j * barWidth + barWidth;
              const y = getY(item.v);
              const h = height - padY - y;

              return (
                <rect
                  key={j}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  fill={item.color}
                  rx="2"
                  onMouseEnter={() => setHover({ x, y, value: item.v })}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}

            {/* X label */}
            <text
              x={baseX + groupWidth / 2}
              y={height - padY + 14}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {hover && (
        <g>
          <rect
            x={hover.x - 30}
            y={hover.y - 35}
            width="60"
            height="22"
            rx="6"
            fill="#333"
          />
          <text
            x={hover.x}
            y={hover.y - 20}
            textAnchor="middle"
            fill="#fff"
            fontSize="12"
          >
            {hover.value}명
          </text>
        </g>
      )}
    </svg>
  );
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
          strokeDasharray={`${dash} ${c}`}
          strokeDashoffset={0}
        />
      </svg>
      <div className={styles.donutCenter}>
        <strong>{formatPercent(p)}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function AdminUserDashboard() {
  const [period, setPeriod] = useState('daily');
  const [chartData, setChartData] = useState([]);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    bannedUsers: 0,
    returnRate: 0,
    churnRate: 0,
  });

  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      let page = 1;
      let all = [];

      while (true) {
        const res = await adminApi.users({ page, size: 50 });
        const content = res?.content ?? [];
        all = [...all, ...content];

        if (page >= (res?.totalPages ?? 1)) break;
        page++;
      }

      const totalUsers = all.length;

      const bannedUsers = all.filter((u) => u.userSt === 'banned').length;

      const activeUsers = all.filter((u) => u.lastLoginAt);

      const recentUsers = activeUsers.filter((u) => {
        const diff =
          (new Date() - new Date(u.lastLoginAt)) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      });

      const returnRate =
        activeUsers.length > 0
          ? (recentUsers.length / activeUsers.length) * 100
          : 0;

      const deleted = all.filter((u) => u.deleteYN === 'Y');

      const churnRate =
        totalUsers > 0 ? (deleted.length / totalUsers) * 100 : 0;

      const grouped = groupByPeriod(all, period);
      setChartData(grouped);

      setMetrics({
        totalUsers,
        bannedUsers,
        returnRate,
        churnRate,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.topRow}>
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <p>전체 회원 수</p>
            <h2>{metrics.totalUsers}</h2>
            <div className={styles.divider} />
            <p>밴 회원 수</p>
            <h2>{metrics.bannedUsers}</h2>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>회원 현황</h3>

            <div className={styles.headerRight}>
              <div className={styles.legend}>
                <span>
                  <i className={styles.new}></i>신규
                </span>
                <span>
                  <i className={styles.inactive}></i>휴면
                </span>
                <span>
                  <i className={styles.deleted}></i>탈퇴
                </span>
              </div>

              <div className={styles.filterGroup}>
                <button
                  className={period === 'daily' ? styles.activeBtn : ''}
                  onClick={() => setPeriod('daily')}
                >
                  일
                </button>
                <button
                  className={period === 'weekly' ? styles.activeBtn : ''}
                  onClick={() => setPeriod('weekly')}
                >
                  주
                </button>
                <button
                  className={period === 'monthly' ? styles.activeBtn : ''}
                  onClick={() => setPeriod('monthly')}
                >
                  월
                </button>
              </div>
            </div>
          </div>

          <GroupBarChart data={chartData} />
        </div>

        <div className={styles.donutCard}>
          <div className={styles.cardHeader}>
            <h3>회원 유지율</h3>
          </div>
          <div className={styles.donutBox}>
            <Donut percent={metrics.returnRate} label="재방문율" />
            <Donut percent={metrics.churnRate} label="탈퇴율" />
          </div>
        </div>
      </div>
    </div>
  );
}
