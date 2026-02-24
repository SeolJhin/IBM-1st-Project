import { useState, useEffect, useRef } from "react";
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Users,
  ChevronRight,
  Phone,
  Mail,
  ExternalLink,
  Zap,
  Share2,
  Bookmark,
  CheckCircle,
  AlertCircle,
  Navigation,
  Train,
  Car,
  Building2,
  Mic2,
  Award,
  Download,
  CreditCard,
} from "lucide-react";

/* ─── mock detail data (would come from API) ─── */
const DETAIL_DATA = {
  1: {
    description:
      "국내 최대 규모의 스타트업 혁신 컨퍼런스로, 성공적인 창업 전략과 최신 기술 트렌드를 공유합니다. 국내외 유명 투자자, 유니콘 창업가, 기술 리더들이 한자리에 모여 미래 비즈니스를 논합니다.",
    price: "일반 50,000원 · 학생 무료",
    organizer: "한국스타트업진흥원",
    contact: { phone: "02-1234-5678", email: "summit@startup.kr" },
    schedule: [
      { time: "09:00", title: "등록 및 네트워킹 커피", type: "break" },
      {
        time: "09:30",
        title: "개회사",
        speaker: "김태영",
        role: "한국스타트업진흥원장",
        type: "opening",
      },
      {
        time: "10:00",
        title: "키노트 — AI가 바꾸는 스타트업 생태계",
        speaker: "박소연",
        role: "딥마인드 코리아 총괄",
        type: "keynote",
      },
      {
        time: "11:00",
        title: "패널 — VC가 보는 2026 투자 트렌드",
        speaker: "4인 패널",
        role: "주요 VC 대표",
        type: "panel",
      },
      { time: "12:00", title: "점심 및 부스 관람", type: "break" },
      {
        time: "13:30",
        title: "세션 A — 제로투원: MVP에서 PMF까지",
        speaker: "이준혁",
        role: "토스 공동창업자",
        type: "session",
      },
      {
        time: "14:30",
        title: "세션 B — 글로벌 진출 전략 마스터클래스",
        speaker: "Sarah Kim",
        role: "Y Combinator 파트너",
        type: "session",
      },
      {
        time: "15:30",
        title: "세션 C — 딥테크 스타트업의 성장 공식",
        speaker: "정민수",
        role: "리벨리온 CEO",
        type: "session",
      },
      { time: "16:30", title: "네트워킹 브레이크", type: "break" },
      {
        time: "17:00",
        title: "클로징 키노트 — 한국 스타트업의 미래",
        speaker: "강한나",
        role: "네이버 CTO",
        type: "keynote",
      },
      { time: "18:00", title: "네트워킹 디너 & 폐회", type: "break" },
    ],
    speakers: [
      {
        name: "박소연",
        role: "딥마인드 코리아 총괄",
        topic: "AI가 바꾸는 스타트업 생태계",
        avatar: "PS",
        color: "#6366f1",
      },
      {
        name: "이준혁",
        role: "토스 공동창업자",
        topic: "제로투원: MVP에서 PMF까지",
        avatar: "LJ",
        color: "#0891b2",
      },
      {
        name: "Sarah Kim",
        role: "Y Combinator 파트너",
        topic: "글로벌 진출 전략 마스터클래스",
        avatar: "SK",
        color: "#e11d48",
      },
      {
        name: "정민수",
        role: "리벨리온 CEO",
        topic: "딥테크 스타트업의 성장 공식",
        avatar: "JM",
        color: "#ea580c",
      },
      {
        name: "강한나",
        role: "네이버 CTO",
        topic: "한국 스타트업의 미래",
        avatar: "KH",
        color: "#16a34a",
      },
    ],
    transport: {
      subway: "삼성역 5·6번 출구 도보 5분 / 봉은사역 7번 출구 도보 7분",
      bus: "코엑스 정류장 하차 (3412, 4318, 9414)",
      car: "코엑스 지하주차장 이용 (주차 4시간 무료 제공)",
    },
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3165.3!2d127.058!3d37.5116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca4eff!2sCOEX!5e0!3m2!1sko!2skr",
    files: [
      { name: "행사 안내 브로셔.pdf", size: "2.4 MB" },
      { name: "연사 프로필 목록.pdf", size: "1.1 MB" },
    ],
  },
};

