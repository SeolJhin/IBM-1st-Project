import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { GUIDE_LIST } from './Guide';
import styles from './about.shared.module.css';

function BodyBlock({ block, index }) {
  const delay = `${0.1 + index * 0.07}s`;
  if (block.type === 'lead')
    return <p className={styles.lead} style={{ animationDelay: delay }}>{block.text}</p>;
  if (block.type === 'quote')
    return <blockquote className={styles.blockquote} style={{ animationDelay: delay }}><span className={styles.quoteText}>{block.text}</span></blockquote>;
  return <p className={styles.paragraph} style={{ animationDelay: delay }}>{block.text}</p>;
}

export default function GuideDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const guide = GUIDE_LIST.find((g) => g.slug === slug);
  const related = GUIDE_LIST.filter((g) => g.slug !== slug).slice(0, 3);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!guide) return (
    <div className={styles.detailPage}><Header />
      <div className={styles.notFound}>
        <p>가이드를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/about/guide')} type="button">← 가이드로</button>
      </div>
    <Footer /></div>
  );

  return (
    <div className={styles.detailPage}>
      <Header />
      <div className={styles.detailHero}>
        <div className={styles.detailHeroInner}>
          <button className={styles.backBtn} onClick={() => navigate('/about/guide')} type="button">← Guide</button>
          <div className={styles.detailMeta}>
            <span className={styles.detailTag}>{guide.tag}</span>
            <span className={styles.detailDate}>{guide.date}</span>
          </div>
          <h1 className={styles.detailTitle}>{guide.title}</h1>
          <p className={styles.detailSubtitle}>{guide.excerpt}</p>
        </div>
        <img src={guide.image} alt={guide.title} className={styles.detailHeroImg} />
      </div>
      <main className={styles.articleWrap}>
        <article className={styles.article}>
          <div className={styles.bodyBlocks}>
            {guide.body.map((block, i) => <BodyBlock key={i} block={block} index={i} />)}
          </div>
          <div className={styles.tagRow}>
            <span className={styles.tagChip}>{guide.category}</span>
            <span className={styles.tagChip}>{guide.tag}</span>
          </div>
        </article>
        {related.length > 0 && (
          <section className={styles.relatedSection}>
            <div className={styles.relatedHeader}>
              <span className={styles.relatedLabel}>Other Guides</span>
              <button className={styles.relatedAll} onClick={() => navigate('/about/guide')} type="button">전체 보기 →</button>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((g) => (
                <article key={g.slug} className={styles.relatedCard}
                  onClick={() => navigate(`/about/guide/${g.slug}`)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/about/guide/${g.slug}`)}>
                  <div className={styles.relatedTop}>
                    <img src={g.image} alt={g.title} className={styles.relatedImg} />
                  </div>
                  <div className={styles.relatedBody}>
                    <span className={styles.relatedCategory}>{g.category}</span>
                    <h4 className={styles.relatedTitle}>{g.title}</h4>
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
