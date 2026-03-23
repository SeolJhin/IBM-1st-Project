// features/support/pages/Support.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import styles from './Support.module.css';

/* ─────────────────────────────────────────────────────────────
   탭 정의 (label, path, hero 이미지, 부제목)
───────────────────────────────────────────────────────────── */
const TABS = [
  {
    label: '공지사항',
    path: '/support/notice',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=85',
    eyebrow: 'NOTICE',
    title: '공지사항',
    sub: '서비스 운영 안내 및 중요 소식을 전달드립니다.',
  },
  {
    label: 'FAQ',
    path: '/support/faq',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&q=85',
    eyebrow: 'FAQ',
    title: '자주 묻는 질문',
    sub: '입주 전후 궁금한 점을 한 번에 해결해보세요.',
  },
  {
    label: '민원',
    path: '/support/complain',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=85',
    eyebrow: 'COMPLAINT',
    title: '민원 접수',
    sub: '불편하신 사항을 남겨주시면 빠르게 검토하겠습니다.',
  },
  {
    label: 'Q&A',
    path: '/support/qna',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=85',
    eyebrow: 'Q&A',
    title: '1:1 문의',
    sub: '궁금한 점을 남겨주시면 담당자가 직접 답변해드립니다.',
  },
];

/* ─────────────────────────────────────────────────────────────
   Support 레이아웃
───────────────────────────────────────────────────────────── */
export default function Support() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  /* 현재 탭 정보 */
  const current =
    TABS.find((t) => pathname.startsWith(t.path)) ?? TABS[0];

  /* 히어로(hero) 이미지 전환 애니메이션 — fade */
  const [heroImg, setHeroImg] = useState(current.image);
  const [heroFade, setHeroFade] = useState(true);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    /* 이전 이미지 fade-out → 교체 → fade-in */
    setHeroFade(false);
    const t = setTimeout(() => {
      setHeroImg(current.image);
      setHeroFade(true);
    }, 320);
    return () => clearTimeout(t);
  }, [pathname, current.image]);

  return (
    <div className={styles.page}>
      <Header />

      {/* ══ HERO ═══════════════════════════════════════════ */}
      <section className={styles.hero}>
        {/* 배경 이미지 */}
        <div
          className={styles.heroBg}
          style={{
            backgroundImage: `url(${heroImg})`,
            opacity: heroFade ? 1 : 0,
          }}
        />
        {/* 다크 오버레이 */}
        <div className={styles.heroOverlay} />
        {/* 골드 사이드 라인 */}
        <div className={styles.heroSideLine} aria-hidden="true" />

        {/* 텍스트 콘텐츠 */}
        <div className={styles.heroContent}>
          <div className={styles.heroInner}>
            <span className={styles.heroEyebrow}>{current.eyebrow}</span>
            <div className={styles.heroLine} aria-hidden="true" />
            <h1 className={styles.heroTitle}>{current.title}</h1>
            <p className={styles.heroSub}>{current.sub}</p>
          </div>
        </div>

        {/* 하단 그라데이션 페이드 */}
        <div className={styles.heroFade} aria-hidden="true" />
      </section>

      {/* ══ 탭 네비게이션 ════════════════════════════════════ */}
      <nav className={styles.tabBar} aria-label="고객센터 메뉴">
        <div className={styles.tabInner}>
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                type="button"
                className={`${styles.tabBtn} ${active ? styles.tabBtnActive : ''}`}
                onClick={() => navigate(tab.path)}
                aria-current={active ? 'page' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══ 서브 페이지 콘텐츠 영역 ══════════════════════════ */}
      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