/* ─── Fallback: generate detail data for events without explicit data ─── */
function getDetailData(eventId) {
  if (DETAIL_DATA[eventId]) return DETAIL_DATA[eventId];
  return {
    description:
      "본 행사에 대한 상세 정보입니다. 다양한 세션과 네트워킹 기회가 준비되어 있으니 많은 참여 바랍니다.",
    price: "무료",
    organizer: "행사 주최측",
    contact: { phone: "02-000-0000", email: "info@event.kr" },
    schedule: [
      { time: "09:00", title: "등록", type: "break" },
      {
        time: "09:30",
        title: "개회사",
        speaker: "대표 연사",
        role: "주최 기관",
        type: "opening",
      },
      {
        time: "10:00",
        title: "메인 세션",
        speaker: "연사 미정",
        role: "",
        type: "keynote",
      },
      { time: "12:00", title: "점심 시간", type: "break" },
      {
        time: "13:30",
        title: "오후 세션",
        speaker: "연사 미정",
        role: "",
        type: "session",
      },
      { time: "17:00", title: "폐회", type: "break" },
    ],
    speakers: [],
    transport: {
      subway: "인근 지하철역 이용",
      bus: "인근 버스 정류장 이용",
      car: "건물 내 지하주차장 이용",
    },
    files: [],
  };
}

