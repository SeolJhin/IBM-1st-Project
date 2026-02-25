import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";

import {
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Bell,
  ListOrdered,
  Timer,
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

  .wt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .wt-root *, .wt-root *::before, .wt-root *::after { box-sizing: border-box; font-family: inherit; }
  .wt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .rt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: wt-pulse 1.4s ease-in-out infinite;
  }
  @keyframes wt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .wt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .wt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px;
    display: flex; align-items: center; gap: 14px;
  }
  .wt-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .wt-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .wt-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .wt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .wt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .wt-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .wt-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .wt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  .wt-main-grid { display: grid; grid-template-columns: 380px 1fr; gap: 14px; }

  .wt-my-ticket {
    background: linear-gradient(135deg, #1a4fd6 0%, #3b82f6 100%);
    border-radius: 13px; padding: 28px 24px; color: #fff; margin-bottom: 14px;
    position: relative; overflow: hidden;
  }
  .wt-my-ticket::before {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%;
  }
  .wt-my-ticket::after {
    content: ''; position: absolute; bottom: -20px; left: 60px;
    width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;
  }
  .wt-ticket-label { font-size: 12px; font-weight: 500; opacity: 0.75; margin-bottom: 4px; }
  .wt-ticket-num {
    font-size: 52px; font-weight: 900; line-height: 1; letter-spacing: -2px;
    margin-bottom: 12px;
  }
  .wt-ticket-info { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .wt-ticket-row { display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.85; }
  .wt-ticket-divider { height: 1px; background: rgba(255,255,255,0.2); margin: 14px 0; }
  .wt-ticket-status { display: flex; align-items: center; gap: 8px; }
  .wt-ticket-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: wt-pulse 1.4s ease-in-out infinite; }
  .wt-ticket-status-text { font-size: 13px; font-weight: 600; }

  .wt-ahead {
    background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 16px;
    display: flex; align-items: center; justify-content: space-between; margin-top: 14px;
  }
  .wt-ahead-label { font-size: 12px; opacity: 0.8; }
  .wt-ahead-val { font-size: 18px; font-weight: 800; }

  .wt-queue-list { display: flex; flex-direction: column; gap: 8px; }
  .wt-queue-item {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; border: 1px solid #e9ecef; border-radius: 10px;
    background: #fff; transition: all 0.15s;
  }
  .wt-queue-item.calling { border-color: #1a4fd6; background: #f5f8ff; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .wt-queue-item.done { opacity: 0.5; }
  .wt-queue-num {
    width: 36px; height: 36px; border-radius: 9px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: #6b7280; flex-shrink: 0;
  }
  .wt-queue-num.calling { background: #1a4fd6; color: #fff; }
  .wt-queue-num.done { background: #ecfdf5; color: #10b981; }
  .wt-queue-info { flex: 1; }
  .wt-queue-name { font-size: 14px; font-weight: 600; color: #111827; }
  .wt-queue-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .wt-queue-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
  }
  .wt-queue-badge.calling { background: #eff4ff; color: #1a4fd6; }
  .wt-queue-badge.waiting { background: #fff7ed; color: #d97706; }
  .wt-queue-badge.done { background: #ecfdf5; color: #059669; }
  .wt-queue-wait { font-size: 12px; color: #9ca3af; min-width: 40px; text-align: right; }

  .wt-zone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 0; }
  .wt-zone-card { border: 1.5px solid #e9ecef; border-radius: 10px; padding: 16px 18px; text-align: center; }
  .wt-zone-card.busy { border-color: #fca5a5; background: #fff5f5; }
  .wt-zone-card.normal { border-color: #fde68a; background: #fffdf0; }
  .wt-zone-card.clear { border-color: #a7f3d0; background: #f0fdf9; }
  .wt-zone-name { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
  .wt-zone-num { font-size: 24px; font-weight: 900; color: #111827; }
  .wt-zone-label { font-size: 11px; margin-top: 4px; font-weight: 600; }
  .wt-zone-card.busy .wt-zone-label { color: #ef4444; }
  .wt-zone-card.normal .wt-zone-label { color: #d97706; }
  .wt-zone-card.clear .wt-zone-label { color: #10b981; }

  .wt-notify-btn {
    width: 100%; padding: 11px; background: rgba(255,255,255,0.15);
    border: 1.5px solid rgba(255,255,255,0.3); border-radius: 8px;
    color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: background 0.15s; margin-top: 14px;
  }
  .wt-notify-btn:hover { background: rgba(255,255,255,0.25); }
  .wt-notify-btn.active { background: rgba(255,255,255,0.9); color: #1a4fd6; }

  .wt-wave-wrap { display: flex; align-items: flex-end; gap: 4px; height: 60px; padding: 0 4px; }
  .wt-wave-bar { flex: 1; border-radius: 4px 4px 0 0; background: #bfdbfe; cursor: default; position: relative; }
  .wt-wave-bar.current { background: #1a4fd6; }
  .wt-wave-bar:hover .wt-wave-tooltip { display: block; }
  .wt-wave-tooltip {
    display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
    background: #1a4fd6; color: #fff; font-size: 10px; font-weight: 600;
    padding: 3px 7px; border-radius: 4px; white-space: nowrap;
  }

  /* Live header */
  .wt-live-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .wt-live-header-right { display: flex; align-items: center; gap: 12px; }
  .wt-timestamp { font-size: 12px; color: #9ca3af; font-weight: 500; font-variant-numeric: tabular-nums; }

  @media (max-width: 1000px) { .wt-main-grid { grid-template-columns: 1fr; } }
  @media (max-width: 640px) {
    .wt-container { padding: 20px 16px 48px; }
    .wt-stat-grid { grid-template-columns: 1fr 1fr; }
    .wt-zone-grid { grid-template-columns: 1fr; }
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

const QUEUE_DATA = [
  {
    num: "W-018",
    name: "코코 & 박*희",
    ticket: "가족 패키지",
    wait: "-",
    status: "done",
  },
  {
    num: "W-019",
    name: "두부 & 최*혁",
    ticket: "일반 입장",
    wait: "-",
    status: "done",
  },
  {
    num: "W-020",
    name: "하루 & 이*연",
    ticket: "VIP 패키지",
    wait: "입장 중",
    status: "calling",
  },
  {
    num: "W-021",
    name: "별이 & 홍*동",
    ticket: "일반 입장",
    wait: "약 5분",
    status: "waiting",
  },
  {
    num: "W-022",
    name: "초코 & 김*수",
    ticket: "일반 입장",
    wait: "약 10분",
    status: "waiting",
  },
  {
    num: "W-023",
    name: "몽이 & 정*아",
    ticket: "가족 패키지",
    wait: "약 15분",
    status: "waiting",
  },
  {
    num: "W-024",
    name: "루비 & 윤*진",
    ticket: "VIP 패키지",
    wait: "약 18분",
    status: "waiting",
  },
  {
    num: "W-025",
    name: "탄이 & 임*호",
    ticket: "일반 입장",
    wait: "약 22분",
    status: "waiting",
  },
];

const ZONES = [
  { name: "A 게이트", count: 12, status: "busy" },
  { name: "B 게이트", count: 7, status: "normal" },
  { name: "VIP 게이트", count: 3, status: "clear" },
];
const ZONE_LABEL = { busy: "혼잡", normal: "보통", clear: "원활" };

const HOURS = ["10", "11", "12", "13", "14", "15", "16", "17", "18"];
const AVG_WAIT = [5, 8, 18, 15, 12, 9, 7, 4, 2];

const STAT_ITEMS = [
  {
    label: "현재 대기",
    rawValue: 23,
    suffix: "팀",
    icon: <Clock size={20} color="#f59e0b" />,
    bg: "#fffbeb",
  },
  {
    label: "입장 완료",
    rawValue: 142,
    suffix: "팀",
    icon: <CheckCircle2 size={20} color="#10b981" />,
    bg: "#ecfdf5",
  },
  {
    label: "평균 대기",
    rawValue: 8,
    suffix: "분",
    icon: <Timer size={20} color="#1a4fd6" />,
    bg: "#eff4ff",
  },
  {
    label: "총 대기 등록",
    rawValue: 165,
    suffix: "팀",
    icon: <Users size={20} color="#8b5cf6" />,
    bg: "#f5f3ff",
  },
];

/* ── Animated stat card ── */
function AnimStatCard({ item, index }) {
  const count = useCountUp(item.rawValue, 1000, index * 120);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100 + 50);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div className={`wt-stat-card anim-pop ${visible ? "visible" : ""}`}>
      <div className="wt-stat-icon" style={{ background: item.bg }}>
        {item.icon}
      </div>
      <div>
        <div className="wt-stat-label">{item.label}</div>
        <div className="wt-stat-value">
          {count}
          {item.suffix}
        </div>
      </div>
    </div>
  );
}

/* ── Animated zone card ── */
function AnimZoneCard({ zone, index }) {
  const count = useCountUp(zone.count, 800, index * 150 + 300);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 150 + 200);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={`wt-zone-card ${zone.status} anim-pop ${visible ? "visible" : ""}`}
    >
      <div className="wt-zone-name">{zone.name}</div>
      <div className="wt-zone-num">{count}</div>
      <div className="wt-zone-label">{ZONE_LABEL[zone.status]}</div>
    </div>
  );
}

function WaitingContent() {
  const [notifyOn, setNotifyOn] = useState(false);
  const { tick, lastUpdated } = useAutoRefresh(5000);
  const { spinning, refresh } = useRefresh(() => {}, 800);
  const queueVisible = useStaggerIn(QUEUE_DATA.length, 80);
  const maxAvg = Math.max(...AVG_WAIT);
  const barHeights = useBarAnimate(
    AVG_WAIT.map((v) => (v / maxAvg) * 100),
    70,
  );
  const [flashKey, setFlashKey] = useState(0);

  // Ticket number count-up
  const ticketNum = useCountUp(21, 1400, 200);

  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [tick]);

  return (
    <>
      {/* Live header with refresh */}
      <div className="wt-live-header">
        <div className="rt-live-badge anim-glow">
          <div className="rt-live-dot" />
          LIVE
        </div>
        <div className="wt-live-header-right">
          <span key={flashKey} className="wt-timestamp anim-flash">
            마지막 갱신: {lastUpdated}
          </span>
          <button
            className="rt-refresh-btn"
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
            title="새로고침"
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

      {/* Stats — count up + pop in */}
      <div className="wt-stat-grid">
        {STAT_ITEMS.map((s, i) => (
          <AnimStatCard key={s.label} item={s} index={i} />
        ))}
      </div>

      <div className="wt-main-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* My ticket */}
          <div className="wt-my-ticket">
            <div className="wt-ticket-label">내 대기 번호</div>
            <div className="wt-ticket-num">
              W-0{ticketNum < 10 ? "0" : ""}
              {ticketNum}
            </div>
            <div className="wt-ticket-info">
              <div className="wt-ticket-row">
                <Users size={13} /> 별이 & 홍*동
              </div>
              <div className="wt-ticket-row">
                <Clock size={13} /> 일반 입장 · 14:05 등록
              </div>
            </div>
            <div className="wt-ticket-divider" />
            <div className="wt-ticket-status">
              <div className="wt-ticket-status-dot" />
              <span className="wt-ticket-status-text">
                대기 중 · 현재 W-020 입장 중
              </span>
            </div>
            <div className="wt-ahead">
              <span className="wt-ahead-label">내 앞 대기</span>
              <span className="wt-ahead-val">1팀</span>
            </div>
            <button
              className={`wt-notify-btn${notifyOn ? " active" : ""}`}
              onClick={() => setNotifyOn((v) => !v)}
            >
              <Bell size={14} />
              {notifyOn ? "알림 설정 완료" : "내 차례 알림 받기"}
            </button>
          </div>

          {/* Zone status — count up + pop */}
          <div className="wt-card">
            <div className="wt-card-header">
              <div className="wt-card-title">
                <div className="wt-card-title-icon">
                  <ListOrdered size={14} color="#f59e0b" />
                </div>
                구역별 혼잡도
              </div>
            </div>
            <div className="wt-zone-grid">
              {ZONES.map((z, i) => (
                <AnimZoneCard key={z.name} zone={z} index={i} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Queue list — stagger slide in */}
          <div className="wt-card">
            <div className="wt-card-header">
              <div className="wt-card-title">
                <div className="wt-card-title-icon">
                  <Users size={14} color="#f59e0b" />
                </div>
                현재 대기열
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="wt-card-tag">실시간 업데이트</span>
                <button
                  style={{
                    width: 30,
                    height: 30,
                    border: "1px solid #e2e8f0",
                    borderRadius: 7,
                    background: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    transition: "all 0.15s",
                  }}
                  onClick={refresh}
                >
                  <RefreshCw
                    size={13}
                    style={{
                      animation: spinning
                        ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)"
                        : "none",
                    }}
                  />
                </button>
              </div>
            </div>
            <div className="wt-queue-list">
              {QUEUE_DATA.map((q, i) => (
                <div
                  key={q.num}
                  className={`wt-queue-item${q.status === "calling" ? " calling" : q.status === "done" ? " done" : ""} anim-slide-right ${queueVisible.includes(i) ? "visible" : ""}`}
                >
                  <div
                    className={`wt-queue-num${q.status === "calling" ? " calling" : q.status === "done" ? " done" : ""}`}
                  >
                    {q.status === "done" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      q.num.split("-")[1]
                    )}
                  </div>
                  <div className="wt-queue-info">
                    <div className="wt-queue-name">{q.name}</div>
                    <div className="wt-queue-sub">{q.ticket}</div>
                  </div>
                  <span className={`wt-queue-badge ${q.status}`}>
                    {q.status === "calling" && <ArrowRight size={11} />}
                    {q.status === "calling"
                      ? "입장 중"
                      : q.status === "done"
                        ? "완료"
                        : "대기 중"}
                  </span>
                  <span className="wt-queue-wait">{q.wait}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Avg wait chart — bars animate up */}
          <div className="wt-card">
            <div className="wt-card-header">
              <div className="wt-card-title">
                <div className="wt-card-title-icon">
                  <Timer size={14} color="#f59e0b" />
                </div>
                시간대별 평균 대기 시간
              </div>
              <span className="wt-card-tag">단위: 분</span>
            </div>
            <div className="wt-wave-wrap">
              {AVG_WAIT.map((v, i) => (
                <div
                  key={i}
                  className={`wt-wave-bar${i === 4 ? " current" : ""} anim-bar-grow`}
                  style={{ height: `${barHeights[i]}%` }}
                >
                  <div className="wt-wave-tooltip">
                    {HOURS[i]}시 {v}분
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                paddingLeft: 4,
              }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 9.5,
                    color: "#9ca3af",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 16,
                fontSize: 12.5,
                color: "#6b7280",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: "#bfdbfe",
                  }}
                />{" "}
                일반 시간대
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: "#1a4fd6",
                  }}
                />{" "}
                현재
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function WaitingStatus({ onNavigate: onNavigateProp }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const currentPath = "/realtime/waitingstatus";

  const handleSelectEvent = (id) => {
    navigate(`/realtime/waitingstatus/${id}`);
  };

  const handleNavigate = (path) => {
    if (eventId) {
      navigate(`${path}/${eventId}`);
    } else {
      navigate(path);
    }
    onNavigateProp?.(path);
  };

  return (
    <div className="wt-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      <PageHeader
        title="대기 현황"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
      <main className="wt-container">
        {eventId ? (
          <WaitingContent />
        ) : (
          <RealtimeEventSelector
            onSelectEvent={handleSelectEvent}
            pageTitle="대기 현황"
          />
        )}
      </main>
    </div>
  );
}
