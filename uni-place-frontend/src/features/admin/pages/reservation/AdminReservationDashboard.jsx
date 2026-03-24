import React, { useEffect, useMemo, useState } from 'react';
import styles from './AdminReservationDashboard.module.css';
import { adminApi } from '../../api/adminApi';

/* ================= 유틸 ================= */

function ReservationLineChart({ data, multi = false }) {
  const [hover, setHover] = useState(null);

  const width = 520;
  const height = 260;
  const padX = 40;
  const padY = 20;

  const max = Math.max(
    ...data.map((d) =>
      multi ? Math.max(d.tour || 0, d.space || 0) : d.count || 0
    ),
    5
  );

  const points = (key) =>
    data.map((d, i) => {
      const innerWidth = width - padX * 2;

      const x = padX + (innerWidth * (i + 0.5)) / data.length;

      const value = multi ? d[key] : d.count;

      const y = height - padY - (value / max) * (height - padY * 2);

      return { ...d, x, y, value };
    });

  const tourPoints = multi ? points('tour') : [];
  const spacePoints = multi ? points('space') : [];
  const singlePoints = !multi ? points() : [];

  const buildPath = (pts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const steps = 5;

  const yTicks = Array.from({ length: steps + 1 }, (_, i) => {
    const value = (max / steps) * i;

    const y = height - padY - (value / max) * (height - padY * 2);

    return { value, y };
  });

  return (
    <div className={styles.lineWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineSvg}>
        {/* Y grid + label */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padX} x2={width - padX} y1={t.y} y2={t.y} stroke="#eee" />
            <text
              x={padX - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#888"
            >
              {Math.round(t.value)} {/* 👈 건수 */}
            </text>
          </g>
        ))}

        {/* multi line */}
        {multi && (
          <>
            <path
              d={buildPath(tourPoints)}
              stroke="#4ade80"
              strokeWidth="3"
              fill="none"
              strokeDasharray="5 5"
            />
            <path
              d={buildPath(spacePoints)}
              stroke="#fca5a5"
              strokeWidth="3"
              fill="none"
              strokeDasharray="5 5"
            />
          </>
        )}

        {/* single line */}
        {!multi && (
          <path
            d={buildPath(singlePoints)}
            stroke="#6366f1"
            strokeWidth="3"
            fill="none"
            strokeDasharray="5 5"
          />
        )}

        {/* tour dots */}
        {multi &&
          tourPoints.map((p, i) => (
            <circle
              key={`tour-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#4ade80"
              onMouseEnter={() => setHover({ x: p.x, y: p.y, value: p.value })}
              onMouseLeave={() => setHover(null)}
            />
          ))}

        {/* space dots */}
        {multi &&
          spacePoints.map((p, i) => (
            <circle
              key={`space-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#fca5a5"
              onMouseEnter={() => setHover({ x: p.x, y: p.y, value: p.value })}
              onMouseLeave={() => setHover(null)}
            />
          ))}

        {/* single */}
        {!multi &&
          singlePoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#6366f1"
              className={styles.lineDot}
              onMouseEnter={() => setHover({ x: p.x, y: p.y, value: p.value })}
              onMouseLeave={() => setHover(null)}
            />
          ))}

        {/* x labels */}
        {data.map((d, i) => {
          const innerWidth = width - padX * 2;
          const x = padX + (innerWidth * (i + 0.5)) / data.length;

          return (
            <text
              key={i}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {d.date || d.hour}
            </text>
          );
        })}

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
    </div>
  );
}

