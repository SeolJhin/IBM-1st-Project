import { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Maximize2,
  X,
} from "lucide-react";

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .es-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
  }
  .es-root *, .es-root *::before, .es-root *::after {
    box-sizing: border-box;
    font-family: inherit;
  }

  .es-container {
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 25px 25px 64px;
  }

  .es-gallery-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }

  @media (max-width: 1100px) {
    .es-gallery-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 720px) {
    .es-gallery-grid { grid-template-columns: repeat(2, 1fr); }
    .es-container { padding: 32px 16px 48px; }
  }

  /* Card */
  .es-card {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .es-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
    border-color: #d1d5db;
  }

  /* Image */
  .es-card-img-wrap {
    width: 100%;
    aspect-ratio: 4/3;
    background: #f1f3f5;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }
  .es-card-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.35s ease, opacity 0.2s ease;
  }
  .es-card-img-wrap:hover img {
    transform: scale(1.03);
  }
  .es-card-img-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f3f5;
    color: #ced4da;
  }

  /* Count badge */
  .es-img-count {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,0.38);
    color: rgba(255,255,255,0.92);
    font-size: 10.5px;
    font-weight: 500;
    padding: 3px 11px;
    border-radius: 100px;
    letter-spacing: 0.04em;
    pointer-events: none;
    z-index: 2;
    font-variant-numeric: tabular-nums;
  }

  /* 확대하기 button overlay */
  .es-enlarge-btn {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    opacity: 0;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    background: rgba(15, 23, 53, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: rgba(255,255,255,0.93);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 5px;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.22s ease, transform 0.22s ease, background 0.15s ease;
    pointer-events: none;
  }
  .es-card-img-wrap:hover .es-enlarge-btn {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }
  .es-enlarge-btn:hover {
    background: rgba(15, 23, 53, 0.88);
  }

  /* Card body */
  .es-card-body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .es-card-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 100px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.03em;
    background: #eff4ff;
    color: #1a4fd6;
    margin-bottom: 8px;
    align-self: flex-start;
  }
  .es-card-title {
    font-size: 13.5px;
    font-weight: 600;
    color: #111827;
    line-height: 1.45;
    margin: 0 0 5px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .es-card-desc {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.55;
    margin: 0 0 12px;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .es-card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11.5px;
    color: #9ca3af;
    padding-top: 10px;
    border-top: 1px solid #f3f4f6;
    margin-top: auto;
  }

  /* Pagination */
  .es-page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    background: #fff;
    color: #6b7280;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
  }
  .es-page-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .es-page-btn.active {
    background: #1a4fd6;
    border-color: #1a4fd6;
    color: #fff;
    font-weight: 600;
  }

  /* ── FULLSCREEN MODAL ── */
  .es-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(15, 18, 25, 0.78);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    animation: es-fade-in 0.22s ease forwards;
    padding: 28px 24px;
  }
  @keyframes es-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .es-modal-overlay.es-closing {
    animation: es-fade-out 0.18s ease forwards;
  }
  @keyframes es-fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* modal wrapper */
  .es-modal-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(94vw, 680px);
    max-height: 72vh;
    cursor: default;
    animation: es-scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes es-scale-in {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* close button */
  .es-modal-close {
    position: fixed;
    top: 20px;
    right: 24px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.75);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    z-index: 10;
  }
  .es-modal-close:hover {
    background: rgba(255,255,255,0.22);
    color: #fff;
    border-color: rgba(255,255,255,0.32);
  }

  /* image area */
  .es-modal-img-wrap {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .es-modal-img-inner {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    max-height: 72vh;
    border-radius: 8px;
    overflow: hidden;
    line-height: 0;
    background: #eee;
    box-shadow: 0 24px 80px rgba(0,0,0,0.55);
  }
  .es-modal-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    animation: es-img-appear 0.2s ease forwards;
  }
  @keyframes es-img-appear {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* nav arrows */
  .es-modal-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.80);
    opacity: 0;
    transition: opacity 0.18s ease, background 0.15s ease, color 0.15s ease;
    z-index: 2;
  }
  .es-modal-img-inner:hover .es-modal-nav { opacity: 1; }
  .es-modal-nav:hover {
    background: rgba(255,255,255,0.20);
    color: #fff;
    border-color: rgba(255,255,255,0.30);
  }
  .es-modal-nav.prev { left: 18px; }
  .es-modal-nav.next { right: 18px; }

  /* footer: title + dots */
  .es-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 14px;
    padding: 0 2px;
  }
  .es-modal-meta-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .es-modal-title {
    font-size: 13.5px;
    font-weight: 600;
    color: rgba(255,255,255,0.90);
    letter-spacing: -0.01em;
  }
  .es-modal-sub {
    font-size: 11.5px;
    color: rgba(255,255,255,0.38);
    letter-spacing: 0.02em;
  }
  .es-modal-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  }
  .es-modal-counter {
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.08em;
    font-variant-numeric: tabular-nums;
  }
  .es-modal-dots {
    display: flex;
    gap: 5px;
    align-items: center;
  }
  .es-modal-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: background 0.15s, width 0.15s;
  }
  .es-modal-dot.active {
    background: rgba(255,255,255,0.80);
    width: 16px;
    border-radius: 3px;
  }
