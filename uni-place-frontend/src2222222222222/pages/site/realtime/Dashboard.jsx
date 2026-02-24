import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  Users,
  CheckCircle2,
  Vote,
  Clock,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Radio,
  RefreshCw,
} from "lucide-react";
import {
  useCountUp,
  useRefresh,
  useStaggerIn,
  useAutoRefresh,
  useBarAnimate,
  SHARED_ANIM_STYLES,
} from "./useRealtimeAnimations";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .rt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .rt-root *, .rt-root *::before, .rt-root *::after { box-sizing: border-box; font-family: inherit; }
  .rt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* Live badge */
  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .rt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: rt-pulse 1.4s ease-in-out infinite;
  }
  @keyframes rt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* Stat cards */
  .rt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .rt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 22px 22px 20px; position: relative; overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .rt-stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .rt-stat-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
  }
  .rt-stat-label { font-size: 12.5px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
  .rt-stat-value { font-size: 26px; font-weight: 800; color: #111827; line-height: 1; }
  .rt-stat-sub { font-size: 12px; color: #9ca3af; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
  .rt-stat-up { color: #10b981; }
  .rt-stat-down { color: #ef4444; }
  .rt-stat-bg {
    position: absolute; right: -10px; bottom: -10px;
    width: 70px; height: 70px; border-radius: 50%; opacity: 0.06;
  }

  /* Card */
  .rt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .rt-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5;
  }
  .rt-card-title {
    font-size: 15px; font-weight: 700; color: #111827;
    display: flex; align-items: center; gap: 8px; margin: 0;
  }
  .rt-card-title-icon {
    width: 24px; height: 24px; border-radius: 6px;
    background: #eff4ff; display: flex; align-items: center; justify-content: center;
  }
  .rt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  /* Two-col layout */
  .rt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* Progress bar */
  .rt-progress-wrap { margin-bottom: 14px; }
  .rt-progress-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 7px; }
  .rt-progress-label-name { font-weight: 600; color: #374151; }
  .rt-progress-label-val { color: #6b7280; }
  .rt-progress-track { height: 8px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .rt-progress-fill { height: 100%; border-radius: 100px; }

  /* Timeline */
  .rt-timeline { display: flex; flex-direction: column; gap: 0; }
  .rt-timeline-item { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f9fafb; }
  .rt-timeline-item:last-child { border-bottom: none; }
  .rt-timeline-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .rt-timeline-time { font-size: 11.5px; color: #9ca3af; min-width: 44px; padding-top: 1px; }
  .rt-timeline-text { font-size: 13px; color: #374151; line-height: 1.5; }

  /* Heatmap */
  .rt-hour-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; }
  .rt-hour-cell {
    aspect-ratio: 1; border-radius: 4px; display: flex; align-items: center;
    justify-content: center; font-size: 9px; color: #fff; font-weight: 700;
    cursor: default;
  }

  /* Live header bar */
  .rt-live-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .rt-live-header-right {
    display: flex; align-items: center; gap: 12px;
  }
  .rt-timestamp {
    font-size: 12px; color: #9ca3af; font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .rt-refresh-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid #e2e8f0; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6b7280;
    transition: all 0.15s;
  }
  .rt-refresh-btn:hover { border-color: #1a4fd6; color: #1a4fd6; background: #f5f8ff; }
  .rt-refresh-btn:active { transform: scale(0.93); }

  @media (max-width: 900px) {
    .rt-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .rt-two-col { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .rt-container { padding: 20px 16px 48px; }
    .rt-stat-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

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

const STATS = [
  {
    label: "총 참가 신청",
    rawValue: 1284,
    sub: "전일 대비 +38명",
    up: true,
    icon: <Users size={18} color="#1a4fd6" />,
    iconBg: "#eff4ff",
    barColor: "#1a4fd6",
  },
  {
    label: "체크인 완료",
    rawValue: 847,
    sub: "전체의 65.9%",
    up: true,
    icon: <CheckCircle2 size={18} color="#10b981" />,
    iconBg: "#ecfdf5",
    barColor: "#10b981",
  },
  {
    label: "투표 참여",
    rawValue: 512,
    sub: "참여율 60.4%",
    up: true,
    icon: <Vote size={18} color="#8b5cf6" />,
    iconBg: "#f5f3ff",
    barColor: "#8b5cf6",
  },
  {
    label: "현재 대기",
    rawValue: 23,
    sub: "평균 대기 8분",
    up: false,
    icon: <Clock size={18} color="#f59e0b" />,
    iconBg: "#fffbeb",
    barColor: "#f59e0b",
  },
];

const HOUR_DATA = [
  { h: "10", v: 12, pct: 15 },
  { h: "11", v: 48, pct: 55 },
  { h: "12", v: 97, pct: 100 },
  { h: "13", v: 88, pct: 90 },
  { h: "14", v: 75, pct: 78 },
  { h: "15", v: 60, pct: 62 },
  { h: "16", v: 43, pct: 44 },
  { h: "17", v: 29, pct: 30 },
  { h: "18", v: 18, pct: 19 },
  { h: "19", v: 0, pct: 0 },
  { h: "20", v: 0, pct: 0 },
  { h: "21", v: 0, pct: 0 },
];

const RECENT_ACTIVITIES = [
  { time: "14:31", text: "홍*동님이 체크인을 완료했습니다.", color: "#10b981" },
  { time: "14:29", text: "이*연님이 투표에 참여했습니다.", color: "#8b5cf6" },
  { time: "14:27", text: "김*수님이 대기열에 등록했습니다.", color: "#f59e0b" },
  { time: "14:25", text: "박*희님이 체크인을 완료했습니다.", color: "#10b981" },
  { time: "14:22", text: "최*준님이 투표에 참여했습니다.", color: "#8b5cf6" },
  { time: "14:20", text: "정*아님이 체크인을 완료했습니다.", color: "#10b981" },
];

const PROGRESS_DATA = [
  { name: "체크인 완료", val: 847, total: 1284, color: "#10b981" },
  { name: "투표 참여", val: 512, total: 847, color: "#8b5cf6" },
  { name: "프로그램 참여", val: 390, total: 847, color: "#1a4fd6" },
  { name: "굿즈 수령", val: 234, total: 847, color: "#f59e0b" },
];

const getHeatColor = (pct) => {
  if (pct === 0) return "#f1f3f5";
  if (pct < 30) return "#bfdbfe";
  if (pct < 60) return "#60a5fa";
  if (pct < 85) return "#2563eb";
  return "#1a4fd6";
};

/* ── Animated stat card ── */
function AnimatedStatCard({ stat, index }) {
  const count = useCountUp(stat.rawValue, 1200, index * 120);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100 + 50);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div className={`rt-stat-card anim-pop ${visible ? "visible" : ""}`}>
      <div className="rt-stat-icon" style={{ background: stat.iconBg }}>
        {stat.icon}
      </div>
      <div className="rt-stat-label">{stat.label}</div>
      <div className="rt-stat-value">{count.toLocaleString()}</div>
      <div className="rt-stat-sub">
        {stat.up ? (
          <ArrowUpRight size={12} className="rt-stat-up" />
        ) : (
          <ArrowDownRight size={12} className="rt-stat-down" />
        )}
        <span className={stat.up ? "rt-stat-up" : "rt-stat-down"}>
          {stat.sub}
        </span>
      </div>
      <div className="rt-stat-bg" style={{ background: stat.barColor }} />
    </div>
  );
}

/* ── Animated progress bar ── */
function AnimatedProgress({ item, index }) {
  const [width, setWidth] = useState(0);
  const pct = Math.round((item.val / item.total) * 100);
  const animatedVal = useCountUp(item.val, 900, index * 150 + 400);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), index * 150 + 400);
    return () => clearTimeout(t);
  }, [pct, index]);

  return (
    <div className="rt-progress-wrap">
      <div className="rt-progress-label">
        <span className="rt-progress-label-name">{item.name}</span>
        <span className="rt-progress-label-val">
          {animatedVal.toLocaleString()} / {item.total.toLocaleString()}명
        </span>
      </div>
      <div className="rt-progress-track">
        <div
          className="rt-progress-fill anim-progress-fill"
          style={{ width: `${width}%`, background: item.color }}
        />
      </div>
    </div>
  );
}

/* ── Animated heatmap cell ── */
function AnimatedHeatCell({ h, index }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), index * 60 + 200);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
      }}
    >
      <div
        className="rt-hour-cell"
        style={{
          background: show ? getHeatColor(h.pct) : "#f1f3f5",
          width: "100%",
          fontSize: h.pct > 0 ? 9 : 8,
          color: show && h.pct > 50 ? "#fff" : "#9ca3af",
          transition: "background 0.5s ease, color 0.5s ease",
          transform: show ? "scale(1)" : "scale(0.8)",
          transitionProperty: "background, color, transform",
          transitionDuration: "0.5s",
        }}
        title={`${h.h}시 ${h.v}명`}
      >
        {show && h.v > 0 ? h.v : ""}
      </div>
      <div style={{ fontSize: 9, color: "#9ca3af", textAlign: "center" }}>
        {h.h}시
      </div>
    </div>
  );
}

