import React from 'react';
import styles from './Footer.module.css';
import { useNavigate, Link } from 'react-router-dom';
import homeLogo from '../../../logo.png';

export default function Footer() {
  const navigate = useNavigate();

  const goHomeTop = () => {
    navigate('/');
    // 이미 홈이면 최상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.topLine} aria-hidden="true" />

      <div className={styles.body}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* 1열: 브랜드 + SNS */}
            <div className={styles.brandCol}>
              <button
                type="button"
                className={styles.brandWrap}
                onClick={goHomeTop}
                aria-label="UNI-PLACE 홈 최상단으로"
              >
                <img
                  className={styles.logoMark}
                  src={homeLogo}
                  alt="UNI PLACE logo"
                />
              </button>
              <p className={styles.slogan}>
                공간을 넘어,
                <br />
                삶을 연결하는 주거 플랫폼
              </p>
              <div className={styles.sns}>
                {/* Instagram */}
                <Link
                  to="/sns/instagram"
                  className={`${styles.snsIcon} ${styles.snsInstagram}`}
                  aria-label="Instagram"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle
                      cx="17.5"
                      cy="6.5"
                      r="1"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </Link>
                {/* YouTube */}
                <Link
                  to="/sns/youtube"
                  className={`${styles.snsIcon} ${styles.snsYoutube}`}
                  aria-label="YouTube"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                    <polygon
                      points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </Link>
                {/* 네이버 블로그 — 정식 N 로고 */}
                <Link
                  to="/sns/blog"
                  className={`${styles.snsIcon} ${styles.snsBlog}`}
                  aria-label="Naver Blog"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <path d="M16.27 12.84L7.44 2H2v20h7.73V11.16L18.56 22H24V2h-7.73v10.84z" />
                  </svg>
                </Link>
                {/* 카카오톡 */}
                <Link
                  to="/sns/kakao"
                  className={`${styles.snsIcon} ${styles.snsKakao}`}
                  aria-label="KakaoTalk"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.73 5.32 4.36 6.84l-1.1 3.96a.3.3 0 0 0 .44.33L10.3 19.6A11.8 11.8 0 0 0 12 19c5.52 0 10-3.58 10-8S17.52 3 12 3z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* 2열: 회사 */}
            <div className={styles.linkCol}>
              <p className={styles.colTitle}>COMPANY</p>
              <ul className={styles.linkList}>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/about/company')}
                  >
                    회사소개
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/about/news')}>
                    뉴스
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/about/guide')}
                  >
                    입주 가이드
                  </button>
                </li>
              </ul>
            </div>

            {/* 3열: 서비스 (공간 + 생활) */}
            <div className={styles.linkCol}>
              <p className={styles.colTitle}>SERVICES</p>
              <ul className={styles.linkList}>
                <li>
                  <button type="button" onClick={() => navigate('/rooms')}>
                    방 찾기
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/spaces')}>
                    공유공간
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/contracts/apply')}
                  >
                    계약 신청
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/commerce/room-service')}
                  >
                    룸서비스
                  </button>
                </li>
              </ul>
            </div>

            {/* 3.5열: 커뮤니티 + 고객지원 */}
            <div className={styles.linkCol}>
              <p className={styles.colTitle}>SUPPORT</p>
              <ul className={styles.linkList}>
                <li>
                  <button type="button" onClick={() => navigate('/community')}>
                    커뮤니티
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/support/notice')}
                  >
                    공지사항
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/support/faq')}
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/support/qna')}
                  >
                    Q&A
                  </button>
                </li>
              </ul>
            </div>

            {/* 4열: 연락처 */}
            <div className={styles.contactCol}>
              <p className={styles.colTitle}>CONTACT</p>
              <div className={styles.contactList}>
                <div className={styles.contactRow}>
                  <span className={styles.contactLabel}>EMAIL</span>
                  <span className={styles.contactValue}>uniplace@asdf.com</span>
                </div>
                <div className={styles.contactRow}>
                  <span className={styles.contactLabel}>PHONE</span>
                  <span className={styles.contactValue}>(+82) 02-123-4567</span>
                </div>
                <div className={styles.contactRow}>
                  <span className={styles.contactLabel}>HOURS</span>
                  <span className={styles.contactValue}>
                    Mon – Fri 10:00 – 18:00
                  </span>
                </div>
                <div className={styles.contactRow}>
                  <span className={styles.contactLabel}>OFFICE</span>
                  <span className={styles.contactValue}>
                    서울시 강남구 ㅇㅇㅇ길 1-1
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 바 — 2026, Link로 라우팅 */}
          <div className={styles.bottomBar}>
            <p className={styles.copyright}>
              © 2026 UNI-PLACE. All Rights Reserved.
            </p>
            <div className={styles.legalLinks}>
              <Link to="/terms">이용약관</Link>
              <span className={styles.dot} aria-hidden="true">
                ·
              </span>
              <Link to="/privacy">개인정보처리방침</Link>
              <span className={styles.dot} aria-hidden="true">
                ·
              </span>
              <Link to="/cookies">쿠키정책</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
