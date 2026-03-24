import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminReservationHub.module.css';
import ReservationDashboard from './AdminReservationDashboard';

export default function AdminReservationHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <span className={styles.eyebrow}>Reservation</span>
          <div className={styles.goldLine} />
          <h1 className={styles.title}>예약 관리</h1>
        </div>
        <div className={styles.right} />
      </div>

      <div className={styles.dashboardArea}>
        <ReservationDashboard />
      </div>

      <div className={styles.tabs}>
        <NavLink
          to="/admin/reservations/tours"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          투어예약
        </NavLink>

        <NavLink
          to="/admin/reservations/spaces"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          공용공간예약
        </NavLink>
      </div>

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
