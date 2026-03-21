import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { NEWS_LIST } from './News';
import styles from './about.shared.module.css';

function BodyBlock({ block, index }) {
  const delay = `${0.1 + index * 0.07}s`;
  if (block.type === 'lead')
    return <p className={styles.lead} style={{ animationDelay: delay }}>{block.text}</p>;
  if (block.type === 'quote')
    return <blockquote className={styles.blockquote} style={{ animationDelay: delay }}><span className={styles.quoteText}>{block.text}</span></blockquote>;
  return <p className={styles.paragraph} style={{ animationDelay: delay }}>{block.text}</p>;
}

export default function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const news = NEWS_LIST.find((n) => n.slug === slug);
  const related = NEWS_LIST.filter((n) => n.slug !== slug).slice(0, 3);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!news) return (
    <div className={styles.detailPage}><Header />
      <div className={styles.notFound}>
        <p>뉴스를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/about/news')} type="button">← 뉴스로</button>
      </div>
    <Footer /></div>
  );

  return (
    <div className={styles.detailPage}>
      <Header />
      <div className={styles.detailHero}>
        <div className={styles.detailHeroInner}>
          <button className={styles.backBtn} onClick={() => navigate('/about/news')} type="button">← Newsroom</button>
          <div className={styles.detailMeta}>
            <span className={styles.detailTag}>{news.tag}</span>
            <span className={styles.detailDate}>{news.date}</span>
          </div>
          <h1 className={styles.detailTitle}>{news.title}</h1>
          <p className={styles.detailSubtitle}>{news.excerpt}</p>
        </div>
        <img src={news.image} alt={news.title} className={styles.detailHeroImg} />
      </div>
      <main className={styles.articleWrap}>
        <article className={styles.article}>
          <div className={styles.bodyBlocks}>
            {news.body.map((block, i) => <BodyBlock key={i} block={block} index={i} />)}
          </div>
          <div className={styles.tagRow}>
            <span className={styles.tagChip}>{news.category}</span>
            <span className={styles.tagChip}>{news.tag}</span>
          </div>
        </article>
        {related.length > 0 && (
          <section className={styles.relatedSection}>
            <div className={styles.relatedHeader}>
              <span className={styles.relatedLabel}>More News</span>
              <button className={styles.relatedAll} onClick={() => navigate('/about/news')} type="button">전체 보기 →</button>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((n) => (
                <article key={n.slug} className={styles.relatedCard}
                  onClick={() => navigate(`/about/news/${n.slug}`)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/about/news/${n.slug}`)}>
                  <div className={styles.relatedTop}>
                    <img src={n.image} alt={n.title} className={styles.relatedImg} />
                  </div>
                  <div className={styles.relatedBody}>
                    <span className={styles.relatedCategory}>{n.category}</span>
                    <h4 className={styles.relatedTitle}>{n.title}</h4>
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
