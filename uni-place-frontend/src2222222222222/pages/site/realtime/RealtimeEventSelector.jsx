import { useState, useEffect } from "react";
import {
  Radio,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
  Signal,
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";

/* ── 더미 행사 데이터 ── */
const MOCK_EVENTS = [
  {
    id: "evt-001",
    name: "2025 글로벌 AI 컨퍼런스",
    date: "2025.03.15 (토)",
    location: "코엑스 그랜드볼룸",
    status: "live",
    participants: 1284,
    checkedIn: 847,
    waiting: 23,
  },
  {
    id: "evt-002",
    name: "스타트업 네트워킹 데이",
    date: "2025.03.18 (화)",
    location: "서울 스타트업허브 3F",
    status: "upcoming",
    participants: 356,
    checkedIn: 0,
    waiting: 0,
  },
  {
    id: "evt-003",
    name: "디자인 워크숍 Vol.12",
    date: "2025.03.20 (목)",
    location: "성수 아트홀",
    status: "upcoming",
    participants: 128,
    checkedIn: 0,
    waiting: 0,
  },
  {
    id: "evt-004",
    name: "2025 봄 채용박람회",
    date: "2025.03.10 (월)",
    location: "세종대학교 대양홀",
    status: "ended",
    participants: 2140,
    checkedIn: 1876,
    waiting: 0,
  },
  {
    id: "evt-005",
    name: "ESG 경영 세미나",
    date: "2025.03.08 (토)",
    location: "여의도 전경련회관",
    status: "ended",
    participants: 412,
    checkedIn: 389,
    waiting: 0,
  },
];

const STATUS_CONFIG = {
  live: {
    label: "LIVE",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  upcoming: {
    label: "예정",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  ended: {
    label: "종료",
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  },
};

const selectorStyles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .rte-selector {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
  }
  .rte-selector *, .rte-selector *::before, .rte-selector *::after {
    box-sizing: border-box;
    font-family: inherit;
  }

  /* ── Top bar ── */
  .rte-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .rte-topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .rte-monitor-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1e293b, #334155);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(30,41,59,0.18);
  }
  .rte-topbar-title {
    font-size: 15px; font-weight: 700; color: #111827;
    line-height: 1.3;
  }
  .rte-topbar-desc {
    font-size: 12px; color: #9ca3af; margin-top: 1px;
  }

  /* ── Search bar ── */
  .rte-search-wrap {
    position: relative;
    width: 260px;
  }
  .rte-search-input {
    width: 100%;
    height: 38px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0 14px 0 36px;
    font-size: 13px;
    color: #374151;
    background: #fff;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .rte-search-input::placeholder { color: #c4c9d4; }
  .rte-search-input:focus {
    border-color: #1a4fd6;
    box-shadow: 0 0 0 3px rgba(26,79,214,0.08);
  }
  .rte-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #c4c9d4;
    pointer-events: none;
  }

  /* ── Filter tabs ── */
  .rte-filters {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }
  .rte-filter-tab {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    background: #fff;
    font-size: 12.5px;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
    display: flex; align-items: center; gap: 5px;
  }
  .rte-filter-tab:hover { border-color: #cbd5e1; background: #f8fafc; }
  .rte-filter-tab.active {
    background: #1e293b;
    border-color: #1e293b;
    color: #fff;
  }
  .rte-filter-count {
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 100px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.06);
  }
  .rte-filter-tab.active .rte-filter-count {
    background: rgba(255,255,255,0.2);
  }

  /* ── Event rows ── */
  .rte-event-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rte-event-row {
    background: #fff;
    border: 1.5px solid #e9ecef;
    border-radius: 14px;
    padding: 20px 24px;
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 20px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .rte-event-row::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 0;
    background: linear-gradient(135deg, #1e293b, #334155);
    transition: width 0.25s ease;
    border-radius: 14px 0 0 14px;
  }
  .rte-event-row:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }
  .rte-event-row:hover::before {
    width: 4px;
  }
  .rte-event-row.live-row {
    border-color: #fecaca;
    background: linear-gradient(135deg, #fffbfb, #fff);
  }
  .rte-event-row.live-row:hover {
    border-color: #f87171;
    box-shadow: 0 4px 24px rgba(239,68,68,0.1);
  }
  .rte-event-row.live-row::before {
    width: 4px;
    background: linear-gradient(180deg, #ef4444, #dc2626);
  }

  /* ── Status badge ── */
  .rte-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid;
  }
  .rte-live-pulse {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #ef4444;
    animation: rte-pulse 1.4s ease-in-out infinite;
  }
  @keyframes rte-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* ── Event info ── */
  .rte-event-info { min-width: 0; }
  .rte-event-name {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rte-event-meta {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .rte-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #9ca3af;
  }

  /* ── Metrics preview ── */
  .rte-metrics {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .rte-metric {
    text-align: center;
    min-width: 64px;
  }
  .rte-metric-value {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .rte-metric-label {
    font-size: 10.5px;
    color: #9ca3af;
    margin-top: 4px;
    font-weight: 500;
  }
  .rte-metric-divider {
    width: 1px;
    height: 28px;
    background: #f1f3f5;
  }

  /* ── Arrow ── */
  .rte-arrow {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: #f8f9fc;
    display: flex; align-items: center; justify-content: center;
    color: #c4c9d4;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .rte-event-row:hover .rte-arrow {
    background: #1e293b;
    color: #fff;
    transform: translateX(2px);
  }
  .rte-event-row.live-row:hover .rte-arrow {
    background: #ef4444;
  }

  /* ── Empty state ── */
  .rte-empty {
    text-align: center;
    padding: 60px 20px;
    color: #9ca3af;
  }
  .rte-empty-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
  }
  .rte-empty-text { font-size: 14px; font-weight: 600; color: #6b7280; }
  .rte-empty-sub { font-size: 12px; margin-top: 4px; }

  /* ── Stagger animation ── */
  .rte-event-row {
    opacity: 0;
    transform: translateY(12px);
    animation: rte-row-in 0.4s ease forwards;
  }
  @keyframes rte-row-in {
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .rte-event-row {
      grid-template-columns: auto 1fr auto;
      gap: 14px;
    }
    .rte-metrics { display: none; }
  }
  @media (max-width: 640px) {
    .rte-selector { padding: 20px 16px 48px; }
    .rte-topbar { flex-direction: column; align-items: flex-start; }
    .rte-search-wrap { width: 100%; }
    .rte-event-row { padding: 16px 18px; }
  }
`;

export default function RealtimeEventSelector({ onSelectEvent, pageTitle }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [events] = useState(MOCK_EVENTS);

  const filtered = events.filter((evt) => {
    const matchSearch =
      search === "" ||
      evt.name.toLowerCase().includes(search.toLowerCase()) ||
      evt.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || evt.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: events.length,
    live: events.filter((e) => e.status === "live").length,
    upcoming: events.filter((e) => e.status === "upcoming").length,
    ended: events.filter((e) => e.status === "ended").length,
  };

  return (
    <>
      <style>{selectorStyles}</style>
      <div className="rte-selector">
        {/* Top bar */}
        <div className="rte-topbar">
          <div className="rte-topbar-left">
            <div className="rte-monitor-icon">
              <Signal size={18} color="#fff" />
            </div>
            <div>
              <div className="rte-topbar-title">
                모니터링할 행사를 선택하세요
              </div>
              <div className="rte-topbar-desc">
                {pageTitle} 화면으로 이동합니다
              </div>
            </div>
          </div>
          <div className="rte-search-wrap">
            <Search size={14} className="rte-search-icon" />
            <input
              className="rte-search-input"
              type="text"
              placeholder="행사명 또는 장소 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="rte-filters">
          {[
            { key: "all", label: "전체" },
            { key: "live", label: "진행중" },
            { key: "upcoming", label: "예정" },
            { key: "ended", label: "종료" },
          ].map((f) => (
            <button
              key={f.key}
              className={`rte-filter-tab ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="rte-filter-count">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {/* Event list */}
        <div className="rte-event-list">
          {filtered.length === 0 ? (
            <div className="rte-empty">
              <div className="rte-empty-icon">
                <Search size={20} color="#9ca3af" />
              </div>
              <div className="rte-empty-text">검색 결과가 없습니다</div>
              <div className="rte-empty-sub">
                다른 검색어나 필터를 시도해보세요
              </div>
            </div>
          ) : (
            filtered.map((evt, i) => {
              const sc = STATUS_CONFIG[evt.status];
              return (
                <div
                  key={evt.id}
                  className={`rte-event-row ${evt.status === "live" ? "live-row" : ""}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => onSelectEvent(evt.id)}
                >
                  {/* Status badge */}
                  <div
                    className="rte-status-badge"
                    style={{
                      color: sc.color,
                      background: sc.bg,
                      borderColor: sc.border,
                    }}
                  >
                    {evt.status === "live" && (
                      <span className="rte-live-pulse" />
                    )}
                    {sc.label}
                  </div>

                  {/* Event info */}
                  <div className="rte-event-info">
                    <div className="rte-event-name">{evt.name}</div>
                    <div className="rte-event-meta">
                      <span className="rte-meta-item">
                        <CalendarDays size={12} />
                        {evt.date}
                      </span>
                      <span className="rte-meta-item">
                        <MapPin size={12} />
                        {evt.location}
                      </span>
                    </div>
                  </div>

                  {/* Metrics preview */}
                  <div className="rte-metrics">
                    <div className="rte-metric">
                      <div className="rte-metric-value">
                        {evt.participants.toLocaleString()}
                      </div>
                      <div className="rte-metric-label">참가자</div>
                    </div>
                    <div className="rte-metric-divider" />
                    <div className="rte-metric">
                      <div
                        className="rte-metric-value"
                        style={{
                          color: evt.checkedIn > 0 ? "#10b981" : "#d1d5db",
                        }}
                      >
                        {evt.checkedIn.toLocaleString()}
                      </div>
                      <div className="rte-metric-label">체크인</div>
                    </div>
                    <div className="rte-metric-divider" />
                    <div className="rte-metric">
                      <div
                        className="rte-metric-value"
                        style={{
                          color: evt.waiting > 0 ? "#f59e0b" : "#d1d5db",
                        }}
                      >
                        {evt.waiting}
                      </div>
                      <div className="rte-metric-label">대기</div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="rte-arrow">
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