/* ─── styles ─── */
const modalStyles = `
  /* Overlay */
  .evm-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(6px);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 32px 16px;
    overflow-y: auto;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .evm-overlay.open { opacity: 1; }

  /* Modal body */
  .evm-modal {
    width: 100%; max-width: 780px;
    background: #fff; border-radius: 18px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.18);
    transform: translateY(24px) scale(0.97);
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    overflow: hidden;
    margin: auto 0;
  }
  .evm-overlay.open .evm-modal {
    transform: translateY(0) scale(1);
  }

  /* Hero */
  .evm-hero { position: relative; height: 220px; overflow: hidden; }
  .evm-hero img { width: 100%; height: 100%; object-fit: cover; }
  .evm-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%);
  }
  .evm-hero-content {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 24px 28px;
  }
  .evm-hero-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(239,68,68,0.9); color: #fff;
    padding: 3px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 700;
    margin-bottom: 8px; backdrop-filter: blur(4px);
  }
  .evm-hero-badge .ev-live-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #fff;
    animation: ev-pulse 1.4s ease-in-out infinite;
  }
  .evm-hero-category {
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85);
    margin-bottom: 4px;
  }
  .evm-hero-title {
    font-size: 24px; font-weight: 800; color: #fff;
    line-height: 1.3; text-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }

  /* Top bar controls */
  .evm-topbar {
    position: absolute; top: 14px; right: 14px;
    display: flex; gap: 8px; z-index: 2;
  }
  .evm-icon-btn {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
  }
  .evm-icon-btn:hover { background: rgba(255,255,255,0.3); }

  /* Content */
  .evm-content { padding: 24px 28px 32px; }

  /* Quick info bar */
  .evm-quick-info {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; margin-bottom: 28px;
  }
  .evm-qi-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px;
    background: #f8f9fc; border-radius: 10px;
  }
  .evm-qi-icon {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .evm-qi-label { font-size: 11px; color: #9ca3af; font-weight: 500; }
  .evm-qi-value { font-size: 13px; color: #111827; font-weight: 700; }

  /* Section */
  .evm-section { margin-bottom: 28px; }
  .evm-section-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 14px; padding-bottom: 10px;
    border-bottom: 2px solid #f1f3f5;
  }
  .evm-section-title {
    font-size: 15px; font-weight: 800; color: #111827;
  }
  .evm-section-icon {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* Description */
  .evm-desc {
    font-size: 14px; color: #374151; line-height: 1.7;
  }

  /* Schedule */
  .evm-schedule { display: flex; flex-direction: column; gap: 0; }
  .evm-sch-item {
    display: flex; align-items: stretch; gap: 16px;
    position: relative;
    padding: 10px 0;
  }
  .evm-sch-time-col {
    width: 54px; flex-shrink: 0; text-align: right;
    padding-top: 2px;
  }
  .evm-sch-time {
    font-size: 13px; font-weight: 700; color: #374151;
    font-variant-numeric: tabular-nums;
  }
  .evm-sch-line-col {
    width: 20px; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center;
    position: relative;
  }
  .evm-sch-dot {
    width: 10px; height: 10px; border-radius: 50%;
    border: 2px solid #d1d5db; background: #fff;
    margin-top: 5px; z-index: 1; flex-shrink: 0;
  }
  .evm-sch-dot.keynote { border-color: #1a4fd6; background: #1a4fd6; }
  .evm-sch-dot.session { border-color: #10b981; background: #10b981; }
  .evm-sch-dot.panel { border-color: #f59e0b; background: #f59e0b; }
  .evm-sch-dot.opening { border-color: #8b5cf6; background: #8b5cf6; }
  .evm-sch-dot.break { border-color: #d1d5db; background: #f3f4f6; }
  .evm-sch-rail {
    width: 2px; flex: 1; background: #e5e7eb; margin-top: 4px;
  }
  .evm-sch-item:last-child .evm-sch-rail { display: none; }
  .evm-sch-body { flex: 1; padding-bottom: 4px; }
  .evm-sch-title {
    font-size: 13.5px; font-weight: 600; color: #111827;
    margin-bottom: 2px;
  }
  .evm-sch-title.is-break { color: #9ca3af; font-weight: 500; font-style: italic; }
  .evm-sch-speaker { font-size: 12px; color: #6b7280; }

  /* Speakers */
  .evm-speakers { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .evm-speaker-card {
    display: flex; gap: 12px; padding: 14px 16px;
    background: #f8f9fc; border-radius: 12px;
    border: 1px solid #f1f3f5;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .evm-speaker-card:hover {
    border-color: #dde4f0; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .evm-speaker-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 14px; font-weight: 800; flex-shrink: 0;
    letter-spacing: -0.5px;
  }
  .evm-speaker-name { font-size: 13.5px; font-weight: 700; color: #111827; }
  .evm-speaker-role { font-size: 11.5px; color: #6b7280; margin-top: 1px; }
  .evm-speaker-topic { font-size: 11px; color: #1a4fd6; font-weight: 600; margin-top: 4px; }

  /* Participants bar */
  .evm-participants-bar {
    background: #f8f9fc; border-radius: 12px; padding: 18px 20px;
  }
  .evm-part-header {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 10px;
  }
  .evm-part-count {
    font-size: 28px; font-weight: 800; color: #111827;
  }
  .evm-part-count span { font-size: 14px; font-weight: 500; color: #9ca3af; }
  .evm-part-pct {
    font-size: 14px; font-weight: 700; color: #1a4fd6;
  }
  .evm-part-track {
    height: 8px; background: #e5e7eb; border-radius: 100px;
    overflow: hidden; margin-bottom: 10px;
  }
  .evm-part-fill {
    height: 100%; border-radius: 100px;
    background: linear-gradient(90deg, #1a4fd6, #6366f1);
    transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
  }
  .evm-part-note {
    font-size: 12px; color: #9ca3af;
  }
  .evm-part-note strong { color: #ef4444; font-weight: 700; }

  /* Location */
  .evm-map-placeholder {
    height: 180px; border-radius: 12px; overflow: hidden;
    background: #e5e7eb; margin-bottom: 14px;
    position: relative;
  }
  .evm-map-placeholder iframe {
    width: 100%; height: 100%; border: 0;
  }
  .evm-map-placeholder-inner {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 6px;
    color: #9ca3af; font-size: 13px;
    background: linear-gradient(135deg, #f0f4ff 0%, #f8f9fc 100%);
  }
  .evm-address {
    display: flex; align-items: center; gap: 8px;
    font-size: 13.5px; color: #374151; font-weight: 600;
    margin-bottom: 14px;
  }
  .evm-transport { display: flex; flex-direction: column; gap: 8px; }
  .evm-transport-row {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: #4b5563; line-height: 1.5;
  }
  .evm-transport-icon {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  /* Files */
  .evm-files { display: flex; flex-direction: column; gap: 8px; }
  .evm-file-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; background: #f8f9fc; border-radius: 9px;
    cursor: pointer; transition: background 0.15s;
  }
  .evm-file-row:hover { background: #eff4ff; }
  .evm-file-name { font-size: 13px; font-weight: 600; color: #111827; flex: 1; }
  .evm-file-size { font-size: 11px; color: #9ca3af; }

  /* Contact */
  .evm-contact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .evm-contact-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; background: #f8f9fc; border-radius: 10px;
  }
  .evm-contact-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #eff4ff; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .evm-contact-label { font-size: 11px; color: #9ca3af; }
  .evm-contact-value { font-size: 13px; color: #111827; font-weight: 600; }

  /* CTA */
  .evm-cta-bar {
    position: sticky; bottom: 0;
    background: #fff; border-top: 1px solid #e9ecef;
    padding: 16px 28px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .evm-cta-price-label { font-size: 11px; color: #9ca3af; }
  .evm-cta-price { font-size: 16px; font-weight: 800; color: #111827; }
  .evm-cta-actions { display: flex; gap: 8px; }
  .evm-btn-secondary {
    height: 42px; padding: 0 18px; border-radius: 10px;
    border: 1px solid #e2e8f0; background: #fff;
    font-size: 13px; font-weight: 600; color: #374151;
    cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
  }
  .evm-btn-secondary:hover { background: #f8f9fc; }
  .evm-btn-primary {
    height: 42px; padding: 0 28px; border-radius: 10px;
    border: none; background: #1a4fd6; color: #fff;
    font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
    box-shadow: 0 2px 12px rgba(26,79,214,0.25);
  }
  .evm-btn-primary:hover { background: #1541b0; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(26,79,214,0.35); }

  /* Responsive */
  @media (max-width: 700px) {
    .evm-quick-info { grid-template-columns: 1fr; }
    .evm-speakers { grid-template-columns: 1fr; }
    .evm-contact-grid { grid-template-columns: 1fr; }
    .evm-hero { height: 180px; }
    .evm-hero-title { font-size: 20px; }
    .evm-content { padding: 20px 18px 28px; }
    .evm-cta-bar { padding: 14px 18px; }
  }
`;

