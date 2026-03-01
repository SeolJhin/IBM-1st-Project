import Header from "../../app/layouts/components/Header";
import Footer from "../../app/layouts/components/Footer";
import PageHeader from "../components/PageHeader/PageHeader";
import styles from "./CompanyInfo.module.css";

const pageCategories = [
  { label: "홈", path: "/" },
  { label: "회사소개", path: "/company_info" },
  { label: "뉴스", path: "/news" },
  { label: "입주 가이드", path: "/guide" },
];

const pageContent = {
  company: {
    pageTitle: "회사소개",
    pageSubtitle: "UNI-PLACE가 만드는 통합 주거 플랫폼을 소개합니다.",
    heroEyebrow: "COMPANY OVERVIEW",
    heroTitle: "공간을 연결하고, 생활을 완성합니다.",
    heroLead: "UNI-PLACE는 주거를 하나의 플랫폼 경험으로 재정의합니다.",
    heroTech: "Living as a Platform. 계약부터 커뮤니티까지, 하나로 연결된 주거 경험.",
    section1Label: "Problem",
    section1Title: "우리가 해결하는 문제",
    section1Body: "기존 공유주거 시장의 구조적 비효율을 통합 플랫폼으로 해결합니다.",
    section1Items: [
      "계약·결제·관리 서비스가 분리되어 사용자 경험이 단절됩니다.",
      "공실과 입주자 정보가 실시간으로 연결되지 않습니다.",
      "월세·관리비·서비스 비용을 한 번에 관리하기 어렵습니다.",
      "입주 후 커뮤니티와 운영 지원이 분산되어 있습니다.",
      "운영 데이터가 흩어져 비용과 품질이 동시에 악화됩니다.",
    ],
    section2Label: "Solution",
    section2Title: "UNI-PLACE의 통합 기능",
    section2Items: [
      "온라인 계약 및 전자서명",
      "통합 결제 서비스(월세, 관리비, 부가 서비스)",
      "공간 예약 및 이용 관리",
      "입주민 커뮤니티",
      "운영 자동화 및 대시보드",
      "정산 및 데이터 기반 운영 분석",
    ],
    quote: "주거를 단순한 방이 아니라, 연결된 생활 경험으로 만듭니다.",
    visionTitle: "도시의 모든 공간이 더 효율적이고 투명한 서비스로 혁신됩니다.",
    missionItems: [
      "입주민에게는 안전하고 편리한 주거 경험 제공",
      "운영자에게는 수익성과 효율을 동시에 제공",
      "공간에는 데이터 기반 최적 운영 환경 제공",
    ],
  },
  news: {
    pageTitle: "뉴스",
    pageSubtitle: "UNI-PLACE의 최신 소식과 주요 업데이트를 전합니다.",
    heroEyebrow: "NEWSROOM",
    heroTitle: "최근 소식",
    heroLead: "제품, 운영, 파트너십 관련 뉴스를 한 곳에서 확인하세요.",
    heroTech: "서비스 개선 내역과 공지 사항을 빠르게 전달합니다.",
    section1Label: "Latest",
    section1Title: "주요 업데이트",
    section1Body: "최근 업데이트와 운영 공지를 모아 제공합니다.",
    section1Items: [
      "신규 지역 제휴 확장 및 입주 가능 공간 확대",
      "결제/정산 모듈 고도화 및 안정성 개선",
      "입주민용 커뮤니티 기능 업데이트",
      "공간 운영자를 위한 통합 리포트 공개",
      "고객센터 처리 속도 개선 및 지원 범위 확대",
    ],
    section2Label: "Coverage",
    section2Title: "뉴스에서 확인할 수 있는 내용",
    section2Items: [
      "서비스 릴리스 노트",
      "파트너십/협약 소식",
      "정책 및 이용 가이드 변경",
      "장애/점검 공지",
      "이벤트 및 캠페인",
      "운영 성과 리포트",
    ],
    quote: "중요한 변경 사항은 뉴스 탭에서 가장 먼저 확인할 수 있습니다.",
    visionTitle: "투명한 정보 공개로 사용자 신뢰를 높입니다.",
    missionItems: [
      "정확한 공지 전달",
      "변경 이력의 빠른 공유",
      "운영 상황의 투명한 공개",
    ],
  },
  guide: {
    pageTitle: "입주 가이드",
    pageSubtitle: "계약 전부터 입주 후까지 단계별로 안내합니다.",
    heroEyebrow: "MOVE-IN GUIDE",
    heroTitle: "입주 절차 한눈에 보기",
    heroLead: "처음 입주하는 사용자도 쉽게 따라갈 수 있는 가이드입니다.",
    heroTech: "문의가 많은 항목을 중심으로 필수 절차를 정리했습니다.",
    section1Label: "Step",
    section1Title: "입주 전 준비",
    section1Body: "아래 순서대로 진행하면 빠르게 입주할 수 있습니다.",
    section1Items: [
      "매물 비교 후 희망 공간 선택",
      "계약 조건 및 특약 확인",
      "전자계약 체결 및 보증금/월세 납부",
      "입주 일정 확정 및 체크리스트 확인",
      "입주 당일 시설 인수 및 초기 점검",
    ],
    section2Label: "Tip",
    section2Title: "입주 후 자주 사용하는 기능",
    section2Items: [
      "관리비/월세 납부 내역 확인",
      "공간/투어 예약 기능",
      "공지사항 및 커뮤니티 참여",
      "1:1 문의 및 민원 등록",
      "계약/정산 문서 확인",
      "알림 설정으로 중요 공지 수신",
    ],
    quote: "가이드를 따라가면 입주 전후 절차를 빠짐없이 완료할 수 있습니다.",
    visionTitle: "모든 사용자가 동일한 품질의 입주 경험을 누릴 수 있어야 합니다.",
    missionItems: [
      "단계별 안내의 명확성",
      "필수 절차 누락 방지",
      "입주 이후 지원 연계 강화",
    ],
  },
};

export default function CompanyInfo({ variant = "company" }) {
  const content = pageContent[variant] ?? pageContent.company;

  return (
    <div className={styles.page}>
      <Header />
      <PageHeader
        title={content.pageTitle}
        subtitle={content.pageSubtitle}
        categories={pageCategories}
      />

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.heroEyebrow}>{content.heroEyebrow}</p>
          <h1 className={styles.heroTitle}>{content.heroTitle}</h1>
          <p className={styles.heroLead}>{content.heroLead}</p>
          <p className={styles.heroTech}>{content.heroTech}</p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{content.section1Label}</p>
            <h2 className={styles.sectionTitle}>{content.section1Title}</h2>
            <p className={styles.sectionBody}>{content.section1Body}</p>
          </div>
          <ul className={styles.problemList}>
            {content.section1Items.map((item) => (
              <li key={item} className={styles.problemItem}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{content.section2Label}</p>
            <h2 className={styles.sectionTitle}>{content.section2Title}</h2>
          </div>
          <div className={styles.solutionGrid}>
            {content.section2Items.map((item) => (
              <article key={item} className={styles.solutionCard}>
                <span className={styles.check}>+</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
          <p className={styles.quote}>{content.quote}</p>
        </section>

        <section className={styles.vmGrid}>
          <article className={styles.vmCard}>
            <p className={styles.sectionLabel}>Vision</p>
            <h3 className={styles.vmTitle}>{content.visionTitle}</h3>
          </article>
          <article className={styles.vmCard}>
            <p className={styles.sectionLabel}>Mission</p>
            <ul className={styles.missionList}>
              {content.missionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