/* ── Main content ── */
function DashboardContent() {
  const { tick, lastUpdated } = useAutoRefresh(5000);
  const { spinning, refresh } = useRefresh(() => {}, 800);
  const timelineVisible = useStaggerIn(RECENT_ACTIVITIES.length, 100);
  const [flashKey, setFlashKey] = useState(0);

  // Flash timestamp on auto-refresh
  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [tick]);

  return (
    <>
      {/* Live header with refresh */}
      <div className="rt-live-header">
        <div className="rt-live-badge anim-glow">
          <div className="rt-live-dot" />
          LIVE
        </div>
        <div className="rt-live-header-right">
          <span key={flashKey} className="rt-timestamp anim-flash">
            마지막 갱신: {lastUpdated}
          </span>
          <button className="rt-refresh-btn" onClick={refresh} title="새로고침">
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

      {/* Stats — count up + pop in */}
      <div className="rt-stat-grid">
        {STATS.map((s, i) => (
          <AnimatedStatCard key={s.label} stat={s} index={i} />
        ))}
      </div>

      <div className="rt-two-col">
        {/* 시간대별 체크인 — heatmap cells animate in */}
        <div className="rt-card">
          <div className="rt-card-header">
            <div className="rt-card-title">
              <div className="rt-card-title-icon">
                <BarChart2 size={14} color="#1a4fd6" />
              </div>
              시간대별 체크인 현황
            </div>
            <span className="rt-card-tag">오늘</span>
          </div>
          <div className="rt-hour-grid">
            {HOUR_DATA.map((h, i) => (
              <AnimatedHeatCell key={h.h} h={h} index={i} />
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: "#9ca3af" }}>낮음</span>
            {["#bfdbfe", "#60a5fa", "#2563eb", "#1a4fd6"].map((c) => (
              <div
                key={c}
                style={{
                  width: 16,
                  height: 10,
                  background: c,
                  borderRadius: 2,
                }}
              />
            ))}
            <span style={{ fontSize: 11, color: "#9ca3af" }}>높음</span>
          </div>
        </div>

        {/* 참가 현황 — progress bars animate in */}
        <div className="rt-card">
          <div className="rt-card-header">
            <div className="rt-card-title">
              <div className="rt-card-title-icon">
                <TrendingUp size={14} color="#1a4fd6" />
              </div>
              참가 현황 요약
            </div>
            <span className="rt-card-tag">실시간</span>
          </div>
          {PROGRESS_DATA.map((item, i) => (
            <AnimatedProgress key={item.name} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* 최근 활동 — stagger slide-in */}
      <div className="rt-card">
        <div className="rt-card-header">
          <div className="rt-card-title">
            <div className="rt-card-title-icon">
              <Activity size={14} color="#1a4fd6" />
            </div>
            최근 활동 로그
          </div>
          <span className="rt-card-tag">자동 갱신</span>
        </div>
        <div className="rt-timeline">
          {RECENT_ACTIVITIES.map((a, i) => (
            <div
              key={i}
              className={`rt-timeline-item anim-slide-right ${timelineVisible.includes(i) ? "visible" : ""}`}
            >
              <div
                className="rt-timeline-dot"
                style={{ background: a.color }}
              />
              <div className="rt-timeline-time">{a.time}</div>
              <div className="rt-timeline-text">{a.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState("/realtime/dashboard");

  const handleSelectEvent = (id) => {
    navigate(`/realtime/dashboard/${id}`);
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
    <div className="rt-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      <PageHeader
        title="통합 현황"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
      <main className="rt-container">
        {eventId ? (
          <DashboardContent />
        ) : (
          <RealtimeEventSelector
            onSelectEvent={handleSelectEvent}
            pageTitle="통합 현황"
          />
        )}
      </main>
    </div>
  );
}
