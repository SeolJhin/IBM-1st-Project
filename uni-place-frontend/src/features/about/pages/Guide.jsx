import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import styles from './about.shared.module.css';

const ABOUT_CATEGORIES = [
  { label: '회사소개', path: '/about/company' },
  { label: '뉴스',     path: '/about/news' },
  { label: '입주 가이드', path: '/about/guide' },
];

export const GUIDE_LIST = [
  {
    slug: 'move-in-process',
    tag: 'STEP 01',
    category: '입주 절차',
    num: '01',
    title: '계약부터 입주까지 4단계',
    excerpt: '매물 탐색 → 투어 예약 → 전자계약 → 입주 완료.',
    date: '2025.04',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '처음이라 막막해도 괜찮습니다. UNI-PLACE가 단계별로 함께합니다.' },
      { type: 'paragraph', text: 'STEP 01. 매물 탐색 — 지역, 가격, 시설 조건으로 원하는 방을 비교 검색합니다.\nSTEP 02. 투어 예약 — 관심 하우스를 직접 방문해 공간과 분위기를 확인합니다. 비대면 화상 투어도 가능합니다.' },
      { type: 'quote', text: '한 번의 투어가 모든 결정을 쉽게 만들어줍니다.' },
      { type: 'paragraph', text: 'STEP 03. 계약 체결 — 온라인 서류 제출과 전자 계약으로 빠르게 진행합니다. 평균 소요 시간 30분.\nSTEP 04. 입주 완료 — 입주 체크리스트와 생활 가이드, 웰컴 키트를 받고 새 생활을 시작합니다.' },
    ],
  },
  {
    slug: 'contract-guide',
    tag: 'STEP 02',
    category: '계약 가이드',
    num: '02',
    title: '전자계약 완벽 이해하기',
    excerpt: '법적 효력부터 특약 조건 확인 방법까지. 평균 30분 완료.',
    date: '2025.03',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '전자계약은 종이 계약과 동일한 법적 효력을 가집니다.' },
      { type: 'paragraph', text: '전자서명법에 따라 UNI-PLACE의 전자계약은 완전한 법적 효력을 지닙니다. 계약서는 PDF로 즉시 발급되며 언제든 확인할 수 있습니다.' },
      { type: 'quote', text: '계약은 복잡하지 않아야 합니다. 30분이면 충분합니다.' },
      { type: 'paragraph', text: '특약 사항은 반드시 계약 전 검토하세요. 중도 해지 조건, 보증금 반환 일정, 관리비 항목을 꼼꼼히 확인하는 것이 중요합니다.' },
    ],
  },
  {
    slug: 'payment-guide',
    tag: 'STEP 03',
    category: '납부 안내',
    num: '03',
    title: '월세·관리비 납부 안내',
    excerpt: '자동이체 설정, 납부일 관리, 연체 시 처리 방법.',
    date: '2025.03',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '납부일을 놓치지 않는 가장 쉬운 방법은 자동이체입니다.' },
      { type: 'paragraph', text: '매월 5일이 기본 납부일입니다. 앱 내 자동이체를 설정하면 매달 신경 쓸 필요가 없습니다.' },
      { type: 'quote', text: '납부 걱정 없이 생활에만 집중하세요.' },
      { type: 'paragraph', text: '연체 시 당일 알림이 발송되며, 3일 이내 납부 완료 시 연체료가 부과되지 않습니다.' },
    ],
  },
  {
    slug: 'checkout-guide',
    tag: 'STEP 04',
    category: '퇴실 안내',
    num: '04',
    title: '퇴실 절차와 보증금 반환',
    excerpt: '퇴실 1개월 전 통보부터 보증금 반환까지 완전 정리.',
    date: '2025.01',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '퇴실도 입주만큼 중요합니다. 미리 준비하면 문제가 없습니다.' },
      { type: 'paragraph', text: '퇴실 희망일 1개월 전 앱에서 퇴실 신청을 완료해야 합니다. 미리 신청하지 않으면 위약금이 발생할 수 있습니다.' },
      { type: 'quote', text: '준비된 퇴실이 빠른 보증금 반환을 만듭니다.' },
      { type: 'paragraph', text: '퇴실 당일 관리자와 함께 시설 점검을 완료한 후, 영업일 기준 7일 이내 보증금이 반환됩니다.' },
    ],
  },
];

const SUB_CATEGORIES = ['전체', '입주 절차', '계약 가이드', '납부 안내', '퇴실 안내'];

function GuideCard({ guide, index = 0 }) {
  const navigate = useNavigate();
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => navigate(`/about/guide/${guide.slug}`)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/about/guide/${guide.slug}`)}
    >
      <div className={styles.cardTop}
        style={{ backgroundImage: `url(${guide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className={styles.cardImgOverlay} />
        <span className={styles.cardTagOverlay}>{guide.tag}</span>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardCategory}>{guide.category}</span>
        <h2 className={styles.cardTitle}>{guide.title}</h2>
        <p className={styles.cardExcerpt}>{guide.excerpt}</p>
        <div className={styles.cardFooter}>
          <span className={styles.cardDate}>{guide.date}</span>
          <span className={styles.cardArrow}>↗</span>
        </div>
      </div>
    </article>
  );
}

export default function Guide() {
  const [active, setActive] = useState('전체');
  const filtered = active === '전체' ? GUIDE_LIST : GUIDE_LIST.filter((g) => g.category === active);

  return (
    <div className={styles.page}>
      <Header />
      <PageHeader title="About" subtitle="UNI-PLACE를 소개합니다." categories={ABOUT_CATEGORIES} />
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
          ? <div className={styles.grid}>{filtered.map((g, i) => <GuideCard key={g.slug} guide={g} index={i} />)}</div>
          : <div className={styles.empty}>해당 카테고리에 가이드가 없습니다.</div>
        }
      </main>
      <Footer />
    </div>
  );
}
