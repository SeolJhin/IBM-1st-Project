import React, { useEffect, useMemo, useState } from 'react';
import styles from './AdminRoomServiceDashboard.module.css';
import { adminApi } from '../../api/adminApi';
import { useAdminRoomServiceOrders } from '../../hooks/useAdminRoomServiceOrders';

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function getDateRange(period) {
  const today = new Date();
  const dates = [];

  if (period === 'day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d);
    }
  }

  if (period === 'week') {
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i * 7);
      dates.push(d);
    }
  }

  if (period === 'month') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      dates.push(d);
    }
  }

  return dates;
}

function RoomServiceBarChart({ data }) {
  const [hover, setHover] = useState(null);

  const width = 520;
  const height = 220;
  const padX = 40;
  const padY = 20;

  const rawMax = Math.max(...data.map((d) => d.value), 1);
  const max = rawMax < 10 ? 10 : Math.ceil(rawMax / 10) * 10;

  const barWidth = (width - padX * 2) / data.length;

  const getY = (v) => height - padY - (v / max) * (height - padY * 2);

  const ticks = [];
  for (let i = 0; i <= max; i += Math.ceil(max / 5)) ticks.push(i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
      {/* Y grid */}
      {ticks.map((t, i) => {
        const y = getY(t);
        return (
          <g key={i}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="#eee" />
            <text x={padX - 6} y={y + 4} fontSize="10" textAnchor="end">
              {t}
            </text>
          </g>
        );
      })}

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

            {/* label */}
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
            x={hover.x - 25}
            y={hover.y - 35}
            width="50"
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
            {hover.value}건
          </text>
        </g>
      )}
    </svg>
  );
}

function truncateName(name, max = 10) {
  if (!name) return '';
  return name.length > max ? name.slice(0, max) + '...' : name;
}

export default function AdminRoomServiceDashboard() {
  const [products, setProducts] = useState([]);
  const [period, setPeriod] = useState('day');
  const [productStocks, setProductStocks] = useState([]);

  const { orders } = useAdminRoomServiceOrders({
    initialPage: 1,
    size: 100,
    sort: 'createdAt,DESC',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const prodRes = await adminApi.getAllProductsAdmin();

        const productList = Array.isArray(prodRes)
          ? prodRes
          : (prodRes?.content ?? []);

        const results = await Promise.all(
          productList.map(async (p) => {
            try {
              const stocks = await adminApi.getProductBuildingStocks(p.prodId);

              const minStock =
                stocks && stocks.length > 0
                  ? Math.min(...stocks.map((s) => s.stock ?? 9999))
                  : 9999;

              return { ...p, minStock };
            } catch (e) {
              console.error('stock 실패:', p.prodId);
              return { ...p, minStock: 9999 };
            }
          })
        );
        setProductStocks(results);
      } catch (e) {
        console.error('전체 fetch 실패', e);
      }
    }
    fetchData();
  }, []);

  // =========================
  // 1️⃣ 오늘 상태별 건수
  // =========================
  const todayStats = useMemo(() => {
    const result = {
      requested: 0,
      paid: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((o) => {
      if (!isToday(o.createdAt)) return;

      const st = String(o.orderSt ?? '').toLowerCase();

      if (st === 'requested') result.requested++;
      else if (st === 'paid') result.paid++;
      else if (st === 'delivered') result.delivered++;
      else result.cancelled++;
    });

    return result;
  }, [orders]);

  const formatDay = (date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const chartData = useMemo(() => {
    const range = getDateRange(period);
    const map = {};

    range.forEach((d) => {
      let key;

      if (period === 'day') {
        key = `${d.getMonth() + 1}/${d.getDate()}`;
      } else if (period === 'week') {
        const week = Math.ceil(d.getDate() / 7);
        key = `${d.getMonth() + 1}월 ${week}주차`;
      } else {
        key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      map[key] = {
        label: key,
        value: 0,
      };
    });

    orders.forEach((o) => {
      if (String(o.orderSt).toLowerCase() !== 'delivered') return;

      let key;

      if (period === 'day') {
        key = formatDay(o.createdAt);
      } else if (period === 'week') {
        const d = new Date(o.createdAt);
        const week = Math.ceil(d.getDate() / 7);
        key = `${d.getMonth() + 1}월 ${week}주차`;
      } else {
        const d = new Date(o.createdAt);
        key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      if (map[key]) {
        map[key].value += 1;
      }
    });

    return Object.values(map);
  }, [orders, period]);

  const top5 = useMemo(() => {
    return productStocks
      .filter((p) => p.minStock <= 10)
      .sort((a, b) => a.minStock - b.minStock)
      .slice(0, 5);
  }, [productStocks]);

  console.log('products:', products);
  console.log('productStocks:', productStocks);

  return (
    <div className={styles.wrap}>
      {/* ================= TOP ================= */}
      <div className={styles.topRow}>
        <div className={`${styles.card} ${styles.cardSmall}`}>
          <h3>오늘의 주문</h3>
          <p>요청 {todayStats.requested}건</p>
          <p>결제완료 {todayStats.paid}건</p>
          <p>배송완료 {todayStats.delivered}건</p>
          <p>취소 {todayStats.cancelled}건</p>
        </div>

        <div className={`${styles.card} ${styles.cardLarge}`}>
          <div className={styles.chartHeader}>
            <h3>총 주문 건수</h3>
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
            </div>
          </div>

          <RoomServiceBarChart data={chartData} />
        </div>

        <div className={`${styles.card} ${styles.cardSmall}`}>
          <h3>품절 임박 Top5</h3>
          {top5.map((p) => (
            <p key={p.prodId}>
              [#{p.prodId}] {truncateName(p.prodNm)} : {p.minStock}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
