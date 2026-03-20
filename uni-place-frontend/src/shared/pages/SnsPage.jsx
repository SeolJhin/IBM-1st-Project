import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../app/layouts/components/Header';
import Footer from '../../app/layouts/components/Footer';
import styles from './SnsPage.module.css';

const SNS_INFO = {
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    bg: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    url: 'https://www.instagram.com/',
    desc: 'UNI-PLACE의 인스타그램에서 최신 하우스 소식과 라이프스타일 콘텐츠를 확인하세요.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="white" stroke="none"/>
      </svg>
    ),
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    bg: 'linear-gradient(135deg, #cc0000 0%, #ff0000 100%)',
    url: 'https://www.youtube.com/',
    desc: 'UNI-PLACE 유튜브 채널에서 하우스 투어, 입주자 인터뷰, 생활 팁 영상을 만나보세요.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" stroke="none"/>
      </svg>
    ),
  },
  blog: {
    name: 'Naver Blog',
    color: '#03C75A',
    bg: 'linear-gradient(135deg, #02b350 0%, #03C75A 100%)',
    url: 'https://blog.naver.com/',
    desc: 'UNI-PLACE 네이버 블로그에서 입주 후기, 생활 정보, 이벤트 소식을 확인하세요.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M16.27 12.84L7.44 2H2v20h7.73V11.16L18.56 22H24V2h-7.73v10.84z"/>
      </svg>
    ),
  },
  kakao: {
    name: 'KakaoTalk',
    color: '#3A1D1D',
    bg: 'linear-gradient(135deg, #FFE000 0%, #FEE500 100%)',
    url: 'https://pf.kakao.com/',
    desc: 'UNI-PLACE 카카오톡 채널을 추가하고 빠른 상담과 공지사항을 받아보세요.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="#3A1D1D" stroke="none">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.73 5.32 4.36 6.84l-1.1 3.96a.3.3 0 0 0 .44.33L10.3 19.6A11.8 11.8 0 0 0 12 19c5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
      </svg>
    ),
  },
};

export default function SnsPage() {
  const { platform } = useParams();
  const info = SNS_INFO[platform];

  if (!info) {
    return (
      <div>
        <Header />
        <div style={{ padding: '120px 24px', textAlign: 'center' }}>
          <p>존재하지 않는 SNS 채널입니다.</p>
          <Link to="/">홈으로 돌아가기</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* 히어로 배너 */}
        <div className={styles.hero} style={{ background: info.bg }}>
          <div className={styles.heroInner}>
            <div className={styles.iconWrap}>{info.icon}</div>
            <h1 className={styles.heroTitle}>UNI-PLACE {info.name}</h1>
            <p className={styles.heroDesc}>{info.desc}</p>
            <a
              href={info.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtn}
              style={platform === 'kakao' ? { color: '#3A1D1D', background: 'rgba(255,255,255,0.95)' } : {}}
            >
              {info.name} 바로가기 →
            </a>
          </div>
        </div>

        {/* 안내 */}
        <div className={styles.notice}>
          <div className={styles.noticeInner}>
            <p className={styles.noticeText}>
              현재 UNI-PLACE {info.name} 채널 준비 중입니다.<br />
              정식 오픈 시 공지사항을 통해 안내드리겠습니다.
            </p>
            <div className={styles.noticeLinks}>
              <Link to="/support/notice" className={styles.noticeLink}>공지사항 보기</Link>
              <span className={styles.noticeDot}>·</span>
              <Link to="/" className={styles.noticeLink}>홈으로</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
