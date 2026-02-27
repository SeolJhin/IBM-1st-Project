import Header from "../../app/layouts/components/Header";
import Footer from "../../app/layouts/components/Footer";
import PageHeader from "../components/PageHeader/PageHeader";
import styles from "./CompanyInfo.module.css";

const pageCategories = [
  { label: "홈", path: "/" },
  { label: "회사소개", path: "/company_info" },
  { label: "커뮤니티", path: "/community" },
  { label: "입주 가이드", path: "/guide" },
  { label: "뉴스", path: "/news" },
];

const problemItems = [
  "계약·결제·관리 시스템이 분리되어 있음",
  "임대인과 임차인 간 정보 비대칭",
  "월세·관리비·서비스 비용 관리가 불투명",
  "커뮤니티 기능이 단절되어 있음",
  "운영 자동화 부족으로 비효율 발생",
];

const solutionItems = [
  "온라인 계약 및 전자서명",
  "통합 결제 시스템 (월세, 서비스, 부가상품)",
  "공간 예약 시스템",
  "입주자 커뮤니티",
  "운영 자동화 관리 대시보드",
  "정산 및 데이터 기반 운영 분석",
];

const missionItems = [
  "임차인에게는 안전하고 간편한 주거 경험 제공",
  "운영자에게는 효율적인 수익 구조와 자동화 시스템 제공",
  "공간에는 데이터 기반 최적 운영 환경 제공",
];

export default function CompanyInfo() {
  return (
    <div className={styles.page}>
      <Header />
      <PageHeader
        title="회사소개"
        subtitle="UNI-PLACE가 만드는 통합 주거 플랫폼을 소개합니다."
        categories={pageCategories}
      />

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.heroEyebrow}>COMPANY OVERVIEW</p>
          <h1 className={styles.heroTitle}>공간을 넘어, 삶을 연결합니다.</h1>
          <p className={styles.heroLead}>
            UNI-PLACE는 주거를 하나의 플랫폼 경험으로 재정의합니다.
          </p>
          <p className={styles.heroTech}>
            Living as a Platform. 계약부터 커뮤니티까지, 하나로 연결된 주거
            경험.
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Problem</p>
            <h2 className={styles.sectionTitle}>우리가 해결하는 문제</h2>
            <p className={styles.sectionBody}>
              기존 공유주거 시장의 구조적 비효율을 통합 플랫폼으로 해결합니다.
            </p>
          </div>
          <ul className={styles.problemList}>
            {problemItems.map((item) => (
              <li key={item} className={styles.problemItem}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Solution</p>
            <h2 className={styles.sectionTitle}>UNI-PLACE의 솔루션</h2>
          </div>
          <div className={styles.solutionGrid}>
            {solutionItems.map((item) => (
              <article key={item} className={styles.solutionCard}>
                <span className={styles.check}>✔</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
          <p className={styles.quote}>
            주거를 단순한 "방"이 아닌, 하나의 디지털 경험으로.
          </p>
        </section>

        <section className={styles.vmGrid}>
          <article className={styles.vmCard}>
            <p className={styles.sectionLabel}>Vision</p>
            <h3 className={styles.vmTitle}>
              도시 속 공간을 가장 효율적이고 투명한 시스템으로 혁신한다.
            </h3>
          </article>
          <article className={styles.vmCard}>
            <p className={styles.sectionLabel}>Mission</p>
            <ul className={styles.missionList}>
              {missionItems.map((item) => (
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
