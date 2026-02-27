import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminRoomServiceHub.module.css';

export default function AdminServiceHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>룸서비스 관리</h1>

        {/* (원하면) 검색 아이콘/검색창 자리 */}
        <div className={styles.right} />
      </div>

      <div className={styles.tabs}>
        <NavLink
          to="/admin/roomservice/orders"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          주문내역
        </NavLink>

        <NavLink
          to="/admin/roomservice/products"
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
