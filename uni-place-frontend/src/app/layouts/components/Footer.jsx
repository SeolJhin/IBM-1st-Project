import React from "react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <section className={styles.bottom}>
        <div className={styles.container}>
          <div className={styles.bottomGrid}>
            <div className={styles.logoWrap}>
              <div className={styles.logoInline}>
                <LogoMark className={styles.logoMark} />
                <div>
                  <p className={styles.logoTitle}>UNI-PLACE</p>
                  <p className={styles.logoSub}>CO-LIVING PLATFORM</p>
                </div>
              </div>
            </div>

            <section className={styles.aboutCol}>
              <div className={styles.aboutHead}>
                <p className={styles.kicker}>TOUCH ABOUT US</p>
                <h3 className={styles.headline}>
                  To The Global
                  <br />
                  Co-Living Platform
                </h3>
              </div>

              <div className={styles.contactList}>
                <div>
                  <p className={styles.miniKicker}>EMAIL</p>
                  <p className={styles.bodyText}>uniplace@asdf.com</p>
                </div>
                <div>
                  <p className={styles.miniKicker}>PHONE</p>
                  <p className={styles.bodyText}>(+82) 02-123-4567</p>
                </div>
                <div>
                  <p className={styles.miniKicker}>OFFICE</p>
                  <p className={styles.bodyText}>
                    대한민국 서울시 강남
                    <br />
                    ㅇㅇㅇ길 1-1
                  </p>
                </div>
              </div>
            </section>

            <nav aria-label="Help" className={styles.navCol}>
              <p className={styles.navTitle}>HELP</p>
              <ul className={styles.navList}>
                <li>
                  <a href="/sitemap">사이트 맵</a>
                </li>
                <li>
                  <a href="/support">고객 안내</a>
                </li>
                <li>
                  <a href="/careers">채용</a>
                </li>
              </ul>
            </nav>

            <nav aria-label="Legal" className={styles.navCol}>
              <p className={styles.navTitle}>법적고지</p>
              <ul className={styles.navList}>
                <li>
                  <a href="/terms">이용 약관</a>
                </li>
                <li>
                  <a href="/cookies">쿠키 정책</a>
                </li>
                <li>
                  <a href="/cookie-settings">쿠키 설정</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </section>
    </footer>
  );
}

function LogoMark({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M10 20L24 10l14 10" stroke="#BD9853" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M14 20v16h20V20" stroke="#BD9853" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M18 36v-8h12v8" stroke="#BD9853" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}
