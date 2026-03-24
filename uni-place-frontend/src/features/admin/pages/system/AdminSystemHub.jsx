import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminSystemHub.module.css';
import SystemDashboard from './AdminSystemDashboard';

export default function AdminSystemHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <span className={styles.eyebrow}>System</span>
          <div className={styles.goldLine} />
          <h1 className={styles.title}>시스템 관리</h1>
        </div>
        <div className={styles.right} />
      </div>

      <div className={styles.dashboardArea}>
        <SystemDashboard />
      </div>

      <div className={styles.tabs}>
        <NavLink
          to="/admin/system/banners"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          배너
        </NavLink>

        <NavLink
          to="/admin/system/affiliates"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          제휴
        </NavLink>

        <NavLink
          to="/admin/system/company_info"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          회사
        </NavLink>
      </div>

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
