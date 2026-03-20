import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../../app/layouts/components/Header';
import Footer from '../../app/layouts/components/Footer';
import styles from './LegalPage.module.css';

const LEGAL_TABS = [
  { label: '이용약관', path: '/terms' },
  { label: '개인정보처리방침', path: '/privacy' },
  { label: '쿠키정책', path: '/cookies' },
];

export default function LegalPage({ title, lastUpdated, children }) {
  const { pathname } = useLocation();

  return (
    <div className={styles.page}>
      <Header />

      {/* 페이지 헤더 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <p className={styles.eyebrow}>LEGAL</p>
          <h1 className={styles.title}>{title}</h1>
          {lastUpdated && (
            <p className={styles.updated}>최종 업데이트: {lastUpdated}</p>
          )}
          {/* 탭 네비 */}
          <div className={styles.tabs}>
            {LEGAL_TABS.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`${styles.tab} ${pathname === tab.path ? styles.tabActive : ''}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
