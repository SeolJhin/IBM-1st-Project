// src/features/admin/components/AdminShell.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

import Header from '../../../app/layouts/components/Header.jsx';
import AdminSidebar from './AdminSidebar';
import styles from './AdminShell.module.css';

export default function AdminShell() {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <AdminSidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
