import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminContractList from './AdminContractList';
import AdminRentManagement from './AdminRentManagement';
import styles from './AdminContractHub.module.css';

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
      <div className={styles.tabRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${view === 'contracts' ? styles.tabBtnActive : ''}`}
          onClick={() => switchView('contracts')}
        >
          계약 관리
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${view === 'monthly' ? styles.tabBtnActive : ''}`}
          onClick={() => switchView('monthly')}
        >
          월세 관리
        </button>
      </div>

      {view === 'contracts' ? <AdminContractList /> : <AdminRentManagement />}
    </section>
  );
}