`;

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const SERVICE_CATEGORIES = [
  { label: "참가자 갤러리", path: "/gallery/eventgallery" },
  { label: "현장 스케치", path: "/gallery/eventsketch" },
];

const GALLERY_CARDS = [
  {
    id: 1,
    category: "현장 스케치",
    images: [
      "https://picsum.photos/seed/sketch1a/480/360",
      "https://picsum.photos/seed/sketch1b/480/360",
      "https://picsum.photos/seed/sketch1c/480/360",
    ],
    title: "2026 봄 반려동물 페스티벌 메인 행사장",
    description:
      "200여 마리의 강아지와 고양이가 함께한 봄 페스티벌 현장 스케치입니다.",
    author: "운영팀",
    date: "2026.02.12",
  },
  {
    id: 2,
    category: "현장 스케치",
    images: [
      "https://picsum.photos/seed/sketch2a/480/360",
      "https://picsum.photos/seed/sketch2b/480/360",
    ],
    title: "체험존 & 포토 부스 현장",
    description:
      "다양한 체험 프로그램과 포토 부스에서 즐거운 시간을 보낸 참가자들.",
    author: "운영팀",
    date: "2026.02.12",
  },
  {
    id: 3,
    category: "현장 스케치",
    images: ["https://picsum.photos/seed/sketch3a/480/360"],
    title: "인기 반려견 선발 시상식",
    description:
      "치열한 경쟁 끝에 최고 인기상을 수상한 반려견들의 빛나는 순간.",
    author: "운영팀",
    date: "2026.02.11",
  },
  {
    id: 4,
    category: "현장 스케치",
    images: [
      "https://picsum.photos/seed/sketch4a/480/360",
      "https://picsum.photos/seed/sketch4b/480/360",
      "https://picsum.photos/seed/sketch4c/480/360",
      "https://picsum.photos/seed/sketch4d/480/360",
    ],
    title: "전문 강연 & 세션 현장",
    description:
      "수의사 및 반려동물 전문가들의 유익한 강연이 펼쳐진 세미나 홀.",
    author: "운영팀",
    date: "2026.02.10",
  },
];

/* ─────────────────────────────────────────────
   FULLSCREEN MODAL VIEWER
───────────────────────────────────────────── */
const FullscreenViewer = ({ card, startIndex, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [closing, setClosing] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  const images = card.images;
  const total = images.length;

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 170);
  }, [onClose]);

  const prev = useCallback(
    (e) => {
      e?.stopPropagation();
      setIndex((i) => (i - 1 + total) % total);
      setImgKey((k) => k + 1);
    },
    [total],
  );

  const next = useCallback(
    (e) => {
      e?.stopPropagation();
      setIndex((i) => (i + 1) % total);
      setImgKey((k) => k + 1);
    },
    [total],
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close, prev, next]);

  return (
    <div
      className={`es-modal-overlay${closing ? " es-closing" : ""}`}
      onClick={close}
    >
      <button
        className="es-modal-close"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="닫기"
      >
        <X size={15} strokeWidth={2} />
      </button>

      <div className="es-modal-inner" onClick={(e) => e.stopPropagation()}>
        {/* Image */}
        <div className="es-modal-img-wrap">
          <div className="es-modal-img-inner">
            {total > 1 && (
              <button
                className="es-modal-nav prev"
                onClick={prev}
                aria-label="이전 이미지"
              >
                <ChevronLeft size={18} strokeWidth={1.8} />
              </button>
            )}
            <img
              key={imgKey}
              className="es-modal-img"
              src={images[index]}
              alt={`이미지 ${index + 1}`}
            />
            {total > 1 && (
              <button
                className="es-modal-nav next"
                onClick={next}
                aria-label="다음 이미지"
              >
                <ChevronRight size={18} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="es-modal-footer" onClick={(e) => e.stopPropagation()}>
          <div className="es-modal-meta-info">
            <span className="es-modal-title">{card.title}</span>
            <span className="es-modal-sub">
              {card.author} · {card.date}
            </span>
          </div>
          {total > 1 && (
            <div className="es-modal-right">
              <span className="es-modal-counter">
                {index + 1} / {total}
              </span>
              <div className="es-modal-dots">
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`es-modal-dot${i === index ? " active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndex(i);
                      setImgKey((k) => k + 1);
                    }}
                    aria-label={`이미지 ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   GALLERY CARD
───────────────────────────────────────────── */
const GalleryCard = ({ card, onEnlarge }) => {
  const [imgError, setImgError] = useState(false);
  const hasMultiple = card.images.length > 1;

  return (
    <div className="es-card">
      <div
        className="es-card-img-wrap"
        onClick={() => onEnlarge(card)}
        style={{ cursor: "pointer" }}
      >
        {imgError ? (
          <div className="es-card-img-fallback">
            <ImageOff size={28} strokeWidth={1.5} />
          </div>
        ) : (
          <img
            src={card.images[0]}
            alt={card.title}
            onError={() => setImgError(true)}
          />
        )}
        {hasMultiple && (
          <span className="es-img-count">1 / {card.images.length}</span>
        )}
        <button
          className="es-enlarge-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEnlarge(card);
          }}
          aria-label="이미지 확대"
        >
          <Maximize2 size={12} strokeWidth={2} />
          확대하기
        </button>
      </div>

      <div className="es-card-body">
        <span className="es-card-badge">{card.category}</span>
        <h3 className="es-card-title">{card.title}</h3>
        <p className="es-card-desc">{card.description}</p>
        <div className="es-card-meta">
          <span>{card.author}</span>
          <span>{card.date}</span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function EventSketch() {
  const [currentPath, setCurrentPath] = useState("/gallery/eventsketch");
  const [viewer, setViewer] = useState(null);

  const handleEnlarge = (card) => {
    setViewer({ card, startIndex: 0 });
  };

  return (
    <div className="es-root">
      <style>{styles}</style>

      <PageHeader
        title="현장 스케치"
        subtitle="행사 현장의 생생한 모습을 사진으로 만나보세요"
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main className="es-container">
        <section style={{ marginBottom: "48px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          ></div>

          <div className="es-gallery-grid">
            {GALLERY_CARDS.map((card) => (
              <GalleryCard
                key={card.id}
                card={card}
                onEnlarge={handleEnlarge}
              />
            ))}
          </div>
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
            marginTop: "40px",
          }}
        >
          <button className="es-page-btn">‹</button>
          <button className="es-page-btn active">1</button>
          <button className="es-page-btn">›</button>
        </div>
      </main>

      {viewer && (
        <FullscreenViewer
          card={viewer.card}
          startIndex={viewer.startIndex}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
