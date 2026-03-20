import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../app/layouts/components/Header';
import Footer from '../../app/layouts/components/Footer';
import styles from './About.module.css';

/* ══════════════════════════════════════════════════════════════
   스토리 데이터 — 실제 API 연동 시 이 배열을 교체하면 됩니다
   ══════════════════════════════════════════════════════════════ */
export const ABOUT_STORIES = [
  {
    slug: 'coliving-platform',
    category: '코리빙 소개',
    tag: 'ABOUT',
    featured: true,
    title: '생활 중심의 코리빙 플랫폼',
    subtitle: '유니플레이스가 지향하는 공유주거의 새로운 기준',
    excerpt:
      '지역, 예산, 생활 스타일 기준으로 매칭 가능한 공유주거를 탐색하고, 계약 전 상담부터 입주 후 커뮤니티까지 연결합니다.',
    body: [
      { type: 'lead', text: '공유주거는 단순히 공간을 나누는 것이 아닙니다. 사람과 사람이 연결되고, 일상이 풍요로워지는 경험입니다.' },
      { type: 'paragraph', text: '유니플레이스는 2020년부터 국내 최초로 라이프스타일 기반 코리빙 매칭 시스템을 운영해왔습니다. 단순히 빈 방을 채우는 것이 아니라, 서로 잘 맞는 사람들이 함께 살 수 있도록 세심하게 연결합니다.' },
      { type: 'quote', text: '집은 단순한 공간이 아닙니다. 당신의 다음 챕터가 시작되는 곳입니다.' },
      { type: 'paragraph', text: '현재 서울 전역 18개 하우스에서 500명 이상의 입주민이 유니플레이스와 함께 생활하고 있습니다. 재계약률 98%는 단순한 숫자가 아닌, 매일의 작은 경험이 쌓인 결과입니다.' },
      { type: 'paragraph', text: '올해부터는 투어 예약 AI 매칭, 실시간 커뮤니티 채널, 입주민 전용 혜택 프로그램 등 디지털 경험을 전면 개편합니다. 더 나은 공유주거를 위해 유니플레이스는 계속 나아갑니다.' },
    ],
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2416 60%, #B8945A22 100%)',
    accentColor: '#B8945A',
    date: '2025.06',
  },
  {
    slug: 'networking-night',
    category: '커뮤니티',
    tag: 'COMMUNITY',
    featured: false,
    title: '함께 사는 경험을 확장하는 프로그램',
    subtitle: '[네트워킹 나잇] 입주민 소셜 이벤트',
    excerpt: '매월 입주민과 새로운 이웃을 연결하는 소셜 이벤트. 한 번의 만남이 평생의 인연이 됩니다.',
    body: [
      { type: 'lead', text: '처음엔 낯선 이웃이었지만, 함께한 저녁 한 끼가 모든 것을 바꿨습니다.' },
      { type: 'paragraph', text: '네트워킹 나잇은 매월 마지막 금요일 저녁, 하우스 공용 라운지에서 진행됩니다. 요리, 음악, 보드게임을 곁들인 가볍고 따뜻한 시간입니다.' },
      { type: 'quote', text: '같은 공간에 사는 사람끼리 오히려 모르고 지내는 게 더 이상하잖아요.' },
      { type: 'paragraph', text: '2024년 기준 누적 참가자 1,200명. 이 중 38%는 이벤트에서 만난 인연을 통해 새로운 프로젝트를 시작했다고 답했습니다.' },
    ],
    gradient: 'linear-gradient(135deg, #0d1117 0%, #1c1c2e 100%)',
    accentColor: '#7c83fd',
    date: '2025.05',
  },
  {
    slug: 'move-in-guide',
    category: '입주 가이드',
    tag: 'GUIDE',
    featured: false,
    title: '한눈에 보는 입주 절차',
    subtitle: '계약부터 입주까지, 4단계 완전 정복',
    excerpt: '매물 비교, 계약 조건 확인, 입주 체크리스트까지. 처음 코리빙을 시작하는 분을 위한 완벽 가이드.',
    body: [
      { type: 'lead', text: '처음이라 막막해도 괜찮습니다. 유니플레이스가 단계별로 함께합니다.' },
      { type: 'paragraph', text: 'STEP 01. 매물 탐색 — 지역, 가격, 시설 조건으로 원하는 방을 비교 검색합니다. 1:1 채팅 상담도 가능합니다.' },
      { type: 'paragraph', text: 'STEP 02. 투어 예약 — 관심 하우스를 직접 방문해 공간과 분위기를 확인합니다. 비대면 화상 투어도 선택 가능합니다.' },
      { type: 'paragraph', text: 'STEP 03. 계약 체결 — 온라인 서류 제출과 전자 계약으로 빠르게 진행합니다. 평균 소요 시간 30분.' },
      { type: 'paragraph', text: 'STEP 04. 입주 완료 — 입주 체크리스트와 생활 가이드를 받고 새 생활을 시작합니다. 입주 첫 날 웰컴 키트도 준비되어 있습니다.' },
    ],
    gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    accentColor: '#4ecdc4',
    date: '2025.04',
  },
  {
    slug: 'new-house-open',
    category: '뉴스',
    tag: 'NEWS',
    featured: false,
    title: '마포구 신촌 하우스 오픈',
    subtitle: '[신규 오픈] 40개 룸, 루프탑 커먼 라운지',
    excerpt: '7월 1일부터 입주 가능한 신촌 하우스. 루프탑 라운지와 스튜디오형 공용 공간이 포함되었습니다.',
    body: [
      { type: 'lead', text: '서울에서 가장 활기찬 동네, 신촌. 유니플레이스의 18번째 하우스가 문을 엽니다.' },
      { type: 'paragraph', text: '마포구 신촌동에 위치한 신규 하우스는 지하 1층~지상 8층, 총 40개 룸으로 구성됩니다. 1층 카페 라운지, 6층 스터디룸, 옥상 루프탑 가든이 공용 공간으로 제공됩니다.' },
      { type: 'quote', text: '신촌은 젊음의 에너지가 넘치는 곳. 유니플레이스 신촌 하우스는 그 에너지를 담은 공간입니다.' },
      { type: 'paragraph', text: '7월 1일부터 입주 가능하며, 현재 얼리버드 신청을 받고 있습니다. 투어 예약은 앱 또는 웹에서 신청하세요.' },
    ],
    gradient: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 60%, #B8945A33 100%)',
    accentColor: '#B8945A',
    date: '2025.06',
  },
  {
    slug: 'hobby-class',
    category: '커뮤니티',
    tag: 'COMMUNITY',
    featured: false,
    title: '취미 클래스: 드로잉·요리·사진',
    subtitle: '상시 운영 중인 입주민 전용 취미 모임',
    excerpt: '혼자였다면 못 했을 것들. 같이하니까 해낼 수 있었습니다.',
    body: [
      { type: 'lead', text: '매주 화요일 저녁, 하우스 3층 공용 주방에서는 특별한 냄새가 납니다.' },
      { type: 'paragraph', text: '요리 클래스, 드로잉 워크숍, 필름 카메라 스터디 등 다양한 취미 모임이 상시 운영됩니다. 전문 강사 없이, 입주민 중 잘하는 분이 호스트가 되는 방식입니다.' },
      { type: 'quote', text: '제가 만든 파스타를 이웃이 맛있다고 해줬을 때, 그게 제일 기억에 남아요.' },
    ],
    gradient: 'linear-gradient(135deg, #2d0a3e 0%, #4a1260 100%)',
    accentColor: '#c77dff',
    date: '2025.03',
  },
  {
    slug: 'service-update',
    category: '뉴스',
    tag: 'NEWS',
    featured: false,
    title: '투어 예약 시스템 개편',
    subtitle: '실시간 예약 확인 + 알림 기능 강화',
    excerpt: '더 빠르고, 더 편리하게. 유니플레이스 투어 예약 UX가 전면 개편되었습니다.',
    body: [
      { type: 'lead', text: '예약하고 기다리는 시간이 불편하셨나요? 이제 실시간으로 확인할 수 있습니다.' },
      { type: 'paragraph', text: '새로운 투어 예약 시스템은 실시간 슬롯 확인, 카카오톡 알림, 일정 변경 셀프서비스 기능을 갖추었습니다. 기존 대비 예약 완료 시간이 평균 70% 단축되었습니다.' },
    ],
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)',
    accentColor: '#60a5fa',
    date: '2025.05',
  },
];

