import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import styles from './about.shared.module.css';

const ABOUT_CATEGORIES = [
  { label: '회사소개', path: '/about/company' },
  { label: '뉴스',     path: '/about/news' },
  { label: '입주 가이드', path: '/about/guide' },
];

export const NEWS_LIST = [
  {
    slug: 'sinchon-open',
    tag: 'OPEN',
    category: '신규 오픈',
    num: '01',
    title: '마포구 신촌 하우스 오픈',
    excerpt: '40개 룸, 루프탑 커먼 라운지. 7월 1일부터 입주 가능.',
    date: '2025.06.15',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '서울에서 가장 활기찬 동네, 신촌. UNI-PLACE의 18번째 하우스가 문을 엽니다.' },
      { type: 'paragraph', text: '마포구 신촌동에 위치한 신규 하우스는 지하 1층~지상 8층, 총 40개 룸으로 구성됩니다. 1층 카페 라운지, 6층 스터디룸, 옥상 루프탑 가든이 공용 공간으로 제공됩니다.' },
      { type: 'quote', text: '신촌은 젊음의 에너지가 넘치는 곳. UNI-PLACE 신촌 하우스는 그 에너지를 담은 공간입니다.' },
      { type: 'paragraph', text: '7월 1일부터 입주 가능하며, 현재 얼리버드 신청을 받고 있습니다.' },
    ],
  },
  {
    slug: 'tour-renewal',
    tag: 'UPDATE',
    category: '서비스 개편',
    num: '02',
    title: '투어 예약 시스템 전면 개편',
    excerpt: '예약 완료 시간 70% 단축. 실시간 슬롯 확인 오픈.',
    date: '2025.05.20',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '예약하고 기다리는 시간이 불편하셨나요? 이제 실시간으로 확인할 수 있습니다.' },
      { type: 'paragraph', text: '새로운 투어 예약 시스템은 실시간 슬롯 확인, 카카오톡 알림, 일정 변경 셀프서비스 기능을 갖추었습니다.' },
      { type: 'quote', text: '예약부터 입주까지, 기다림 없이 이어지는 경험.' },
      { type: 'paragraph', text: '기존 대비 예약 완료 시간이 평균 70% 단축되었습니다.' },
    ],
  },
  {
    slug: 'ai-matching',
    tag: 'TECH',
    category: '기술 업데이트',
    num: '03',
    title: 'AI 입주민 매칭 베타 출시',
    excerpt: '라이프스타일 기반 룸메이트 추천. 베타 테스터 모집 중.',
    date: '2025.05.05',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '맞는 사람과 살면 모든 게 달라집니다.' },
      { type: 'paragraph', text: '새로운 AI 매칭 시스템은 입주 신청 시 라이프스타일 설문을 분석해 가장 잘 맞는 룸메이트를 추천합니다.' },
      { type: 'quote', text: '데이터가 만든 인연이, 더 오래 함께합니다.' },
      { type: 'paragraph', text: '현재 베타 테스트 참가자를 모집하고 있습니다.' },
    ],
  },
  {
    slug: 'series-a',
    tag: 'INVEST',
    category: '투자 유치',
    num: '04',
    title: '시리즈 A 80억 투자 유치 완료',
    excerpt: '국내 주요 VC 3사. 전국 확장과 플랫폼 고도화에 투자.',
    date: '2025.03.10',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '더 많은 도시, 더 많은 사람들과 함께할 준비가 되었습니다.' },
      { type: 'paragraph', text: '국내 주요 VC 3사로부터 시리즈 A 투자 80억 원을 유치했습니다.' },
      { type: 'quote', text: '투자자들이 먼저 알아본 주거의 미래.' },
      { type: 'paragraph', text: '2025년 내 수도권 5개 추가 하우스 오픈, 2026년 부산·대구·광주 진출을 목표로 합니다.' },
    ],
  },
];

const SUB_CATEGORIES = ['전체', '신규 오픈', '서비스 개편', '기술 업데이트', '투자 유치'];

function NewsCard({ news, index = 0 }) {
  const navigate = useNavigate();
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => navigate(`/about/news/${news.slug}`)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/about/news/${news.slug}`)}
    >
      <div className={styles.cardTop}
        style={{ backgroundImage: `url(${news.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className={styles.cardImgOverlay} />
        <span className={styles.cardTagOverlay}>{news.tag}</span>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardCategory}>{news.category}</span>
        <h2 className={styles.cardTitle}>{news.title}</h2>
        <p className={styles.cardExcerpt}>{news.excerpt}</p>
        <div className={styles.cardFooter}>
          <span className={styles.cardDate}>{news.date}</span>
          <span className={styles.cardArrow}>↗</span>
        </div>
      </div>
    </article>
  );
}

export default function News() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState('전체');
  const filtered = active === '전체' ? NEWS_LIST : NEWS_LIST.filter((n) => n.category === active);

  return (
    <div className={styles.page}>
      <Header />
      <section className={styles.heroSection}>
        <div className={styles.heroBg} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=85')` }} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroSideLine} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroInner}>
            <span className={styles.heroEyebrow}>NEWSROOM</span>
            <div className={styles.heroLine} aria-hidden="true" />
            <h1 className={styles.heroTitle}>뉴스</h1>
            <p className={styles.heroSub}>신규 하우스 오픈, 서비스 업데이트 등 UNI-PLACE의 새로운 소식을 확인해보세요.</p>
          </div>
        </div>
        <div className={styles.heroFade} aria-hidden="true" />
      </section>
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          {ABOUT_CATEGORIES.map((cat) => (
            <button key={cat.path} type="button"
              className={`${styles.filterBtn} ${location.pathname === cat.path ? styles.filterActive : ''}`}
              onClick={() => navigate(cat.path)}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          {SUB_CATEGORIES.map((cat) => (
            <button key={cat}
              className={`${styles.filterBtn} ${active === cat ? styles.filterActive : ''}`}
              onClick={() => setActive(cat)} type="button">{cat}
            </button>
          ))}
        </div>
      </div>
      <main className={styles.main}>
        {filtered.length > 0
          ? <div className={styles.grid}>{filtered.map((n, i) => <NewsCard key={n.slug} news={n} index={i} />)}</div>
          : <div className={styles.empty}>해당 카테고리에 뉴스가 없습니다.</div>
        }
      </main>
      <Footer />
    </div>
  );
}