export default function EventDetailModal({ event, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const overlayRef = useRef(null);

  const detail = getDetailData(event.id);
  const pct = Math.round((event.participants / event.capacity) * 100);
  const remaining = event.capacity - event.participants;

  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 280);
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div
        ref={overlayRef}
        className={`evm-overlay ${isOpen ? "open" : ""}`}
        onClick={handleOverlayClick}
      >
        <div className="evm-modal">
          {/* ─── Hero ─── */}
          <div className="evm-hero">
            {!imgError ? (
              <img
                src={event.image}
                alt={event.title}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, #1a4fd6 0%, #6366f1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "64px",
                }}
              >
                {event.fallback}
              </div>
            )}
            <div className="evm-hero-overlay" />
            <div className="evm-hero-content">
              <div className="evm-hero-badge">
                <div className="ev-live-dot" />
                LIVE
              </div>
              <div className="evm-hero-category">{event.category}</div>
              <div className="evm-hero-title">{event.title}</div>
            </div>
            <div className="evm-topbar">
              <button className="evm-icon-btn" title="공유">
                <Share2 size={16} />
              </button>
              <button className="evm-icon-btn" title="북마크">
                <Bookmark size={16} />
              </button>
              <button
                className="evm-icon-btn"
                onClick={handleClose}
                title="닫기"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ─── Body ─── */}
          <div className="evm-content">
            {/* Quick info */}
            <div className="evm-quick-info">
              <div className="evm-qi-item">
                <div className="evm-qi-icon" style={{ background: "#eff4ff" }}>
                  <Calendar size={17} color="#1a4fd6" />
                </div>
                <div>
                  <div className="evm-qi-label">일시</div>
                  <div className="evm-qi-value">{event.date}</div>
                </div>
              </div>
              <div className="evm-qi-item">
                <div className="evm-qi-icon" style={{ background: "#fef3c7" }}>
                  <Clock size={17} color="#f59e0b" />
                </div>
                <div>
                  <div className="evm-qi-label">시간</div>
                  <div className="evm-qi-value">{event.time}</div>
                </div>
              </div>
              <div className="evm-qi-item">
                <div className="evm-qi-icon" style={{ background: "#ecfdf5" }}>
                  <MapPin size={17} color="#10b981" />
                </div>
                <div>
                  <div className="evm-qi-label">장소</div>
                  <div className="evm-qi-value">{event.location}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#eff4ff" }}
                >
                  <Building2 size={15} color="#1a4fd6" />
                </div>
                <div className="evm-section-title">행사 소개</div>
              </div>
              <div className="evm-desc">{detail.description}</div>
            </div>

            {/* Schedule */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#fef3c7" }}
                >
                  <Clock size={15} color="#f59e0b" />
                </div>
                <div className="evm-section-title">프로그램 타임테이블</div>
              </div>
              <div className="evm-schedule">
                {detail.schedule.map((item, i) => (
                  <div className="evm-sch-item" key={i}>
                    <div className="evm-sch-time-col">
                      <div className="evm-sch-time">{item.time}</div>
                    </div>
                    <div className="evm-sch-line-col">
                      <div className={`evm-sch-dot ${item.type}`} />
                      <div className="evm-sch-rail" />
                    </div>
                    <div className="evm-sch-body">
                      <div
                        className={`evm-sch-title ${item.type === "break" ? "is-break" : ""}`}
                      >
                        {item.title}
                      </div>
                      {item.speaker && (
                        <div className="evm-sch-speaker">
                          {item.speaker}
                          {item.role ? ` · ${item.role}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speakers */}
            {detail.speakers && detail.speakers.length > 0 && (
              <div className="evm-section">
                <div className="evm-section-header">
                  <div
                    className="evm-section-icon"
                    style={{ background: "#fce7f3" }}
                  >
                    <Mic2 size={15} color="#e11d48" />
                  </div>
                  <div className="evm-section-title">연사 정보</div>
                </div>
                <div className="evm-speakers">
                  {detail.speakers.map((sp, i) => (
                    <div className="evm-speaker-card" key={i}>
                      <div
                        className="evm-speaker-avatar"
                        style={{ background: sp.color }}
                      >
                        {sp.avatar}
                      </div>
                      <div>
                        <div className="evm-speaker-name">{sp.name}</div>
                        <div className="evm-speaker-role">{sp.role}</div>
                        <div className="evm-speaker-topic">{sp.topic}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participation */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#ecfdf5" }}
                >
                  <Users size={15} color="#10b981" />
                </div>
                <div className="evm-section-title">참가 현황</div>
              </div>
              <div className="evm-participants-bar">
                <div className="evm-part-header">
                  <div className="evm-part-count">
                    {event.participants.toLocaleString()}
                    <span> / {event.capacity.toLocaleString()}명</span>
                  </div>
                  <div className="evm-part-pct">{pct}%</div>
                </div>
                <div className="evm-part-track">
                  <div className="evm-part-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="evm-part-note">
                  {remaining > 0 ? (
                    <>
                      잔여석 <strong>{remaining.toLocaleString()}석</strong>{" "}
                      남음
                    </>
                  ) : (
                    <>
                      <strong>마감</strong> — 대기자 등록 가능
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Location & Transport */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#f3e8ff" }}
                >
                  <Navigation size={15} color="#8b5cf6" />
                </div>
                <div className="evm-section-title">위치 및 교통 안내</div>
              </div>

              <div className="evm-map-placeholder">
                <div className="evm-map-placeholder-inner">
                  <MapPin size={28} />
                  지도 영역 (카카오맵 / 구글맵 연동)
                </div>
              </div>

              <div className="evm-address">
                <MapPin size={14} color="#1a4fd6" />
                {event.location}
              </div>

              <div className="evm-transport">
                <div className="evm-transport-row">
                  <div
                    className="evm-transport-icon"
                    style={{ background: "#eff4ff" }}
                  >
                    <Train size={14} color="#1a4fd6" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "12px" }}>지하철</strong>
                    <br />
                    {detail.transport.subway}
                  </div>
                </div>
                <div className="evm-transport-row">
                  <div
                    className="evm-transport-icon"
                    style={{ background: "#ecfdf5" }}
                  >
                    <Navigation size={14} color="#10b981" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "12px" }}>버스</strong>
                    <br />
                    {detail.transport.bus}
                  </div>
                </div>
                <div className="evm-transport-row">
                  <div
                    className="evm-transport-icon"
                    style={{ background: "#fef3c7" }}
                  >
                    <Car size={14} color="#f59e0b" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "12px" }}>자가용</strong>
                    <br />
                    {detail.transport.car}
                  </div>
                </div>
              </div>
            </div>

            {/* Files */}
            {detail.files && detail.files.length > 0 && (
              <div className="evm-section">
                <div className="evm-section-header">
                  <div
                    className="evm-section-icon"
                    style={{ background: "#fff7ed" }}
                  >
                    <Download size={15} color="#ea580c" />
                  </div>
                  <div className="evm-section-title">관련 자료</div>
                </div>
                <div className="evm-files">
                  {detail.files.map((f, i) => (
                    <div className="evm-file-row" key={i}>
                      <Download size={14} color="#6b7280" />
                      <div className="evm-file-name">{f.name}</div>
                      <div className="evm-file-size">{f.size}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact / Organizer */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#f0fdf4" }}
                >
                  <Phone size={15} color="#16a34a" />
                </div>
                <div className="evm-section-title">주최 및 문의</div>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  marginBottom: "12px",
                }}
              >
                주최: <strong>{detail.organizer}</strong>
              </div>
              <div className="evm-contact-grid">
                <div className="evm-contact-item">
                  <div className="evm-contact-icon">
                    <Phone size={14} color="#1a4fd6" />
                  </div>
                  <div>
                    <div className="evm-contact-label">전화</div>
                    <div className="evm-contact-value">
                      {detail.contact.phone}
                    </div>
                  </div>
                </div>
                <div className="evm-contact-item">
                  <div className="evm-contact-icon">
                    <Mail size={14} color="#1a4fd6" />
                  </div>
                  <div>
                    <div className="evm-contact-label">이메일</div>
                    <div className="evm-contact-value">
                      {detail.contact.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Sticky CTA ─── */}
          <div className="evm-cta-bar">
            <div>
              <div className="evm-cta-price-label">참가비</div>
              <div className="evm-cta-price">{detail.price}</div>
            </div>
            <div className="evm-cta-actions">
              <button className="evm-btn-secondary">
                <ExternalLink size={14} />
                공유
              </button>
              {!registered ? (
                <button
                  className="evm-btn-primary"
                  onClick={() => setRegistered(true)}
                >
                  <Zap size={14} />
                  참가 신청
                </button>
              ) : (
                <button
                  className="evm-btn-primary"
                  style={{
                    background: "#10b981",
                    boxShadow: "0 2px 12px rgba(16,185,129,0.25)",
                  }}
                  onClick={() => setRegistered(false)}
                >
                  <CheckCircle size={14} />
                  신청 완료
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
