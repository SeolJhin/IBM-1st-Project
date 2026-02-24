import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Users,
  ChevronRight,
  X,
  AlertCircle,
  Lock,
  Store,
  Mic,
  Trophy,
  Palette,
} from "lucide-react";

/* ─────────────────────────────────────────
   basePath별 자동 섹션 구분
───────────────────────────────────────── */
const SECTION_CONFIG = {
  "/program/booth": {
    icon: Store,
    color: "#b45309",
    title: "부스 운영 현황",
    desc: "행사를 선택하면 부스 배치도와 실시간 운영 현황을 확인할 수 있어요",
  },
  "/program/session": {
    icon: Mic,
    color: "#1a4fd6",
    title: "세션 · 강연 일정",
    desc: "행사를 선택하면 전문가 세션과 강연 일정을 확인할 수 있어요",
  },
  "/program/schedule": {
    icon: CalendarDays,
    color: "#059669",
    title: "프로그램 타임테이블",
    desc: "행사를 선택하면 시간대별 프로그램 일정을 한눈에 확인할 수 있어요",
  },
  "/program/contest": {
    icon: Trophy,
    color: "#7c3aed",
    title: "콘테스트 · 투표",
    desc: "행사를 선택하면 콘테스트 목록을 확인하고 투표에 참여할 수 있어요",
  },
  "/program/experience": {
    icon: Palette,
    color: "#ec4899",
    title: "체험 프로그램",
    desc: "행사를 선택하면 체험 부스 목록과 참가 신청을 할 수 있어요",
  },
};

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ev-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* Section intro banner */
  .ev-section-banner {
    display: flex; align-items: center; gap: 16px;
    padding: 20px 24px; border-radius: 14px;
    margin-bottom: 24px; border: 1px solid;
  }
  .ev-section-icon {
    width: 48px; height: 48px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ev-section-title { font-size: 16px; font-weight: 800; margin-bottom: 3px; }
  .ev-section-desc { font-size: 13px; font-weight: 500; opacity: 0.75; }

  /* Status filter */
  .ev-filter-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .ev-filter-btn {
    padding: 8px 18px; border: 1px solid #e2e5ea; border-radius: 100px;
    background: #fff; font-size: 13px; font-weight: 600; color: #6b7280;
    cursor: pointer; transition: all 0.15s; font-family: inherit;
  }
  .ev-filter-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .ev-filter-btn.active { background: #1a4fd6; border-color: #1a4fd6; color: #fff; }

  /* Event card grid */
  .ev-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

  .ev-card {
    background: #fff; border: 1.5px solid #e9ecef; border-radius: 16px;
    padding: 0; overflow: hidden; cursor: pointer;
    transition: all 0.2s ease;
    display: flex; flex-direction: column;
  }
  .ev-card:hover {
    border-color: #b4c6f0;
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(26, 79, 214, 0.08);
  }
  .ev-card.ended { cursor: pointer; }
  .ev-card.ended:hover {
    border-color: #d1d5db;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  /* Thumbnail - IMAGE */
  .ev-card-thumb {
    width: 100%; height: 180px; position: relative; overflow: hidden;
    background: #f1f3f6;
  }
  .ev-card-thumb-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.35s ease;
  }
  .ev-card:hover .ev-card-thumb-img { transform: scale(1.05); }
  .ev-card.ended .ev-card-thumb-img { filter: grayscale(0.6) brightness(0.8); }

  .ev-card-thumb-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%);
    pointer-events: none;
  }

  /* Ended overlay */
  .ev-card-ended-overlay {
    position: absolute; inset: 0; z-index: 3;
    background: rgba(0,0,0,0.18);
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .ev-card-ended-label {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 100px;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
    font-size: 13px; font-weight: 700; color: #fff;
  }

  /* Status badge */
  .ev-card-status {
    position: absolute; top: 14px; left: 14px; z-index: 4;
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 100px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
    backdrop-filter: blur(6px);
  }
  .ev-card-status.live {
    background: rgba(255,255,255,0.92); color: #ef4444;
    border: 1px solid rgba(239,68,68,0.15);
  }
  .ev-card-status.upcoming {
    background: rgba(255,255,255,0.92); color: #d97706;
    border: 1px solid rgba(217,119,6,0.15);
  }
  .ev-card-status.ended {
    background: rgba(255,255,255,0.92); color: #9ca3af;
    border: 1px solid rgba(156,163,175,0.15);
  }
  .ev-card-status-dot { width: 6px; height: 6px; border-radius: 50%; }
  .ev-card-status.live .ev-card-status-dot {
    background: #ef4444; animation: ev-pulse 1.4s ease-in-out infinite;
  }
  .ev-card-status.upcoming .ev-card-status-dot { background: #d97706; }
  .ev-card-status.ended .ev-card-status-dot { background: #9ca3af; }

  @keyframes ev-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* Participant badge */
  .ev-card-participants {
    position: absolute; top: 14px; right: 14px; z-index: 4;
    display: flex; align-items: center; gap: 4px;
    padding: 5px 10px; border-radius: 100px;
    background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
    font-size: 11px; font-weight: 600; color: #fff;
  }

  /* Card body */
  .ev-card-body { padding: 20px 22px 22px; flex: 1; display: flex; flex-direction: column; }
  .ev-card-name {
    font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 6px;
    letter-spacing: -0.3px; line-height: 1.3;
  }
  .ev-card.ended .ev-card-name { color: #9ca3af; }
  .ev-card-desc {
    font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 16px; flex: 1;
  }
  .ev-card.ended .ev-card-desc { color: #b0b5c0; }
  .ev-card-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .ev-card-meta-item {
    display: flex; align-items: center; gap: 7px;
    font-size: 12.5px; color: #6b7280; font-weight: 500;
  }
  .ev-card-meta-icon {
    width: 22px; height: 22px; border-radius: 6px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ev-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 14px; border-top: 1px solid #f1f3f5;
  }
  .ev-card-organizer { font-size: 12px; color: #9ca3af; font-weight: 500; }
  .ev-card-enter {
    display: flex; align-items: center; gap: 4px;
    font-size: 13px; font-weight: 700; color: #1a4fd6;
  }
  .ev-card.ended .ev-card-enter { color: #9ca3af; }

  /* ── Modal ── */
  .ev-modal-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: ev-modal-bg-in 0.2s ease-out;
  }
  @keyframes ev-modal-bg-in { from { opacity: 0; } to { opacity: 1; } }

  .ev-modal {
    background: #fff; border-radius: 20px; width: 100%; max-width: 420px;
    overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: ev-modal-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes ev-modal-in {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .ev-modal-img-wrap { position: relative; width: 100%; height: 180px; overflow: hidden; }
  .ev-modal-img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.5) brightness(0.7); }
  .ev-modal-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .ev-modal-lock-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
  }
  .ev-modal-close {
    position: absolute; top: 12px; right: 12px; z-index: 2;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #fff; transition: background 0.15s;
  }
  .ev-modal-close:hover { background: rgba(0,0,0,0.6); }

  .ev-modal-body { padding: 28px 28px 24px; text-align: center; }
  .ev-modal-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 14px; border-radius: 100px;
    background: #f3f4f6; color: #6b7280;
    font-size: 12px; font-weight: 700; margin-bottom: 14px;
  }
  .ev-modal-title { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 6px; }
  .ev-modal-date { font-size: 13px; color: #9ca3af; font-weight: 500; margin-bottom: 20px; }
  .ev-modal-message {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 18px; border-radius: 12px;
    background: #fef3c7; border: 1px solid #fde68a;
    margin-bottom: 22px; text-align: left;
  }
  .ev-modal-message-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: #fff; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ev-modal-message-text { font-size: 13px; color: #92400e; font-weight: 600; line-height: 1.5; }
  .ev-modal-btn {
    width: 100%; padding: 14px 0; border-radius: 12px; border: none;
    font-family: inherit; font-size: 15px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
    background: #f3f4f6; color: #374151;
  }
  .ev-modal-btn:hover { background: #e5e7eb; }

  /* Empty state */
  .ev-empty { text-align: center; padding: 60px 20px; color: #9ca3af; }
  .ev-empty-icon {
    width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 16px;
    background: #f3f4f6; display: flex; align-items: center; justify-content: center;
  }
  .ev-empty-title { font-size: 16px; font-weight: 700; color: #6b7280; margin-bottom: 6px; }
  .ev-empty-desc { font-size: 13px; }

  @media (max-width: 768px) {
    .ev-grid { grid-template-columns: 1fr; }
    .ev-container { padding: 20px 16px 48px; }
    .ev-modal { max-width: 100%; }
    .ev-section-banner { flex-direction: column; align-items: flex-start; gap: 10px; }
  }
`;

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const STATUS_LABEL = { live: "진행 중", upcoming: "예정", ended: "종료" };
const FILTERS = [
  { key: "all", label: "전체" },
  { key: "live", label: "진행 중" },
  { key: "upcoming", label: "예정" },
  { key: "ended", label: "종료" },
];

/* ─────────────────────────────────────────
   Ended Event Modal
───────────────────────────────────────── */
function EndedModal({ event, onClose }) {
  if (!event) return null;
  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ev-modal-img-wrap">
          <img
            className="ev-modal-img"
            src={
              event.thumbnail ||
              `https://picsum.photos/seed/${event.id}/600/360`
            }
            alt={event.name}
          />
          <div className="ev-modal-img-overlay">
            <div className="ev-modal-lock-icon">
              <Lock size={24} color="#fff" />
            </div>
          </div>
          <button className="ev-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="ev-modal-body">
          <div className="ev-modal-badge">
            <Lock size={12} />
            종료된 행사
          </div>
          <div className="ev-modal-title">{event.name}</div>
          <div className="ev-modal-date">
            {event.date} · {event.location}
          </div>
          <div className="ev-modal-message">
            <div className="ev-modal-message-icon">
              <AlertCircle size={18} color="#d97706" />
            </div>
            <div className="ev-modal-message-text">
              이 행사는 이미 종료되어
              <br />
              상세 내용을 확인할 수 없습니다.
            </div>
          </div>
          <button className="ev-modal-btn" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
   Props: events, basePath (기존과 동일)
───────────────────────────────────────── */
export default function EventSelectPage({ events, basePath }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [endedEvent, setEndedEvent] = useState(null);

  const filtered =
    filter === "all" ? events : events.filter((e) => e.status === filter);

  const handleCardClick = (event) => {
    if (event.status === "ended") {
      setEndedEvent(event);
    } else {
      navigate(`${basePath}/${event.id}`);
    }
  };

  // basePath에서 자동으로 섹션 설정을 가져옴
  const section =
    SECTION_CONFIG[basePath] || SECTION_CONFIG["/program/experience"];
  const SectionIcon = section.icon;
  const sColor = section.color;

  return (
    <>
      <style>{styles}</style>
      <div className="ev-container">
        {/* Section intro banner - basePath별 자동 구분 */}
        <div
          className="ev-section-banner"
          style={{
            background: `${sColor}08`,
            borderColor: `${sColor}20`,
          }}
        >
          <div
            className="ev-section-icon"
            style={{ background: `${sColor}12` }}
          >
            <SectionIcon size={22} color={sColor} />
          </div>
          <div>
            <div className="ev-section-title" style={{ color: sColor }}>
              {section.title}
            </div>
            <div className="ev-section-desc" style={{ color: sColor }}>
              {section.desc}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ev-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`ev-filter-btn${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Event grid */}
        {filtered.length > 0 ? (
          <div className="ev-grid">
            {filtered.map((event) => (
              <div
                key={event.id}
                className={`ev-card${event.status === "ended" ? " ended" : ""}`}
                onClick={() => handleCardClick(event)}
              >
                {/* Thumbnail — 실제 thumbnail이 있으면 사용, 없으면 더미 이미지 */}
                <div className="ev-card-thumb">
                  <img
                    className="ev-card-thumb-img"
                    src={
                      event.thumbnail ||
                      `https://picsum.photos/seed/${event.id}/600/360`
                    }
                    alt={event.name}
                  />
                  <div className="ev-card-thumb-overlay" />

                  {/* Ended overlay */}
                  {event.status === "ended" && (
                    <div className="ev-card-ended-overlay">
                      <div className="ev-card-ended-label">
                        <Lock size={13} /> 종료된 행사
                      </div>
                    </div>
                  )}

                  {/* Status badge */}
                  <div className={`ev-card-status ${event.status}`}>
                    <div className="ev-card-status-dot" />
                    {STATUS_LABEL[event.status]}
                  </div>

                  {/* Participants */}
                  {event.participants > 0 && (
                    <div className="ev-card-participants">
                      <Users size={12} />
                      {event.participants.toLocaleString()}명
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="ev-card-body">
                  <div className="ev-card-name">{event.name}</div>
                  <div className="ev-card-desc">{event.description}</div>
                  <div className="ev-card-meta">
                    <div className="ev-card-meta-item">
                      <div className="ev-card-meta-icon">
                        <CalendarDays size={12} color="#6b7280" />
                      </div>
                      {event.date}
                    </div>
                    <div className="ev-card-meta-item">
                      <div className="ev-card-meta-icon">
                        <MapPin size={12} color="#6b7280" />
                      </div>
                      {event.location}
                    </div>
                  </div>
                  <div className="ev-card-footer">
                    <span className="ev-card-organizer">
                      주최: {event.organizer}
                    </span>
                    <span className="ev-card-enter">
                      {event.status === "ended" ? "조회 불가" : "상세보기"}
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ev-empty">
            <div className="ev-empty-icon">
              <CalendarDays size={24} color="#9ca3af" />
            </div>
            <div className="ev-empty-title">등록된 행사가 없습니다</div>
            <div className="ev-empty-desc">
              해당 조건에 맞는 행사가 아직 없습니다
            </div>
          </div>
        )}
      </div>

      {/* Ended modal */}
      <EndedModal event={endedEvent} onClose={() => setEndedEvent(null)} />
    </>
  );
}
