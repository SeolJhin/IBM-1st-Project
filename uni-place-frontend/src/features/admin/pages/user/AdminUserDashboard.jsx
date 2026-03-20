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

function groupByPeriod(users, period) {
  const range = getDateRange(period);

  const map = {};

  range.forEach((d) => {
    let key;

    if (period === 'daily') {
      key = d.toISOString().slice(5, 10); // MM-DD
    } else if (period === 'weekly') {
      key = d.toISOString().slice(5, 10);
    } else {
      key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    map[key] = { label: key, newUsers: 0 };
  });

  users.forEach((u) => {
    const d = new Date(u.createdAt);

    let key;

    if (period === 'daily' || period === 'weekly') {
      key = d.toISOString().slice(5, 10);
    } else {
      key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    if (map[key]) {
      map[key].newUsers += 1;
    }
  });

  return Object.values(map);
}

function SimpleBarChart({ data }) {
  const maxValue = Math.max(...data.map((d) => d.newUsers), 20);

  const getHeight = (v) => (v / maxValue) * 160;

  return (
    <div className={styles.chartWrap}>
      <YAxis max={Math.ceil(maxValue / 20) * 20} />

      <div className={styles.chart}>
        {data.map((d, i) => (
          <div key={i} className={styles.barGroup}>
            <div
              className={styles.bar}
              style={{ height: getHeight(d.newUsers) }}
            />
            <span>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function YAxis({ max }) {
  const ticks = [];
  for (let i = 0; i <= max; i += 20) {
    ticks.push(i);
  }

  return (
    <div className={styles.yAxis}>
      {ticks.map((t, i) => (
        <div key={i} className={styles.yRow}>
          <span>{t}</span>
          <div className={styles.gridLine} />
        </div>
      ))}
    </div>
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
            <p>--------------</p>
            <p>밴 회원 수</p>
            <h2>{metrics.bannedUsers}</h2>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>회원 현황</h3>

            <div className={styles.filterGroup}>
              <button onClick={() => setPeriod('daily')}>일</button>
              <button onClick={() => setPeriod('weekly')}>주</button>
              <button onClick={() => setPeriod('monthly')}>월</button>
            </div>
          </div>

          <SimpleBarChart data={chartData} />
        </div>

        <div className={styles.donutBox}>
          <Donut percent={metrics.returnRate} label="재방문율" />
          <Donut percent={metrics.churnRate} label="탈퇴율" />
        </div>
      </div>
    </div>
  );
}
