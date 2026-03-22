import React, { useEffect, useState } from 'react';
import styles from './AdminPropertyDashboard.module.css';
import { adminApi } from '../../api/adminApi';

export default function AdminPropertyDashboard() {
  const [buildingId, setBuildingId] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, [buildingId]);

  async function load() {
    const res = await adminApi.getPropertyDashboard(buildingId);
    console.log(res);
    setData(res.data ?? res);
  }

  if (!data) return <div>로딩중...</div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <div className={styles.dashboardTitle}>🏠 건물별 현황</div>

          <div className={styles.filter}>
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(Number(e.target.value))}
            >
              {data.buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 카드 영역 */}
        <div className={styles.grid}>
          {/* 방 + 공용공간 */}
          <div className={styles.card}>
            <p>방</p>
            <h2>{data.summary.totalRooms}</h2>

            <div className={styles.divider} />

            <p>공용공간</p>
            <h2>{data.summary.totalSpaces}</h2>
          </div>

          {/* 건물별 현황 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.title}>방 상태</span>
            </div>
            <p>예약중 {data.roomStats.reserved}</p>
            <p>계약중 {data.roomStats.contracted}</p>
            <p>수리중 {data.roomStats.repair}</p>
            <p>청소중 {data.roomStats.cleaning}</p>
          </div>

          {/* 입주율 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.title}>방 현황</span>
            </div>

            <div className={styles.donutWrap}>
              <div
                className={styles.donut}
                style={{ '--value': data.rate.occupancy }}
              >
                <p>입주율</p>
              </div>

              <div
                className={styles.donutGray}
                style={{ '--value2': data.rate.vacancy }}
              >
                <p>공실률</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
