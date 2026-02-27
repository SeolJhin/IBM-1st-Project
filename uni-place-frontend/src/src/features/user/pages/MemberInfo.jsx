import React, { useEffect, useState } from 'react';
import styles from './MemberInfo.module.css';
import { useAuth } from '../hooks/useAuth';

export default function MemberInfo() {
  const { user, loading, refresh, logout } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      // 토큰이 있는데도 user가 없으면 refresh 시도
      refresh().catch(() => setError('사용자 정보를 불러오지 못했습니다.'));
    }
  }, [loading, user, refresh]);

  if (loading) return <div className={styles.container}>로딩 중…</div>;

  if (!user) {
    return (
      <section className={styles.container}>
        <h1 className={styles.title}>내 정보</h1>
        <div className={styles.error}>{error || '로그인이 필요합니다.'}</div>
        <a className={styles.link} href="/login">
          로그인
        </a>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>내 정보</h1>

      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.key}>이메일</span>
          <span className={styles.value}>{user.userEmail ?? '-'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>이름</span>
          <span className={styles.value}>{user.userName ?? '-'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>권한</span>
          <span className={styles.value}>{user.userRole ?? '-'}</span>
        </div>
      </div>

      <button className={styles.button} onClick={logout}>
        로그아웃
      </button>
    </section>
  );
}
