import PageHeader from "../components/PageHeader";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  UserCheck,
  Users,
  ScanLine,
  RefreshCw,
} from "lucide-react";
import {
  useCountUp,
  useRefresh,
  useStaggerIn,
  useAutoRefresh,
  SHARED_ANIM_STYLES,
} from "./useRealtimeAnimations";

export const SERVICE_CATEGORIES = [
  { label: "통합 현황", path: "/realtime/dashboard" },
  { label: "대기 현황", path: "/realtime/waitingstatus" },
  { label: "체크인 현황", path: "/realtime/checkinstatus" },
  { label: "투표 현황", path: "/realtime/votestatus" },
];
export const SUBTITLE_MAP = {
  "/realtime/dashboard": "행사 전체 현황을 실시간으로 모니터링합니다",
  "/realtime/waitingstatus": "대기열 현황을 실시간으로 확인합니다",
  "/realtime/checkinstatus": "참가자 체크인 현황을 실시간으로 확인합니다",
  "/realtime/votestatus": "진행 중인 투표의 실시간 결과를 확인합니다",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ck-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .ck-root *, .ck-root *::before, .ck-root *::after { box-sizing: border-box; font-family: inherit; }

  .ck-ph-header { background: #fff; border-bottom: 1px solid #e9ecef; padding: 0 32px; }
  .ck-ph-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .ck-ph-left { display: flex; flex-direction: column; gap: 2px; }
  .ck-ph-title { font-size: 17px; font-weight: 800; color: #111827; }
  .ck-ph-sub { font-size: 12px; color: #9ca3af; }
  .ck-ph-nav { display: flex; gap: 4px; }
  .ck-ph-nav-btn { height: 34px; padding: 0 14px; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; color: #6b7280; background: transparent; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .ck-ph-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .ck-ph-nav-btn.active { background: #1a4fd6; color: #fff; font-weight: 600; }

  .ck-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .rt-live-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca; border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444; margin-bottom: 20px; }
  .rt-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: ck-pulse 1.4s ease-in-out infinite; }
  @keyframes ck-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }

  .ck-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .ck-stat-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px; display: flex; align-items: center; gap: 14px; }
  .ck-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ck-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .ck-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .ck-ring-wrap { display: flex; align-items: center; justify-content: center; padding: 8px 0 16px; gap: 28px; }
  .ck-ring-legend { display: flex; flex-direction: column; gap: 10px; }
  .ck-ring-legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; }
  .ck-ring-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .ck-ring-legend-val { font-weight: 700; color: #111827; margin-left: 4px; }

  .ck-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .ck-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .ck-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .ck-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #eff4ff; display: flex; align-items: center; justify-content: center; }

  .ck-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; }
  .ck-search-wrap { position: relative; flex: 1; }
  .ck-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  .ck-search { width: 100%; height: 40px; padding: 0 13px 0 36px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px; color: #111827; outline: none; font-family: inherit; background: #fff; transition: border-color 0.15s; }
  .ck-search:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .ck-filter-btn { height: 40px; padding: 0 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; font-size: 13px; font-weight: 500; color: #374151; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; transition: border-color 0.15s; }
  .ck-filter-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .ck-filter-btn.active { border-color: #1a4fd6; background: #f5f8ff; color: #1a4fd6; }

  .ck-table-wrap { overflow-x: auto; }
  .ck-table { width: 100%; border-collapse: collapse; }
  .ck-table thead tr { background: #f9fafb; }
  .ck-table th { padding: 11px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-align: left; border-bottom: 1px solid #e9ecef; white-space: nowrap; }
  .ck-table td { padding: 14px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f1f3f5; }
  .ck-table tbody tr:hover { background: #fafbff; }
  .ck-table tbody tr:last-child td { border-bottom: none; }

  .ck-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
  .ck-badge.done { background: #ecfdf5; color: #059669; }
  .ck-badge.wait { background: #fff7ed; color: #d97706; }
  .ck-badge.no { background: #fef2f2; color: #dc2626; }
  .ck-ticket-chip { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }

  .ck-two-col { display: grid; grid-template-columns: 320px 1fr; gap: 14px; margin-bottom: 16px; }

  .ck-prog-list { display: flex; flex-direction: column; gap: 14px; }
  .ck-prog-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .ck-prog-name { font-size: 13px; font-weight: 600; color: #374151; }
  .ck-prog-val { font-size: 12px; color: #6b7280; }
  .ck-prog-track { height: 7px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .ck-prog-fill { height: 100%; border-radius: 100px; }

  .ck-empty { text-align: center; padding: 36px 0; color: #9ca3af; font-size: 13.5px; }

  /* Live header */
  .ck-live-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .ck-live-header-right { display: flex; align-items: center; gap: 12px; }
  .ck-timestamp { font-size: 12px; color: #9ca3af; font-weight: 500; font-variant-numeric: tabular-nums; }

  /* Table row animation */
  .ck-table tbody tr {
    opacity: 0;
    transform: translateY(8px);
    animation: ck-row-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  @keyframes ck-row-in {
    to { opacity: 1; transform: translateY(0); }
  }

  /* SVG ring animation */
  .ck-ring-animate {
    transition: stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1), stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1);
  }

  @media (max-width: 900px) {
    .ck-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .ck-two-col { grid-template-columns: 1fr; }
    .ck-ph-nav { display: none; }
  }
  @media (max-width: 640px) {
    .ck-container { padding: 20px 16px 48px; }
    .ck-stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;

const CHECKIN_DATA = [
  {
    id: "REG-2026-003847",
    name: "홍길동",
    ticket: "일반 입장",
    time: "14:31",
    status: "done",
    gate: "A-1",
  },
  {
    id: "REG-2026-003821",
    name: "이지연",
    ticket: "VIP 패키지",
    time: "14:29",
    status: "done",
    gate: "VIP",
  },
  {
    id: "REG-2026-003798",
    name: "김민수",
    ticket: "가족 패키지",
    time: "14:25",
    status: "done",
    gate: "A-2",
  },
  {
    id: "REG-2026-003774",
    name: "박지희",
    ticket: "일반 입장",
    time: "14:22",
    status: "done",
    gate: "A-1",
  },
  {
    id: "REG-2026-003761",
    name: "최준혁",
    ticket: "일반 입장",
    time: "-",
    status: "wait",
    gate: "-",
  },
  {
    id: "REG-2026-003744",
    name: "정서아",
    ticket: "VIP 패키지",
    time: "14:10",
    status: "done",
    gate: "VIP",
  },
  {
    id: "REG-2026-003712",
    name: "강동현",
    ticket: "일반 입장",
    time: "-",
    status: "no",
    gate: "-",
  },
  {
    id: "REG-2026-003698",
    name: "윤수진",
    ticket: "가족 패키지",
    time: "13:58",
    status: "done",
    gate: "A-2",
  },
  {
    id: "REG-2026-003682",
    name: "임태호",
    ticket: "일반 입장",
    time: "-",
    status: "wait",
    gate: "-",
  },
  {
    id: "REG-2026-003671",
    name: "장미래",
    ticket: "VIP 패키지",
    time: "13:45",
    status: "done",
    gate: "VIP",
  },
];

const TICKET_STATS = [
  { name: "일반 입장", done: 620, total: 900, color: "#1a4fd6" },
  { name: "VIP 패키지", done: 154, total: 210, color: "#8b5cf6" },
  { name: "가족 패키지", done: 73, total: 174, color: "#10b981" },
];

const BADGE_CONFIG = {
  done: { label: "완료", icon: <CheckCircle2 size={11} />, cls: "done" },
  wait: { label: "미완료", icon: <Clock size={11} />, cls: "wait" },
  no: { label: "불참", icon: <XCircle size={11} />, cls: "no" },
};

const TICKET_COLORS = {
  "일반 입장": { bg: "#eff4ff", color: "#1a4fd6" },
  "VIP 패키지": { bg: "#f5f3ff", color: "#7c3aed" },
  "가족 패키지": { bg: "#ecfdf5", color: "#059669" },
};

/* ── Animated stat card ── */
function AnimStatCard({ label, rawValue, icon, bg, index }) {
  const count = useCountUp(rawValue, 1000, index * 120);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100 + 50);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <div className={`ck-stat-card anim-pop ${visible ? "visible" : ""}`}>
      <div className="ck-stat-icon" style={{ background: bg }}>
        {icon}
      </div>
      <div>
        <div className="ck-stat-label">{label}</div>
        <div className="ck-stat-value">{count}명</div>
      </div>
    </div>
  );
}

/* ── Animated ticket progress ── */
function AnimTicketProgress({ t, index }) {
  const [width, setWidth] = useState(0);
  const pct = Math.round((t.done / t.total) * 100);
  const animDone = useCountUp(t.done, 800, index * 150 + 500);
  useEffect(() => {
    const tm = setTimeout(() => setWidth(pct), index * 150 + 500);
    return () => clearTimeout(tm);
  }, [pct, index]);

  return (
    <div className="ck-prog-item">
      <div className="ck-prog-header">
        <span className="ck-prog-name">{t.name}</span>
        <span className="ck-prog-val">
          {animDone}/{t.total}
        </span>
      </div>
      <div className="ck-prog-track">
        <div
          className="ck-prog-fill anim-progress-fill"
          style={{ width: `${width}%`, background: t.color }}
        />
      </div>
    </div>
  );
}

/* ── Animated donut ring ── */
function AnimatedDonut({ doneCount, waitCount, noCount, total }) {
  const r = 54,
    cx = 70,
    cy = 70,
    circumference = 2 * Math.PI * r;
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimProgress(1), 400);
    return () => clearTimeout(t);
  }, []);

  const donePct = doneCount / total;
  const waitPct = waitCount / total;
  const doneLen = circumference * donePct * animProgress;
  const waitLen = circumference * waitPct * animProgress;
  const noLen = circumference * (noCount / total) * animProgress;

  const pctDisplay = useCountUp(Math.round(donePct * 100), 1200, 400);
  const animDone = useCountUp(doneCount, 1000, 300);
  const animWait = useCountUp(waitCount, 1000, 400);
  const animNo = useCountUp(noCount, 1000, 500);

  return (
    <div className="ck-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f1f3f5"
          strokeWidth="14"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
          className="ck-ring-animate"
          strokeDasharray={`${noLen} ${circumference - noLen}`}
          strokeDashoffset={-(doneLen + waitLen)}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="14"
          className="ck-ring-animate"
          strokeDasharray={`${waitLen} ${circumference - waitLen}`}
          strokeDashoffset={-doneLen}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth="14"
          className="ck-ring-animate"
          strokeDasharray={`${doneLen} ${circumference - doneLen}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          fill="#111827"
          fontFamily="inherit"
        >
          {pctDisplay}%
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="10"
          fill="#9ca3af"
          fontFamily="inherit"
        >
          체크인률
        </text>
      </svg>
      <div className="ck-ring-legend">
        {[
          { color: "#10b981", label: "완료", val: animDone },
          { color: "#f59e0b", label: "미완료", val: animWait },
          { color: "#ef4444", label: "불참", val: animNo },
        ].map((l) => (
          <div key={l.label} className="ck-ring-legend-item">
            <div
              className="ck-ring-legend-dot"
              style={{ background: l.color }}
            />
            {l.label}
            <span className="ck-ring-legend-val">{l.val}명</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckinContent() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const { tick, lastUpdated } = useAutoRefresh(5000);
  const { spinning, refresh } = useRefresh(() => {}, 800);
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [tick]);

  const filtered = CHECKIN_DATA.filter((d) => {
    const matchQ = d.name.includes(query) || d.id.includes(query);
    const matchF = filter === "all" || d.status === filter;
    return matchQ && matchF;
  });

  const doneCount = CHECKIN_DATA.filter((d) => d.status === "done").length;
  const waitCount = CHECKIN_DATA.filter((d) => d.status === "wait").length;
  const noCount = CHECKIN_DATA.filter((d) => d.status === "no").length;
  const total = CHECKIN_DATA.length;

  return (
    <>
      {/* Live header */}
      <div className="ck-live-header">
        <div className="rt-live-badge anim-glow">
          <div className="rt-live-dot" />
          LIVE
        </div>
        <div className="ck-live-header-right">
          <span key={flashKey} className="ck-timestamp anim-flash">
            {lastUpdated}
          </span>
          <button
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7280",
              transition: "all 0.15s",
            }}
            onClick={refresh}
          >
            <RefreshCw
              size={14}
              style={{
                animation: spinning
                  ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)"
                  : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Stats — animated */}
      <div className="ck-stat-grid">
        {[
          {
            label: "총 참가 신청",
            rawValue: total,
            icon: <Users size={20} color="#1a4fd6" />,
            bg: "#eff4ff",
          },
          {
            label: "체크인 완료",
            rawValue: doneCount,
            icon: <CheckCircle2 size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
          {
            label: "미완료",
            rawValue: waitCount,
            icon: <Clock size={20} color="#f59e0b" />,
            bg: "#fffbeb",
          },
          {
            label: "불참",
            rawValue: noCount,
            icon: <XCircle size={20} color="#ef4444" />,
            bg: "#fef2f2",
          },
        ].map((s, i) => (
          <AnimStatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      <div className="ck-two-col">
        {/* Donut — animated ring + counts */}
        <div className="ck-card" style={{ padding: "24px" }}>
          <div className="ck-card-header">
            <div className="ck-card-title">
              <div className="ck-card-title-icon">
                <UserCheck size={14} color="#1a4fd6" />
              </div>
              체크인 비율
            </div>
          </div>
          <AnimatedDonut
            doneCount={doneCount}
            waitCount={waitCount}
            noCount={noCount}
            total={total}
          />
          <div style={{ borderTop: "1px solid #f1f3f5", paddingTop: 16 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 12,
              }}
            >
              티켓 유형별
            </div>
            <div className="ck-prog-list">
              {TICKET_STATS.map((t, i) => (
                <AnimTicketProgress key={t.name} t={t} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Table — rows stagger in */}
        <div className="ck-card" style={{ padding: "24px" }}>
          <div className="ck-card-header">
            <div className="ck-card-title">
              <div className="ck-card-title-icon">
                <ScanLine size={14} color="#1a4fd6" />
              </div>
              체크인 목록
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              총 {filtered.length}건
            </span>
          </div>
          <div className="ck-toolbar">
            <div className="ck-search-wrap">
              <Search size={15} className="ck-search-icon" />
              <input
                className="ck-search"
                placeholder="이름 또는 신청번호 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {["all", "done", "wait", "no"].map((f) => (
              <button
                key={f}
                className={`ck-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {{ all: "전체", done: "완료", wait: "미완료", no: "불참" }[f]}
              </button>
            ))}
          </div>
          <div className="ck-table-wrap">
            <table className="ck-table">
              <thead>
                <tr>
                  <th>신청번호</th>
                  <th>이름</th>
                  <th>티켓</th>
                  <th>게이트</th>
                  <th>시간</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ck-empty">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d, i) => {
                    const badge = BADGE_CONFIG[d.status];
                    const tc = TICKET_COLORS[d.ticket];
                    return (
                      <tr key={d.id} style={{ animationDelay: `${i * 50}ms` }}>
                        <td style={{ color: "#9ca3af", fontSize: 12 }}>
                          {d.id}
                        </td>
                        <td style={{ fontWeight: 600, color: "#111827" }}>
                          {d.name}
                        </td>
                        <td>
                          <span
                            className="ck-ticket-chip"
                            style={{ background: tc.bg, color: tc.color }}
                          >
                            {d.ticket}
                          </span>
                        </td>
                        <td style={{ color: "#6b7280" }}>{d.gate}</td>
                        <td style={{ color: "#6b7280" }}>{d.time}</td>
                        <td>
                          <span className={`ck-badge ${badge.cls}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckinStatus() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState("/realtime/checkinstatus");

  const handleSelectEvent = (id) => {
    navigate(`/realtime/checkinstatus/${id}`);
  };

  const handleNavigate = (path) => {
    setCurrentPath(path);
    if (eventId) {
      navigate(`${path}/${eventId}`);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="ck-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      <PageHeader
        title="체크인 현황"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
      <main className="ck-container">
        {eventId ? (
          <CheckinContent />
        ) : (
          <RealtimeEventSelector
            onSelectEvent={handleSelectEvent}
            pageTitle="체크인 현황"
          />
        )}
      </main>
    </div>
  );
}
