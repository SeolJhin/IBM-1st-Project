import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminPropertyHub.module.css';
import { adminApi } from '../../api/adminApi';
import PropertyDashboard from './AdminPropertyDashboard';

export default function AdminPropertyHub() {
  const [refreshState, setRefreshState] = useState('idle'); // idle | loading | done | error

  async function handleRefresh() {
    if (refreshState === 'loading') return;
    setRefreshState('loading');
    try {
      await adminApi.refreshRoomRecommendations();
      setRefreshState('done');
      setTimeout(() => setRefreshState('idle'), 3000);
    } catch (e) {
      setRefreshState('error');
      setTimeout(() => setRefreshState('idle'), 3000);
    }
  }

  const btnLabel = {
    idle: '🤖 AI 추천 갱신',
    loading: '갱신 중...',
    done: '✅ 갱신 완료',
    error: '❌ 갱신 실패',
  }[refreshState];

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <span className={styles.eyebrow}>Property</span>
          <div className={styles.goldLine} />
          <h1 className={styles.title}>시설 관리</h1>
        </div>
        <button
          className={`${styles.refreshBtn} ${styles[refreshState]}`}
          onClick={handleRefresh}
          disabled={refreshState === 'loading'}
        >
          {btnLabel}
        </button>
      </div>

      <div className={styles.dashboardArea}>
        <PropertyDashboard />
      </div>

      <div className={styles.tabs}>
        <NavLink
          to="/admin/property/buildings"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          건물
        </NavLink>

        <NavLink
          to="/admin/property/rooms"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          방
        </NavLink>

        <NavLink
          to="/admin/property/spaces"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          공용공간
        </NavLink>
      </div>

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