const CATEGORIES = ['전체', '코리빙 소개', '커뮤니티', '입주 가이드', '뉴스'];

/* ══════════════════════════════════════════════════════════════
   카드 컴포넌트
   ══════════════════════════════════════════════════════════════ */
function StoryCard({ story, featured = false, index = 0 }) {
  const navigate = useNavigate();
  const delay = `${index * 0.08}s`;

  return (
    <article
      className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}
      style={{ animationDelay: delay }}
      onClick={() => navigate(`/about/${story.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/about/${story.slug}`)}
      aria-label={story.title}
    >
      {/* 이미지 영역 — 그라디언트 배경 */}
      <div className={styles.cardImage} style={{ background: story.gradient }}>
        <div className={styles.cardImageOverlay} />
        <span className={styles.cardTagOverlay}>{story.tag}</span>
      </div>

      {/* 텍스트 영역 */}
      <div className={styles.cardBody}>
        <span className={styles.cardCategory}>{story.category}</span>
        <h2 className={`${styles.cardTitle} ${featured ? styles.cardTitleFeatured : ''}`}>
          {story.title}
        </h2>
        {featured && <p className={styles.cardExcerpt}>{story.excerpt}</p>}
        <div className={styles.cardFooter}>
          <span className={styles.cardDate}>{story.date}</span>
          <span className={styles.cardReadMore}>읽어보기 →</span>
        </div>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════════════════════════ */
export default function About() {
  const [activeCategory, setActiveCategory] = useState('전체');

  const filtered =
    activeCategory === '전체'
      ? ABOUT_STORIES
      : ABOUT_STORIES.filter((s) => s.category === activeCategory);

  const featured = filtered.find((s) => s.featured) ?? filtered[0];
  const rest = filtered.filter((s) => s.slug !== featured?.slug);

  return (
    <div className={styles.page}>
      <Header />

      {/* ── 페이지 헤더 ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <span className={styles.pageLabel}>JOURNAL</span>
          <h1 className={styles.pageTitle}>UNI-PLACE 이야기</h1>
          <p className={styles.pageSubtitle}>
            코리빙을 선택한 사람들의 이야기, 함께 사는 법, 그리고 공간이 만드는 삶.
          </p>
        </div>
      </div>

      {/* ── 카테고리 필터 ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveCategory(cat)}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── 콘텐츠 영역 ── */}
      <main className={styles.main}>
        {/* Featured 카드 — 상단 강조 */}
        {featured && (
          <section className={styles.featuredSection}>
            <StoryCard story={featured} featured index={0} />
          </section>
        )}

        {/* 나머지 카드 그리드 */}
        {rest.length > 0 && (
          <section className={styles.gridSection}>
            <div className={styles.grid}>
              {rest.map((story, i) => (
                <StoryCard key={story.slug} story={story} index={i + 1} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p>해당 카테고리에 아직 콘텐츠가 없습니다.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
