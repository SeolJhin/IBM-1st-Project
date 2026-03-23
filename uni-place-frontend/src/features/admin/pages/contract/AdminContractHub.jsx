import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminContractList from './AdminContractList';
import AdminRentManagement from './AdminRentManagement';
import styles from './AdminContractHub.module.css';
import ContractDashboard from './AdminContractDashboard';

export default function AdminContractHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'monthly' ? 'monthly' : 'contracts';

  const switchView = (nextView) => {
    const next = new URLSearchParams(searchParams);
    if (nextView === 'monthly') next.set('view', 'monthly');
    else next.delete('view');
    setSearchParams(next);
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>계약 관리</h1>
      </div>

      <div className={styles.dashboardArea}>
        <ContractDashboard />
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${view === 'contracts' ? styles.tabActive : ''}`}
          onClick={() => switchView('contracts')}
        >
          계약 관리
        </button>
        <button
          type="button"
          className={`${styles.tab} ${view === 'monthly' ? styles.tabActive : ''}`}
          onClick={() => switchView('monthly')}
        >
          월세 관리
        </button>
      </div>
      <div className={styles.panel}>
        {view === 'contracts' ? (
          <AdminContractList />
        ) : (
          <AdminRentManagement />
        )}{' '}
      </div>
    </section>
  );
}
