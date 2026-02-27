import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminUserHub.module.css';

export default function AdminUserHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>회원 관리</h1>

        {/* (원하면) 검색 아이콘/검색창 자리 */}
        <div className={styles.right} />
      </div>

      <div className={styles.tabs}>
        <NavLink
          to="/admin/users"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          회원
        </NavLink>

        <NavLink
          to="/admin/users/residents"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          입주자
        </NavLink>
      </div>

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
