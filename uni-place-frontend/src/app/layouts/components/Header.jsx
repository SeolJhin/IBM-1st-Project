import React, { useCallback, useState, useRef, useEffect } from 'react';
import styles from './Header.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/user/hooks/useAuth';
import NotificationBell from './NotificationBell';
import homeLogo from '../../../logo.png';

/* ─ 아이콘 SVG ─────────────────────────────────────────────────
   Feather 스타일 — 얇은 선(strokeWidth 1.5), 최소한의 형태
────────────────────────────────────────────────────────────── */

/* 마이페이지 — 사람 윤곽선 */
function IconUser() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}

/* 관리자 — 방패/보안 (원래 아이콘) */
function IconAdmin() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l8 4v6c0 5-4 9-8 10C8 21 4 17 4 12V6l8-4z" />
    </svg>
  );
}

/* ── 네비게이션 데이터 ──────────────────────────────────────
   커뮤니티를 마지막으로
   공용공간: /spaces는 App.js에 없으므로 /reservations/space/list 사용
──────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    label: '회사소개',
    path: '/company_info',
    children: [
      { label: '회사소개', path: '/about/company' },
      { label: '뉴스', path: '/about/news' },
      { label: '입주 가이드', path: '/about/guide' },
    ],
  },
  {
    label: '방찾기',
    path: '/rooms',
    children: [
      { label: '방', path: '/rooms' },
      // 공용공간: RoomList 안의 탭(tab)으로 동작 — state로 탭 지정
      { label: '공용공간', path: '/rooms', state: { tab: 'spaces' } },
      { label: '건물 목록', path: '/buildings' },
    ],
  },
  {
    label: '고객센터',
    path: '/support',
    children: [
      { label: '공지사항', path: '/support/notice' },
      { label: 'FAQ', path: '/support/faq' },
      { label: '민원', path: '/support/complain' },
      { label: 'Q&A', path: '/support/qna' },
    ],
  },
  {
    label: '커뮤니티',
    path: '/community',
    // ✅ 드롭다운 추가 — tab 쿼리파라미터(URL ?tab=...)로 게시판 구분
    children: [
      { label: '전체', path: '/community' },
      { label: '자유게시판', path: '/community', search: '?tab=FREE' },
      { label: '질문게시판', path: '/community', search: '?tab=QUESTION' },
      { label: '리뷰', path: '/community', search: '?tab=REVIEW' },
    ],
  },
];

/* ── 개별 NavItem ──────────────────────────────────────────── */
function NavItem({ item }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timerRef = useRef(null);

  const hasDropdown = Boolean(item.children?.length);

  // 현재 경로가 이 메뉴(또는 서브메뉴)에 해당하는지
  const isActive =
    location.pathname === item.path ||
    item.children?.some((c) => location.pathname.startsWith(c.path));

  // active 바는 모든 메뉴에서 제거 — 글자색만 진해짐
  const open_ = () => {
    clearTimeout(timerRef.current);
    setOpen(true);
  };
  const close_ = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const handleClick = () => {
    if (!hasDropdown) navigate(item.path);
  };
  const handleChildClick = (child) => {
    setOpen(false);
    // search: 쿼리파라미터(?tab=FREE 같은 URL 조건)도 지원
    const to = child.search
      ? { pathname: child.path, search: child.search }
      : child.path;
    navigate(to, child.state ? { state: child.state } : undefined);
  };

  return (
    <div
      ref={ref}
      className={styles.navItem}
      onMouseEnter={open_}
      onMouseLeave={close_}
    >
      <button
        className={[styles.linkBtn, isActive ? styles.linkBtnActive : '']
          .filter(Boolean)
          .join(' ')}
        type="button"
        onClick={handleClick}
        aria-haspopup={hasDropdown ? 'true' : undefined}
        aria-expanded={hasDropdown ? String(open) : undefined}
      >
        {item.label}
        {hasDropdown && (
          <span
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          >
            ›
          </span>
        )}
      </button>

      {hasDropdown && (
        <div
          className={`${styles.dropdown} ${open ? styles.dropdownOpen : ''}`}
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={close_}
          role="menu"
        >
          <div className={styles.dropdownCaret} aria-hidden="true" />
          {item.children.map((child) => (
            <button
              key={child.path + (child.search || '') + (child.state?.tab || '')}
              className={`${styles.dropdownItem} ${
                location.pathname === child.path && !child.state && !child.search
                  ? styles.dropdownItemActive
                  : ''
              }`}
              type="button"
              role="menuitem"
              onClick={() => handleChildClick(child)}
            >
              {child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Header 본체 ──────────────────────────────────────────── */
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

  function normalizeRole(u) {
    const raw =
      u?.userRole ??
      u?.role ??
      u?.userRl ??
      u?.user_role ??
      u?.authority ??
      u?.authorities?.[0];
    return String(raw ?? '')
      .toLowerCase()
      .replace('role_', '');
  }

  const isAdmin = normalizeRole(user) === 'admin';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* 로고 */}
        <div
          className={styles.brand}
          onClick={goHome}
          onKeyDown={onKeyDownBrand}
          role="button"
          tabIndex={0}
          aria-label="UNI PLACE 홈으로 이동"
        >
          <img
            className={styles.logoMark}
            src={homeLogo}
            alt="UNI PLACE logo"
          />
        </div>

        {/* 네비게이션 */}
        <nav className={styles.nav} aria-label="메인 메뉴">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* 우측 — 알림벨 → 마이페이지 아이콘 → 로그아웃/로그인 */}
        <div className={styles.icons}>
          {/* 알림벨 — 로그인 상태일 때만 */}
          {!loading && user && (
            <div className={styles.bellWrap}>
              <NotificationBell />
            </div>
          )}

          {/* 마이페이지 / 관리자 아이콘 — 로그인 상태일 때만 */}
          {!loading && user && (
            <button
              className={styles.iconCircle}
              type="button"
              onClick={() => navigate(isAdmin ? '/admin' : '/me')}
              aria-label={isAdmin ? '관리자 페이지' : '마이페이지'}
              title={isAdmin ? '관리자 페이지' : '마이페이지'}
            >
              {isAdmin ? <IconAdmin /> : <IconUser />}
            </button>
          )}

          {/* 로그아웃(로그인 상태) / 로그인(비로그인) / placeholder(로딩중)
              항상 같은 너비 버튼을 렌더해서 헤더 레이아웃 이동 방지 */}
          {loading ? (
            <div className={styles.iconPlaceholder} aria-hidden="true" />
          ) : user ? (
            <button
              className={styles.logoutBtn}
              type="button"
              onClick={onClickLogout}
            >
              로그아웃
            </button>
          ) : (
            <button
              className={styles.loginBtn}
              type="button"
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
