import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminRoomServiceHub.module.css';
import RoomServiceDashboard from './AdminRoomServiceDashboard';

export default function AdminServiceHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <span className={styles.eyebrow}>Room Service</span>
          <div className={styles.goldLine} />
          <h1 className={styles.title}>룸서비스 관리</h1>
        </div>
        <div className={styles.right} />
      </div>

      <div className={styles.dashboardArea}>
        <RoomServiceDashboard />
      </div>

      <div className={styles.tabs}>
        <NavLink
          to="/admin/roomservice/room_orders"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          주문내역
        </NavLink>

        <NavLink
          to="/admin/roomservice/room_products"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          상품
        </NavLink>
      </div>

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
