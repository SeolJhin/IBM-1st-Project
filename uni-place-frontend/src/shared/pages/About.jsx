import Header from '../../app/layouts/components/Header';
import Footer from '../../app/layouts/components/Footer';
import PageHeader from '../components/PageHeader/PageHeader';
import styles from './About.module.css';

const pageCategories = [
  { label: '홈', path: '/' },
  { label: '코리빙 소개', path: '/about' },
  { label: '커뮤니티', path: '/community' },
  { label: '입주 가이드', path: '/guide' },
  { label: '뉴스', path: '/news' },
];

const pageText = {
  about: {
    title: '코리빙 소개',
    subtitle: 'UNI-PLACE가 지향하는 공유주거 경험을 소개합니다.',
    heading: '생활 중심의 코리빙 플랫폼',
    body: '유니플레이스는 지역, 예산, 생활 스타일 기준으로 매칭 가능한 공유주거를 탐색하고, 계약 전 상담부터 입주 후 커뮤니티까지 연결합니다.',
  },
  community: {
    title: '커뮤니티',
    subtitle: '입주민 중심 프로그램과 네트워킹 정보를 확인하세요.',
    heading: '함께 사는 경험을 확장하는 프로그램',
    body: '네트워킹, 취미 모임, 지역 연계 이벤트 등 거주 경험을 풍부하게 만드는 프로그램을 운영합니다.',
  },
  guide: {
    title: '입주 가이드',
    subtitle: '계약부터 입주까지 절차를 빠르게 확인하세요.',
    heading: '한눈에 보는 입주 절차',
    body: '매물 비교, 계약 조건 확인, 입주 체크리스트, 생활 규정 안내까지 단계별로 안내합니다.',
  },
  news: {
    title: '뉴스',
    subtitle: '신규 하우스와 업데이트 소식을 제공합니다.',
    heading: 'UNI-PLACE 최신 소식',
    body: '신규 매물 오픈, 서비스 업데이트, 운영 정책 변경과 같은 주요 공지를 빠르게 확인할 수 있습니다.',
  },
};

export default function About({ variant = 'about' }) {
  const content = pageText[variant] ?? pageText.about;

  return (
    <div className={styles.page}>
      <Header />
      <PageHeader
        title={content.title}
        subtitle={content.subtitle}
        categories={pageCategories}
      />

      <main className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.heading}>{content.heading}</h2>
          <p className={styles.body}>{content.body}</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
