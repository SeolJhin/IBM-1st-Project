import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Users,
  ChevronRight,
  Radio,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react";

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ev-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

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

  /* Thumbnail area */
  .ev-card-thumb {
    width: 100%; height: 160px; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .ev-card-thumb-pattern {
    position: absolute; inset: 0; opacity: 0.08;
    background-image: radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px),
                      radial-gradient(circle at 80% 20%, currentColor 1px, transparent 1px),
                      radial-gradient(circle at 60% 80%, currentColor 1px, transparent 1px);
    background-size: 40px 40px, 30px 30px, 50px 50px;
  }
  .ev-card-thumb-icon {
    position: relative; z-index: 1;
    width: 56px; height: 56px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }

  /* Status badge on thumb */
  .ev-card-status {
    position: absolute; top: 14px; left: 14px; z-index: 2;
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 100px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
    backdrop-filter: blur(6px);
  }
  .ev-card-status.live {
    background: rgba(255, 255, 255, 0.92); color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.15);
  }
  .ev-card-status.upcoming {
    background: rgba(255, 255, 255, 0.92); color: #d97706;
    border: 1px solid rgba(217, 119, 6, 0.15);
  }
  .ev-card-status.ended {
    background: rgba(255, 255, 255, 0.92); color: #9ca3af;
    border: 1px solid rgba(156, 163, 175, 0.15);
  }
  .ev-card-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
  }
  .ev-card-status.live .ev-card-status-dot {
    background: #ef4444; animation: ev-pulse 1.4s ease-in-out infinite;
  }
  .ev-card-status.upcoming .ev-card-status-dot { background: #d97706; }
  .ev-card-status.ended .ev-card-status-dot { background: #9ca3af; }

  @keyframes ev-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* Participant badge on thumb */
  .ev-card-participants {
    position: absolute; top: 14px; right: 14px; z-index: 2;
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
  .ev-card-desc {
    font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 16px;
    flex: 1;
  }
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

  /* Empty state */
  .ev-empty {
    text-align: center; padding: 60px 20px; color: #9ca3af;
  }
  .ev-empty-icon {
    width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 16px;
    background: #f3f4f6; display: flex; align-items: center; justify-content: center;
  }
  .ev-empty-title { font-size: 16px; font-weight: 700; color: #6b7280; margin-bottom: 6px; }
  .ev-empty-desc { font-size: 13px; }

  @media (max-width: 768px) {
    .ev-grid { grid-template-columns: 1fr; }
    .ev-container { padding: 20px 16px 48px; }
  }
`;

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const STATUS_LABEL = {
  live: "진행 중",
  upcoming: "예정",
  ended: "종료",
};

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "live", label: "진행 중" },
  { key: "upcoming", label: "예정" },
  { key: "ended", label: "종료" },
];

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function EventSelectPage({ events, basePath }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all" ? events : events.filter((e) => e.status === filter);

  const handleSelect = (event) => {
    navigate(`${basePath}/${event.id}`);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ev-container">
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
                className="ev-card"
                onClick={() => handleSelect(event)}
              >
                {/* Thumbnail */}
                <div
                  className="ev-card-thumb"
                  style={{
                    background: `linear-gradient(135deg, ${event.color}12 0%, ${event.color}08 100%)`,
                    color: event.color,
                  }}
                >
                  <div className="ev-card-thumb-pattern" />
                  <div className="ev-card-thumb-icon">
                    <CalendarDays size={24} color={event.color} />
                  </div>

                  {/* Status */}
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
                      상세보기 <ChevronRight size={14} />
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
    </>
  );
}

