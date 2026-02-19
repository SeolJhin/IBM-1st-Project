import React, { useState } from "react";
import styles from "./Home.module.css";
import Header from "../../app/layouts/components/Header";

export default function Home() {
  const slides = ["메인배너 이미지 1", "메인배너 이미지 2", "메인배너 이미지 3"];
  const [active, setActive] = useState(0);

  return (
    <div className={styles.page}>
      <Header />

      <section className={styles.hero}>
        <div className={styles.heroRow}>
          <div className={`${styles.heroCard} ${styles.heroCardActive}`}>
            <div className={styles.heroImg}>{slides[active]}</div>
          </div>
          <div className={styles.heroCard}><div className={styles.heroImg}>메인배너 이미지</div></div>
          <div className={styles.heroCard}><div className={styles.heroImg}>메인배너 이미지</div></div>
        </div>

        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
              onClick={() => setActive(i)}
              aria-label={`slide-${i + 1}`}
            />
          ))}
        </div>
      </section>

      <section className={styles.category}>
        <div className={styles.categoryTitle}>게시판페이지</div>
        <div className={styles.categoryBtns}>
          <button className={styles.pill}>Live</button>
          <button className={styles.pill}>Stay</button>
          <button className={styles.pill}>Tour</button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sliderWrap}>
          <button className={styles.arrow} aria-label="prev">‹</button>

          <div className={styles.grid3}>
            {["장소(숙소)", "장소(숙소)", "장소(숙소)"].map((t, idx) => (
              <div key={idx} className={styles.placeCard}>
                <div className={styles.placeImg}>{t}</div>
              </div>
            ))}
          </div>

          <button className={styles.arrow} aria-label="next">›</button>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.communityCard}>
            <div className={styles.communityTitle}>Community</div>
            <div className={styles.line} />
            <div className={styles.lineShort} />
            <button className={styles.communityBtn}>커뮤니티 보러가기</button>
          </div>

          <div className={styles.bigBanner}>
            <div className={styles.muted}>커뮤니티/홍보 배너 이미지</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.faqWrap}>
          <div>
            <div className={styles.blockTitle}>공지사항 / 이벤트</div>
            <div className={styles.noticeBox}>
              {["공지사항 제목", "이벤트 안내", "입주 관련 공지", "서비스 업데이트"].map((t, i) => (
                <div key={i} className={styles.noticeItem}>{t}</div>
              ))}
              <button className={styles.moreBtn}>공지사항 보러가기 →</button>
            </div>
          </div>

          <div className={styles.faqGrid}>
            {["FAQ 1", "FAQ 2", "FAQ 3", "FAQ 4"].map((t, i) => (
              <div key={i} className={styles.faqCard}>
                <div className={styles.faqTitle}>{t}</div>
                <div className={styles.faqText}>Q. 질문</div>
                <div className={styles.faqText}>A. 답변</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 80 }} />
    </div>
  );
}
