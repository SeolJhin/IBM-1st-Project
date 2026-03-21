import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../app/layouts/components/Header';
import Footer from '../../app/layouts/components/Footer';
import { ABOUT_STORIES } from './About';
import styles from './AboutDetail.module.css';

/* ══════════════════════════════════════════════════════════════
   본문 블록 렌더러
   ══════════════════════════════════════════════════════════════ */
function BodyBlock({ block, index }) {
  const delay = `${0.1 + index * 0.07}s`;
  switch (block.type) {
    case 'lead':
      return (
        <p className={styles.lead} style={{ animationDelay: delay }}>
          {block.text}
        </p>
      );
    case 'quote':
      return (
        <blockquote className={styles.blockquote} style={{ animationDelay: delay }}>
          <span className={styles.quoteBar} aria-hidden="true" />
          <span className={styles.quoteText}>{block.text}</span>
        </blockquote>
      );
    case 'paragraph':
    default:
      return (
        <p className={styles.paragraph} style={{ animationDelay: delay }}>
          {block.text}
        </p>
      );
  }
}

/* ══════════════════════════════════════════════════════════════
   관련 카드 (하단 추천)
   ══════════════════════════════════════════════════════════════ */
function RelatedCard({ story }) {
  const navigate = useNavigate();
  return (
    <article
      className={styles.relatedCard}
      onClick={() => navigate(`/about/${story.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/about/${story.slug}`)}
    >
      <div className={styles.relatedImage} style={{ background: story.gradient }} />
      <div className={styles.relatedBody}>
        <span className={styles.relatedCategory}>{story.category}</span>
        <h4 className={styles.relatedTitle}>{story.title}</h4>
        <span className={styles.relatedDate}>{story.date}</span>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════════════════════════ */
export default function AboutDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const story = ABOUT_STORIES.find((s) => s.slug === slug);
  const related = ABOUT_STORIES.filter(
    (s) => s.slug !== slug && s.category === story?.category
  ).slice(0, 3);
  const otherRelated = related.length < 3
    ? [...related, ...ABOUT_STORIES.filter(
        (s) => s.slug !== slug && !related.includes(s)
      ).slice(0, 3 - related.length)]
    : related;

  // 스크롤 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // 404 처리
  if (!story) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.notFound}>
          <p>콘텐츠를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/about')} className={styles.backBtn} type="button">
            ← 목록으로
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      {/* ── 히어로 영역 ── */}
      <div className={styles.hero} style={{ background: story.gradient }}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroInner}>
          {/* 뒤로가기 */}
          <button
            className={styles.backLink}
            onClick={() => navigate('/about')}
            type="button"
          >
            ← JOURNAL
          </button>

          <div className={styles.heroMeta}>
            <span className={styles.heroTag}>{story.tag}</span>
            <span className={styles.heroDate}>{story.date}</span>
          </div>

          <h1 className={styles.heroTitle}>{story.title}</h1>
          <p className={styles.heroSubtitle}>{story.subtitle}</p>
        </div>
      </div>

      {/* ── 아티클 본문 ── */}
      <main className={styles.articleWrap}>
        <article className={styles.article}>
          {/* 리드 발췌문 바 */}
          <div className={styles.excerptBar}>
            <span className={styles.excerptLine} aria-hidden="true" />
            <p className={styles.excerpt}>{story.excerpt}</p>
          </div>

          {/* 본문 블록 */}
          <div className={styles.bodyBlocks}>
            {story.body.map((block, i) => (
              <BodyBlock key={i} block={block} index={i} />
            ))}
          </div>

          {/* 카테고리 태그 */}
          <div className={styles.tagRow}>
            <span className={styles.tagChip}>{story.category}</span>
            <span className={styles.tagChip}>{story.tag}</span>
          </div>
        </article>

        {/* ── 관련 콘텐츠 ── */}
        {otherRelated.length > 0 && (
          <section className={styles.relatedSection}>
            <div className={styles.relatedHeader}>
              <span className={styles.relatedLabel}>MORE STORIES</span>
              <button
                className={styles.relatedAll}
                onClick={() => navigate('/about')}
                type="button"
              >
                전체 보기 →
              </button>
            </div>
            <div className={styles.relatedGrid}>
              {otherRelated.map((s) => (
                <RelatedCard key={s.slug} story={s} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
