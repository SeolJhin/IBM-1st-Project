import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminReservationHub.module.css';

export default function AdminReservationHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>예약 관리</h1>

        {/* (원하면) 검색 아이콘/검색창 자리 */}
        <div className={styles.right} />
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
