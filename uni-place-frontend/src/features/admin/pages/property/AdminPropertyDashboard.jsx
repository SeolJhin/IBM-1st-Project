import React, { useEffect, useState } from 'react';
import styles from './AdminPropertyDashboard.module.css';
import { adminApi } from '../../api/adminApi';

export default function AdminPropertyDashboard() {
  const [buildingId, setBuildingId] = useState(1);
  const [data, setData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    load();
  }, [buildingId]);

  async function load() {
    const [dashboardRes, roomsRes, contractsRes] = await Promise.all([
      adminApi.getPropertyDashboard(buildingId),
      adminApi.getRooms({ size: 1000 }), // 전체 방
      adminApi.getContracts?.(), // 없으면 API 추가 필요
    ]);

    const dashboardData = dashboardRes.data ?? dashboardRes;
    const roomList = roomsRes?.content ?? [];
    const contractList = contractsRes?.content ?? [];

    const filteredRooms = roomList.filter((r) => r.buildingId === buildingId);

    const occupiedRoomIds = new Set(
      contractList
        .filter((c) => (c.contractSt ?? c.contractStatus) === 'active')
        .map((c) => c.roomId)
    );

    const occupiedCount = filteredRooms.filter((r) =>
      occupiedRoomIds.has(r.roomId)
    ).length;

    const total = filteredRooms.length;

    const occupancy = total > 0 ? (occupiedCount / total) * 100 : 0;
    const vacancy = 100 - occupancy;

    setData({
      ...dashboardData,
      rate: {
        occupancy: occupancy.toFixed(1),
        vacancy: vacancy.toFixed(1),
      },
    });

    setRooms(filteredRooms);
    setContracts(contractList);
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

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.title}>방 현황</span>
            </div>

            <div className={styles.donutBox}>
              {/* 입주율 */}
              <div className={styles.donutWrap}>
                <svg className={styles.donut} viewBox="0 0 36 36">
                  <circle
                    className={styles.donutTrack}
                    cx="18"
                    cy="18"
                    r="16"
                  />

                  <circle
                    className={styles.donutValue}
                    cx="18"
                    cy="18"
                    r="16"
                    strokeDasharray={`${data.rate.occupancy}, 100`}
                  />
                </svg>

                <div className={styles.donutCenter}>
                  <strong>{data.rate.occupancy}%</strong>
                  <span>입주율</span>
                </div>
              </div>

              {/* 공실률 */}
              <div className={styles.donutWrap}>
                <svg className={styles.donut} viewBox="0 0 36 36">
                  <circle
                    className={styles.donutTrack}
                    cx="18"
                    cy="18"
                    r="16"
                  />

                  <circle
                    className={styles.donutValue}
                    cx="18"
                    cy="18"
                    r="16"
                    strokeDasharray={`${data.rate.vacancy}, 100`}
                  />
                </svg>

                <div className={styles.donutCenter}>
                  <strong>{data.rate.vacancy}%</strong>
                  <span>공실률</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