/* ================= 메인 ================= */
export default function AdminReservationDashboard() {
  const [tours, setTours] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [spaceList, setSpaceList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tourRes, spaceRes] = await Promise.all([
          adminApi.tourReservations({ size: 1000 }),
          adminApi.spaceReservations({ size: 1000 }),
        ]);

        // pageable 대응
        setTours(tourRes?.content ?? []);
        setSpaces(spaceRes?.content ?? []);
      } catch (e) {
        console.error('예약 데이터 조회 실패', e);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          adminApi.getBuildings({ size: 100 }),
          adminApi.getSpaces({ size: 100 }),
        ]);

        setBuildings(bRes?.content ?? []);
        setSpaceList(sRes?.content ?? []);
      } catch (e) {
        console.error('건물/공간 조회 실패', e);
      }
    };

    fetchMeta();
  }, []);

  /* ================= KPI ================= */
  const today = new Date().toDateString();

  const getSpaceStart = (s) => s.srStartAt || s.startAt;
  const getSpaceStatus = (s) => s.srSt || s.reservationSt;

  const todayTourCount = tours.filter(
    (t) =>
      t.tourSt === 'confirmed' &&
      new Date(t.tourStartAt).toDateString() === today
  ).length;

  const todaySpaceCount = spaces.filter(
    (s) =>
      getSpaceStatus(s) === 'confirmed' &&
      new Date(getSpaceStart(s)).toDateString() === today
  ).length;

  /* ================= 예약 흐름 ================= */
  const getDateRange = (period) => {
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
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i * 7);
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
  };

  const getWeekKey = (date) => {
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
  };

  const trendData = useMemo(() => {
    const range = getDateRange(period);
    const map = {};

    // 초기 map 생성
    range.forEach((d) => {
      let key;

      if (period === 'daily') {
        key = d.toISOString().slice(5, 10);
      } else if (period === 'weekly') {
        key = getWeekKey(d);
      } else {
        key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      map[key] = { date: key, tour: 0, space: 0 };
    });

    // 투어
    tours.forEach((t) => {
      if (t.tourSt !== 'confirmed') return;

      const d = new Date(t.tourStartAt);

      let key;
      if (period === 'daily') key = d.toISOString().slice(5, 10);
      else if (period === 'weekly') key = getWeekKey(d);
      else
        key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (map[key]) map[key].tour++;
    });

    // 공용공간
    spaces.forEach((s) => {
      if (getSpaceStatus(s) !== 'confirmed') return;

      const d = new Date(getSpaceStart(s));

      let key;
      if (period === 'daily') key = d.toISOString().slice(5, 10);
      else if (period === 'weekly') key = getWeekKey(d);
      else
        key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (map[key]) map[key].space++;
    });

    return Object.values(map);
  }, [tours, spaces, period]);

  /* ================= 시간대별 ================= */
  const filteredSpaces = useMemo(() => {
    if (!selectedBuildingId) return spaceList;

    return spaceList.filter((s) => s.buildingId === Number(selectedBuildingId));
  }, [spaceList, selectedBuildingId]);

  const hourData = useMemo(() => {
    const hours = [8, 10, 12, 14, 16, 18];
    const map = {};
    hours.forEach((h) => (map[h] = 0));

    spaces
      .filter((s) => {
        if (getSpaceStatus(s) !== 'confirmed') return false;

        if (selectedBuildingId && s.buildingId !== Number(selectedBuildingId))
          return false;

        if (selectedSpaceId && s.spaceId !== Number(selectedSpaceId))
          return false;

        return true;
      })
      .forEach((s) => {
        const hour = new Date(getSpaceStart(s)).getHours();

        if (map[hour] !== undefined) {
          map[hour]++;
        }
      });

    return hours.map((h) => ({
      hour: `${String(h).padStart(2, '0')}`,
      count: map[h],
    }));
  }, [spaces, selectedBuildingId, selectedSpaceId]);

  return (
    <div className={styles.dashboard}>
      {/* 🔥 KPI + 그래프 한줄 */}
      <div className={styles.topRow}>
        {/* KPI */}
        <div className={styles.kpiCard}>
          <p>투어 예약</p>
          <h2>{todayTourCount}</h2>

          <div className={styles.divider} />

          <p>공용공간 예약</p>
          <h2>{todaySpaceCount}</h2>
        </div>

        {/* 예약 흐름 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardTitle}>예약 흐름</p>
            <div className={styles.headerRight}>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendDotGreen}></span>
                  투어
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendDotPink}></span>
                  공용공간
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

          <ReservationLineChart data={trendData} multi />
        </div>

        {/* 시간대 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardTitle}>시간대별 예약</p>

            <div className={styles.filterRow}>
              <select
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value);
                  setSelectedSpaceId('');
                }}
              >
                <option value="">건물</option>
                {buildings.map((b) => (
                  <option key={b.buildingId} value={b.buildingId}>
                    {b.buildingNm}
                  </option>
                ))}
              </select>

              {/* 공간 필터 */}
              <select
                value={selectedSpaceId}
                onChange={(e) => setSelectedSpaceId(e.target.value)}
              >
                <option value="">공용공간</option>
                {filteredSpaces.map((s) => (
                  <option key={s.spaceId} value={s.spaceId}>
                    {s.spaceNm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ReservationLineChart data={hourData} />
        </div>
      </div>
    </div>
  );
}
