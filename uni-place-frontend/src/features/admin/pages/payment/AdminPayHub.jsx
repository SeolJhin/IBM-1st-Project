import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminPayHub.module.css';
import PayDashboard from './AdminPayDashboard';

export default function AdminPayHub() {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>결제관리</h1>
        <div className={styles.right} />
      </div>

      <div className={styles.dashboardArea}>
        <PayDashboard />
      </div>

      <div className={styles.tabs}>
        <NavLink
          to="/admin/pay/payments"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          결제
        </NavLink>

        <NavLink
          to="/admin/pay/refunds"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          환불
        </NavLink>

        <NavLink
          to="/admin/pay/billings"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          정산
        </NavLink>
      </div>

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
