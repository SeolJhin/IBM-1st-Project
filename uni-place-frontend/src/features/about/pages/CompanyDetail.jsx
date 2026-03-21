import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { COMPANY_CARDS } from './Company';
import styles from './about.shared.module.css';

function BodyBlock({ block, index }) {
  const delay = `${0.1 + index * 0.07}s`;
  if (block.type === 'lead')
    return <p className={styles.lead} style={{ animationDelay: delay }}>{block.text}</p>;
  if (block.type === 'quote')
    return <blockquote className={styles.blockquote} style={{ animationDelay: delay }}><span className={styles.quoteText}>{block.text}</span></blockquote>;
  return <p className={styles.paragraph} style={{ animationDelay: delay }}>{block.text}</p>;
}

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const card = COMPANY_CARDS.find((c) => c.id === id);
  const related = COMPANY_CARDS.filter((c) => c.id !== id);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!card) return (
    <div className={styles.detailPage}><Header />
      <div className={styles.notFound}>
        <p>콘텐츠를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/about/company')} type="button">← 회사소개로</button>
      </div>
    <Footer /></div>
  );

  return (
    <div className={styles.detailPage}>
      <Header />

      {/* ── 흰 배경 히어로 (B&W) ── */}
      <div className={styles.detailHero}>
        <div className={styles.detailHeroInner}>
          <button className={styles.backBtn} onClick={() => navigate('/about/company')} type="button">← Company</button>
          <div className={styles.detailMeta}>
            <span className={styles.detailTag}>{card.tag}</span>
            <span className={styles.detailDate}>{card.date}</span>
          </div>
          <h1 className={styles.detailTitle}>{card.title}</h1>
          <p className={styles.detailSubtitle}>{card.excerpt}</p>
        </div>
        {/* 히어로 이미지 — 흰 배경 아래 구분선 역할 */}
        <img src={card.image} alt={card.title} className={styles.detailHeroImg} />
      </div>

      <main className={styles.articleWrap}>
        <article className={styles.article}>
          <div className={styles.bodyBlocks}>
            {card.body.map((block, i) => <BodyBlock key={i} block={block} index={i} />)}
          </div>
          <div className={styles.tagRow}>
            <span className={styles.tagChip}>{card.category}</span>
            <span className={styles.tagChip}>{card.tag}</span>
          </div>
        </article>

        {related.length > 0 && (
          <section className={styles.relatedSection}>
            <div className={styles.relatedHeader}>
              <span className={styles.relatedLabel}>More</span>
              <button className={styles.relatedAll} onClick={() => navigate('/about/company')} type="button">전체 보기 →</button>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((c) => (
                <article key={c.id} className={styles.relatedCard}
                  onClick={() => navigate(`/about/company/${c.id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/about/company/${c.id}`)}>
                  <div className={styles.relatedTop}>
                    <img src={c.image} alt={c.title} className={styles.relatedImg} />
                  </div>
                  <div className={styles.relatedBody}>
                    <span className={styles.relatedCategory}>{c.category}</span>
                    <h4 className={styles.relatedTitle}>{c.title}</h4>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
