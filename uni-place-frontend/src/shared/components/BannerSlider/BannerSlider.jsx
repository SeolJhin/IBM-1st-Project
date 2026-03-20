// src/shared/components/BannerSlider/BannerSlider.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './BannerSlider.module.css';
import { toApiImageUrl } from '../../utils/imageUrl';

const API_PREFIX = '/api';

const DEFAULT_BANNERS = [
  {
    banId: 'default-1',
    banTitle: '나만의 공간, UNI PLACE',
    banUrl: '',
    gradient: 'linear-gradient(135deg, #c9a96e 0%, #8b6914 40%, #3d2e0a 100%)',
    pattern: 'arch',
    sub: '편안하고 스마트한 주거 경험을 만나보세요',
  },
  {
    banId: 'default-2',
    banTitle: '프리미엄 룸서비스',
    banUrl: '/commerce/room-service',
    gradient: 'linear-gradient(135deg, #2c3e2d 0%, #4a6741 50%, #8fad7e 100%)',
    pattern: 'circle',
    sub: '일상의 편의를 우리가 책임집니다',
  },
  {
    banId: 'default-3',
    banTitle: '커뮤니티와 함께',
    banUrl: '/community',
    gradient: 'linear-gradient(135deg, #1e2d4a 0%, #2e4a7a 50%, #6b8fc4 100%)',
    pattern: 'line',
    sub: '입주민 전용 커뮤니티에서 소통하세요',
  },
];

function DefaultBannerBg({ pattern, gradient }) {
  return (
    <div className={styles.defaultBg} style={{ background: gradient }}>
      {pattern === 'arch' && (
        <svg
          className={styles.patternSvg}
          viewBox="0 0 800 520"
          preserveAspectRatio="xMidYMid slice"
        >
          <ellipse
            cx="700"
            cy="260"
            rx="320"
            ry="420"
            fill="rgba(255,255,255,0.04)"
          />
          <ellipse
            cx="700"
            cy="260"
            rx="220"
            ry="300"
            fill="rgba(255,255,255,0.05)"
          />
          <ellipse
            cx="700"
            cy="260"
            rx="120"
            ry="180"
            fill="rgba(255,255,255,0.06)"
          />
          <circle cx="120" cy="460" r="180" fill="rgba(255,255,255,0.03)" />
        </svg>
      )}
      {pattern === 'circle' && (
        <svg
          className={styles.patternSvg}
          viewBox="0 0 800 520"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="650" cy="100" r="250" fill="rgba(255,255,255,0.05)" />
          <circle cx="650" cy="100" r="160" fill="rgba(255,255,255,0.06)" />
          <circle cx="150" cy="420" r="200" fill="rgba(255,255,255,0.03)" />
          <circle cx="400" cy="560" r="300" fill="rgba(255,255,255,0.04)" />
        </svg>
      )}
      {pattern === 'line' && (
        <svg
          className={styles.patternSvg}
          viewBox="0 0 800 520"
          preserveAspectRatio="xMidYMid slice"
        >
          {[...Array(8)].map((_, i) => (
            <line
              key={i}
              x1={600 + i * 40}
              y1="0"
              x2={400 + i * 40}
              y2="520"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="60"
            />
          ))}
          <circle cx="680" cy="260" r="180" fill="rgba(255,255,255,0.04)" />
        </svg>
      )}
    </div>
  );
}

function getBannerImageUrl(banner) {
  if (!banner) return null;
  if (banner.imageUrl) {
    return toApiImageUrl(banner.imageUrl);
  }
  const files = banner.files;
  if (Array.isArray(files) && files.length > 0) {
    const f = files[0];
    if (f?.fileId) return `${API_PREFIX}/files/${f.fileId}/view`;
    if (f?.viewUrl) return toApiImageUrl(f.viewUrl);
  }
  return null;
}

