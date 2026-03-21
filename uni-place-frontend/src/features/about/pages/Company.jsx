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

export const COMPANY_CARDS = [
  {
    id: 'overview',
    tag: 'OVERVIEW',
    category: '플랫폼 소개',
    num: '01',
    title: '공간을 연결하고 생활을 완성합니다',
    excerpt: 'UNI-PLACE는 주거를 하나의 플랫폼 경험으로 재정의합니다.',
    date: '2020',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '공유주거는 단순히 공간을 나누는 것이 아닙니다. 사람과 사람이 연결되고, 일상이 풍요로워지는 경험입니다.' },
      { type: 'paragraph', text: 'UNI-PLACE는 2020년부터 국내 최초로 라이프스타일 기반 코리빙 매칭 시스템을 운영해왔습니다. 단순히 빈 방을 채우는 것이 아니라, 서로 잘 맞는 사람들이 함께 살 수 있도록 세심하게 연결합니다.' },
      { type: 'quote', text: '집은 단순한 공간이 아닙니다. 당신의 다음 챕터가 시작되는 곳입니다.' },
      { type: 'paragraph', text: '현재 서울 전역 18개 하우스에서 500명 이상의 입주민이 UNI-PLACE와 함께 생활하고 있습니다. 재계약률 98%는 매일의 작은 경험이 쌓인 결과입니다.' },
    ],
  },
  {
    id: 'solution',
    tag: 'SOLUTION',
    category: '통합 기능',
    num: '02',
    title: '계약부터 커뮤니티까지 하나의 플랫폼',
    excerpt: '온라인 계약, 통합 결제, 공간 예약, 커뮤니티, 운영 자동화.',
    date: '2023',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '기존 공유주거 시장의 구조적 비효율을 통합 플랫폼으로 해결합니다.' },
      { type: 'paragraph', text: '계약·결제·관리 서비스가 분리되어 사용자 경험이 단절되는 문제를 UNI-PLACE가 해결합니다. 온라인 전자계약, 통합 결제, 공간 예약, 입주민 커뮤니티, 운영 자동화 대시보드까지 하나로 연결됩니다.' },
      { type: 'quote', text: '주거를 단순한 방이 아니라, 연결된 생활 경험으로 만듭니다.' },
      { type: 'paragraph', text: '새로운 투어 예약 시스템은 실시간 슬롯 확인과 카카오톡 알림을 지원하며, 기존 대비 예약 완료 시간을 평균 70% 단축했습니다.' },
    ],
  },
  {
    id: 'vision',
    tag: 'VISION',
    category: '비전 & 미션',
    num: '03',
    title: '도시 주거의 새로운 기준을 만듭니다',
    excerpt: '2030년까지 전국 50개 도시, 10만 명의 입주민과 함께합니다.',
    date: '2030',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80&fit=crop',
    body: [
      { type: 'lead', text: '우리는 단순한 임대 플랫폼이 아닙니다. 도시에서 살아가는 방식을 재정의합니다.' },
      { type: 'paragraph', text: '2030년까지 전국 50개 도시에 확장하고, 10만 명의 입주민이 UNI-PLACE와 함께 생활하는 것을 목표로 합니다.' },
      { type: 'quote', text: '더 나은 도시, 더 나은 커뮤니티, 더 나은 삶.' },
      { type: 'paragraph', text: '입주민에게는 안전하고 편리한 주거 경험, 운영자에게는 수익성과 효율, 도시 공간에는 데이터 기반 최적 운영 환경을 제공합니다.' },
    ],
  },
];

function CompanyCard({ card, index = 0 }) {
  const navigate = useNavigate();
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => navigate(`/about/company/${card.id}`)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/about/company/${card.id}`)}
    >
      <div className={styles.cardTop}
        style={{ backgroundImage: `url(${card.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className={styles.cardImgOverlay} />
        <span className={styles.cardTagOverlay}>{card.tag}</span>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardCategory}>{card.category}</span>
        <h2 className={styles.cardTitle}>{card.title}</h2>
        <p className={styles.cardExcerpt}>{card.excerpt}</p>
        <div className={styles.cardFooter}>
          <span className={styles.cardDate}>{card.date}</span>
          <span className={styles.cardArrow}>↗</span>
        </div>
      </div>
    </article>
  );
}

export default function Company() {
  return (
    <div className={styles.page}>
      <Header />
      <PageHeader title="About" subtitle="UNI-PLACE를 소개합니다." categories={ABOUT_CATEGORIES} />
      <main className={styles.main}>
        <div className={styles.grid}>
          {COMPANY_CARDS.map((card, i) => <CompanyCard key={card.id} card={card} index={i} />)}
        </div>
      </main>
      <Footer />
    </div>
  );
}
