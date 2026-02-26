import React, { useCallback } from 'react';
import styles from './Header.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/user/hooks/useAuth';
import NotificationBell from './NotificationBell';

export default function Header() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const goHome = useCallback(() => navigate('/'), [navigate]);

  const onKeyDownBrand = (e) => {
    if (e.key === 'Enter' || e.key === ' ') goHome();
  };

  const onClickLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true });
    }
  }, [logout, navigate]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div
          className={styles.brand}
          onClick={goHome}
          onKeyDown={onKeyDownBrand}
          role="button"
          tabIndex={0}
        >
          <div className={styles.logoMark} />
          <div className={styles.brandText}>
            <div className={styles.brandName}>UNI PLACE</div>
            <div className={styles.brandSub}>Co-living Platform</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={styles.linkBtn}
            type="button"
            onClick={() => navigate('/company_info')}
          >
            회사소개
          </button>
          <button
            className={styles.linkBtn}
            type="button"
            onClick={() => navigate('/community')}
          >
            커뮤니티
          </button>
          <button
            className={styles.linkBtn}
            type="button"
            onClick={() => navigate('/membership')}
          >
            방찾기
          </button>
        </nav>

        <div className={styles.icons}>
          {/* 검색 - 항상 표시 */}
          <button
            className={styles.iconBtn}
            type="button"
            aria-label="search"
            onClick={() => navigate('/search')}
          >
            검색
          </button>

          {/* 로그인 상태에 따라 변경 */}
          {loading ? null : user ? (
            <>
              <button
                className={styles.iconBtn}
                type="button"
                aria-label="me"
                onClick={() => navigate('/me')}
              >
                마이페이지
              </button>
              <button
                className={styles.iconBtn}
                type="button"
                aria-label="logout"
                onClick={onClickLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              className={styles.iconBtn}
              type="button"
              aria-label="login"
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
          )}

          {/* 알림 - 로그인 시에만 표시, 로그인 오른쪽 */}
          {!loading && user && <NotificationBell />}
        </div>
      </div>
    </header>
  );
}