export default function BannerSlider({ intervalMs = 5000 }) {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);
  const fadingRef = useRef(false);

  useEffect(() => {
    fetch(`${API_PREFIX}/banners/active`)
      .then((r) => r.json())
      .then((res) => {
        const list = res?.data ?? [];
        setBanners(list.length > 0 ? list : DEFAULT_BANNERS);
        setLoaded(true);
      })
      .catch(() => {
        setBanners(DEFAULT_BANNERS);
        setLoaded(true);
      });
  }, []);

  const goTo = useCallback(
    (next) => {
      if (fadingRef.current || banners.length <= 1) return;
      fadingRef.current = true;
      setFading(true);
      setTimeout(() => {
        setCurrent(next);
        setFading(false);
        fadingRef.current = false;
      }, 500);
    },
    [banners.length]
  );

  const next = useCallback(() => {
    goTo((current + 1) % banners.length);
  }, [current, banners.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length);
  }, [current, banners.length, goTo]);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(next, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [banners.length, next, intervalMs]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, intervalMs);
  }, [next, intervalMs]);

  if (!loaded) return <div className={styles.skeleton} />;

  const banner = banners[current];
  const imgUrl = getBannerImageUrl(banner);
  const isDefault = !!banner?.gradient;
  const hasLink = banner?.banUrl && banner.banUrl.trim() !== '';
  const isExternal =
    hasLink &&
    (/^https?:\/\//.test(banner.banUrl.trim()) ||
      /^www\./.test(banner.banUrl.trim()) ||
      banner.banUrl.includes('.'));
  const fullUrl =
    isExternal && !/^https?:\/\//.test(banner.banUrl.trim())
      ? `https://${banner.banUrl.trim()}`
      : banner.banUrl;
  const bannerTarget = isExternal ? '_blank' : '_self';

  const handleNav = (fn) => {
    fn();
    resetTimer();
  };

  const handleBannerClick = () => {
    if (!hasLink) return;
    if (isExternal) {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = fullUrl;
    }
  };

  return (
    <section
      className={`${styles.slider} ${hasLink ? styles.sliderClickable : ''}`}
      onClick={handleBannerClick}
    >
      <div className={`${styles.bg} ${fading ? styles.bgFading : ''}`}>
        {isDefault ? (
          <DefaultBannerBg
            pattern={banner.pattern}
            gradient={banner.gradient}
          />
        ) : imgUrl ? (
          <img
            src={imgUrl}
            alt={banner?.banTitle ?? '배너'}
            className={styles.bgImg}
          />
        ) : (
          <DefaultBannerBg
            pattern="arch"
            gradient={DEFAULT_BANNERS[0].gradient}
          />
        )}
        <div className={styles.bgOverlay} />
      </div>

      <div
        className={`${styles.content} ${fading ? styles.contentFading : ''}`}
      >
        {isDefault && banner.sub && <p className={styles.sub}>{banner.sub}</p>}
        {banner?.banTitle && (
          <h2 className={styles.title}>{banner.banTitle}</h2>
        )}
        {hasLink && (
          <a
            href={fullUrl}
            className={styles.cta}
            target={bannerTarget}
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            자세히 보기 <span className={styles.ctaArrow}>→</span>
          </a>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            className={`${styles.navBtn} ${styles.navPrev}`}
            onClick={(e) => {
              e.stopPropagation();
              handleNav(prev);
            }}
            aria-label="이전"
          >
            ‹
          </button>
          <button
            className={`${styles.navBtn} ${styles.navNext}`}
            onClick={(e) => {
              e.stopPropagation();
              handleNav(next);
            }}
            aria-label="다음"
          >
            ›
          </button>

          <div className={styles.dots}>
            {banners.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNav(() => goTo(i));
                }}
                aria-label={`배너 ${i + 1}`}
              />
            ))}
          </div>

          <div className={styles.counter}>
            <span className={styles.counterCurrent}>
              {String(current + 1).padStart(2, '0')}
            </span>
            <span className={styles.counterSep}> / </span>
            <span className={styles.counterTotal}>
              {String(banners.length).padStart(2, '0')}
            </span>
          </div>

          <div className={styles.progressBar}>
            <div
              key={current}
              className={styles.progressFill}
              style={{ animationDuration: `${intervalMs}ms` }}
            />
          </div>
        </>
      )}
    </section>
  );
}
