import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminSystemHub.module.css';

export default function AdminSystemHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>배너 관리</h1>

        {/* (원하면) 검색 아이콘/검색창 자리 */}
        <div className={styles.right} />
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
          to="/admin/affiliates"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          제휴
        </NavLink>

        <NavLink
          to="/admin/users/company"
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
