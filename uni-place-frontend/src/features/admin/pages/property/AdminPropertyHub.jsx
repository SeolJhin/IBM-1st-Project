import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminPropertyHub.module.css';

export default function AdminPropertyHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>시설 관리</h1>

        {/* (원하면) 검색 아이콘/검색창 자리 */}
        <div className={styles.right} />
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
