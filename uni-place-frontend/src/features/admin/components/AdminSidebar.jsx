// src/features/admin/components/AdminSidebar.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './AdminSidebar.module.css';
import { adminMenu } from '../constants/adminMenu';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sideBox}>
        <div className={styles.sideNavHeader}>Admin Panel</div>
        {adminMenu.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`${styles.sideItem} ${isActive(m.path) ? styles.sideItemActive : ''}`}
            onClick={() => navigate(m.path)}
          >
            <span className={styles.dot} />
            {m.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
