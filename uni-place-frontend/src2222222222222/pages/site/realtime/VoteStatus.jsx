import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  Vote,
  Trophy,
  Users,
  ChevronUp,
  CheckCircle2,
  BarChart2,
  PieChart,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  useCountUp,
  useRefresh,
  useStaggerIn,
  useAutoRefresh,
  SHARED_ANIM_STYLES,
} from "./useRealtimeAnimations";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .vt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f6f7fb;
    min-height: 100vh;
  }
  .vt-root *, .vt-root *::before, .vt-root *::after { box-sizing: border-box; font-family: inherit; }
  .vt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .rt-live-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: #fff0f0; border: 1px solid #fecaca; border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444; letter-spacing: 0.5px; }
  .rt-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: vt-pulse 1.4s ease-in-out infinite; }
  @keyframes vt-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }

  .vt-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .vt-stat-card { background: #fff; border: 1px solid #eceef3; border-radius: 14px; padding: 22px 24px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s, box-shadow 0.2s; }
  .vt-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
  .vt-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .vt-stat-label { font-size: 12px; color: #868e9c; font-weight: 500; margin-bottom: 2px; }
  .vt-stat-value { font-size: 22px; font-weight: 800; color: #1a1d24; letter-spacing: -0.5px; }

  .vt-card { background: #fff; border: 1px solid #eceef3; border-radius: 14px; padding: 22px 24px; margin-bottom: 0; }
  .vt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f6; }
  .vt-card-title { font-size: 15px; font-weight: 700; color: #1a1d24; display: flex; align-items: center; gap: 8px; margin: 0; }
  .vt-card-title-icon { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
  .vt-card-tag { font-size: 11px; font-weight: 600; color: #868e9c; background: #f3f4f7; padding: 4px 10px; border-radius: 100px; }

  .vt-tabs { display: flex; gap: 6px; margin-bottom: 20px; }
  .vt-tab { padding: 8px 18px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .vt-tab.active { border-color: #8b5cf6; background: #f5f0ff; color: #7c3aed; font-weight: 700; }
  .vt-tab:hover:not(.active) { border-color: #c4b5fd; color: #7c3aed; }
  .vt-tab-badge { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: 700; background: #ede9fe; color: #7c3aed; margin-left: 6px; }
  .vt-tab.active .vt-tab-badge { background: #7c3aed; color: #fff; }

  .vt-vote-list { display: flex; flex-direction: column; gap: 10px; }
  .vt-vote-item { border: 1.5px solid #eceef3; border-radius: 12px; padding: 16px 18px; transition: all 0.15s; }
  .vt-vote-item.leading { border-color: #c4b5fd; background: #faf8ff; }
  .vt-vote-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .vt-vote-rank { width: 28px; height: 28px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #6b7280; flex-shrink: 0; }
  .vt-vote-rank.first { background: #fef3c7; color: #d97706; }
  .vt-vote-rank.second { background: #f1f5f9; color: #64748b; }
  .vt-vote-rank.third { background: #fff7ed; color: #c2410c; }
  .vt-vote-name { font-size: 14px; font-weight: 700; color: #1a1d24; flex: 1; }
  .vt-vote-count { font-size: 13px; font-weight: 600; color: #7c3aed; display: flex; align-items: center; gap: 4px; }
  .vt-vote-pct { font-size: 13px; font-weight: 700; color: #374151; min-width: 36px; text-align: right; }
  .vt-bar-track { height: 7px; background: #f1f3f6; border-radius: 100px; overflow: hidden; }
  .vt-bar-fill { height: 100%; border-radius: 100px; }

  .vt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .vt-opinion-list { display: flex; flex-direction: column; gap: 8px; }
  .vt-opinion-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 10px; border: 1px solid #eceef3; }
  .vt-opinion-bar-wrap { flex: 1; }
  .vt-opinion-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 5px; }
  .vt-opinion-track { height: 6px; background: #f1f3f6; border-radius: 100px; overflow: hidden; }
  .vt-opinion-fill { height: 100%; border-radius: 100px; }
  .vt-opinion-val { font-size: 14px; font-weight: 800; color: #1a1d24; min-width: 36px; text-align: right; }

  .vt-history-list { display: flex; flex-direction: column; gap: 0; }
  .vt-history-item { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #f9fafb; font-size: 13px; }
  .vt-history-item:last-child { border-bottom: none; }
  .vt-history-dot { width: 7px; height: 7px; border-radius: 50%; background: #8b5cf6; flex-shrink: 0; }
  .vt-history-time { font-size: 11.5px; color: #9ca3af; min-width: 44px; }
  .vt-history-name { color: #374151; }
  .vt-history-choice { font-weight: 600; color: #7c3aed; }

  .vt-live-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .vt-live-header-right { display: flex; align-items: center; gap: 12px; }
  .vt-timestamp { font-size: 12px; color: #9ca3af; font-weight: 500; font-variant-numeric: tabular-nums; }

  /* CTA to contest page */
  .vt-cta-banner {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, #f5f0ff 0%, #ede9fe 100%);
    border: 1px solid #ddd6fe; border-radius: 14px;
    padding: 18px 22px; margin-bottom: 20px; cursor: pointer;
    transition: all 0.2s;
  }
  .vt-cta-banner:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,0.1); }
  .vt-cta-left { display: flex; align-items: center; gap: 12px; }
  .vt-cta-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: #7c3aed; display: flex; align-items: center; justify-content: center;
  }
  .vt-cta-text { font-size: 14px; font-weight: 700; color: #4c1d95; }
  .vt-cta-sub { font-size: 12px; color: #7c3aed; margin-top: 2px; font-weight: 500; }
  .vt-cta-arrow { color: #7c3aed; }

  @media (max-width: 900px) { .vt-stat-grid { grid-template-columns: 1fr 1fr 1fr; } .vt-two-col { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .vt-container { padding: 20px 16px 48px; } .vt-stat-grid { grid-template-columns: 1fr 1fr; } }
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
  "/realtime/votestatus": "진행 중인 투표의 실시간 결과를 모니터링합니다",
};

const VOTES = {
  best: {
    title: "베스트 드레서 콘테스트",
    total: 512,
    status: "진행 중",
    items: [
      { name: "별이 (포메라니안)", votes: 184, color: "#8b5cf6" },
      { name: "보리 (시바견)", votes: 147, color: "#a78bfa" },
      { name: "하루 (말티즈)", votes: 98, color: "#c4b5fd" },
      { name: "코코 (푸들)", votes: 53, color: "#ddd6fe" },
      { name: "두부 (비숑)", votes: 30, color: "#ede9fe" },
    ],
  },
  satisfaction: {
    title: "행사 만족도 조사",
    total: 389,
    status: "진행 중",
    items: [
      { name: "매우 만족", votes: 212, color: "#10b981" },
      { name: "만족", votes: 118, color: "#34d399" },
      { name: "보통", votes: 41, color: "#fbbf24" },
      { name: "불만족", votes: 18, color: "#f87171" },
    ],
  },
};

const RECENT_VOTES = [
  { time: "14:31", name: "홍*동", choice: "별이 (포메라니안)" },
  { time: "14:30", name: "이*연", choice: "보리 (시바견)" },
  { time: "14:29", name: "김*수", choice: "하루 (말티즈)" },
  { time: "14:27", name: "박*희", choice: "별이 (포메라니안)" },
  { time: "14:26", name: "최*혁", choice: "코코 (푸들)" },
  { time: "14:24", name: "정*아", choice: "별이 (포메라니안)" },
];

const OPINION_DATA = [
  { label: "프로그램 구성", pct: 88, color: "#8b5cf6" },
  { label: "부스 운영", pct: 75, color: "#4f46e5" },
  { label: "음식/간식", pct: 92, color: "#10b981" },
  { label: "시설 환경", pct: 68, color: "#f59e0b" },
  { label: "전반적 만족", pct: 84, color: "#ef4444" },
];

/* ── Animated stat card ── */
function AnimStatCard({ label, rawValue, suffix, icon, bg, index }) {
  const count = useCountUp(rawValue, 1000, index * 120);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100 + 50);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <div className={`vt-stat-card anim-pop ${visible ? "visible" : ""}`}>
      <div className="vt-stat-icon" style={{ background: bg }}>
        {icon}
      </div>
      <div>
        <div className="vt-stat-label">{label}</div>
        <div className="vt-stat-value">
          {count}
          {suffix}
        </div>
      </div>
    </div>
  );
}

/* ── Animated vote item ── */
function AnimVoteItem({ item, index, total, maxVotes, isLeading }) {
  const [barWidth, setBarWidth] = useState(0);
  const animVotes = useCountUp(item.votes, 900, index * 100 + 300);
  const pct = Math.round((item.votes / total) * 100);

  useEffect(() => {
    const t = setTimeout(
      () => setBarWidth((item.votes / maxVotes) * 100),
      index * 100 + 400,
    );
    return () => clearTimeout(t);
  }, [item.votes, maxVotes, index]);

  return (
    <div className={`vt-vote-item${isLeading ? " leading" : ""}`}>
      <div className="vt-vote-header">
        <div
          className={`vt-vote-rank${index === 0 ? " first" : index === 1 ? " second" : index === 2 ? " third" : ""}`}
        >
          {index + 1}
        </div>
        <span className="vt-vote-name">{item.name}</span>
        <span className="vt-vote-count">
          {index === 0 && <ChevronUp size={13} />}
          {animVotes.toLocaleString()}표
        </span>
        <span className="vt-vote-pct">{pct}%</span>
      </div>
      <div className="vt-bar-track">
        <div
          className="vt-bar-fill anim-progress-fill"
          style={{ width: `${barWidth}%`, background: item.color }}
        />
      </div>
    </div>
  );
}

/* ── Animated opinion bar ── */
function AnimOpinionItem({ o, index }) {
  const [width, setWidth] = useState(0);
  const animPct = useCountUp(o.pct, 800, index * 100 + 300);

  useEffect(() => {
    const t = setTimeout(() => setWidth(o.pct), index * 100 + 300);
    return () => clearTimeout(t);
  }, [o.pct, index]);

  return (
    <div className="vt-opinion-item">
      <div className="vt-opinion-bar-wrap">
        <div className="vt-opinion-label">{o.label}</div>
        <div className="vt-opinion-track">
          <div
            className="vt-opinion-fill anim-progress-fill"
            style={{ width: `${width}%`, background: o.color }}
          />
        </div>
      </div>
      <span className="vt-opinion-val">{animPct}%</span>
    </div>
  );
}

function VoteContent({ onNavigate }) {
  const [activeVote, setActiveVote] = useState("best");
  const { tick, lastUpdated } = useAutoRefresh(5000);
  const { spinning, refresh } = useRefresh(() => {}, 800);
  const historyVisible = useStaggerIn(RECENT_VOTES.length, 80);
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [tick]);

  const [tabKey, setTabKey] = useState(0);
  const handleTabSwitch = (key) => {
    setActiveVote(key);
    setTabKey((k) => k + 1);
  };

  const data = VOTES[activeVote];
  const maxVotes = data.items[0].votes;

  return (
    <>
      {/* Live header */}
      <div className="vt-live-header">
        <div className="rt-live-badge anim-glow">
          <div className="rt-live-dot" />
          LIVE 모니터링
        </div>
        <div className="vt-live-header-right">
          <span key={flashKey} className="vt-timestamp anim-flash">
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
              fontFamily: "inherit",
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

      {/* CTA: 투표 참여하러 가기 */}
      <div
        className="vt-cta-banner"
        onClick={() => onNavigate?.("/program/contest")}
      >
        <div className="vt-cta-left">
          <div className="vt-cta-icon">
            <Vote size={18} color="#fff" />
          </div>
          <div>
            <div className="vt-cta-text">투표에 참여하고 싶으신가요?</div>
            <div className="vt-cta-sub">
              콘테스트 안내 페이지에서 바로 투표하세요
            </div>
          </div>
        </div>
        <ArrowRight size={18} className="vt-cta-arrow" />
      </div>

      {/* Stats */}
      <div className="vt-stat-grid">
        {[
          {
            label: "총 투표 참여",
            rawValue: 512,
            suffix: "명",
            icon: <Vote size={20} color="#8b5cf6" />,
            bg: "#f5f3ff",
          },
          {
            label: "진행 중 투표",
            rawValue: 2,
            suffix: "건",
            icon: <BarChart2 size={20} color="#4f46e5" />,
            bg: "#eef2ff",
          },
          {
            label: "완료된 투표",
            rawValue: 1,
            suffix: "건",
            icon: <CheckCircle2 size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
        ].map((s, i) => (
          <AnimStatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* Tabs */}
      <div className="vt-tabs">
        {Object.entries(VOTES).map(([key, v]) => (
          <button
            key={key}
            className={`vt-tab${activeVote === key ? " active" : ""}`}
            onClick={() => handleTabSwitch(key)}
          >
            {v.title}
            <span className="vt-tab-badge">{v.status}</span>
          </button>
        ))}
      </div>

      <div className="vt-two-col">
        {/* Vote results */}
        <div className="vt-card" key={`vote-${tabKey}`}>
          <div className="vt-card-header">
            <div className="vt-card-title">
              <div
                className="vt-card-title-icon"
                style={{ background: "#f5f0ff" }}
              >
                <Trophy size={14} color="#7c3aed" />
              </div>
              {data.title}
            </div>
            <span className="vt-card-tag">
              총 {data.total.toLocaleString()}표
            </span>
          </div>
          <div className="vt-vote-list">
            {data.items.map((item, i) => (
              <AnimVoteItem
                key={item.name}
                item={item}
                index={i}
                total={data.total}
                maxVotes={maxVotes}
                isLeading={i === 0}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Opinion scores */}
          <div className="vt-card">
            <div className="vt-card-header">
              <div className="vt-card-title">
                <div
                  className="vt-card-title-icon"
                  style={{ background: "#f5f0ff" }}
                >
                  <PieChart size={14} color="#7c3aed" />
                </div>
                항목별 만족도
              </div>
              <span className="vt-card-tag">평균 점수</span>
            </div>
            <div className="vt-opinion-list">
              {OPINION_DATA.map((o, i) => (
                <AnimOpinionItem key={o.label} o={o} index={i} />
              ))}
            </div>
          </div>

          {/* Recent votes */}
          <div className="vt-card">
            <div className="vt-card-header">
              <div className="vt-card-title">
                <div
                  className="vt-card-title-icon"
                  style={{ background: "#f5f0ff" }}
                >
                  <Clock size={14} color="#7c3aed" />
                </div>
                최근 투표 로그
              </div>
            </div>
            <div className="vt-history-list">
              {RECENT_VOTES.map((v, i) => (
                <div
                  key={i}
                  className={`vt-history-item anim-slide-right ${historyVisible.includes(i) ? "visible" : ""}`}
                >
                  <div className="vt-history-dot" />
                  <span className="vt-history-time">{v.time}</span>
                  <span className="vt-history-name">{v.name}님이</span>
                  <span className="vt-history-choice">{v.choice}</span>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>선택</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VoteStatus({ onNavigate: onNavigateProp }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const currentPath = "/realtime/votestatus";

  const handleSelectEvent = (id) => {
    navigate(`/realtime/votestatus/${id}`);
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
    <div className="vt-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      <PageHeader
        title="투표 현황"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
      <main className="vt-container">
        {eventId ? (
          <VoteContent onNavigate={handleNavigate} />
        ) : (
          <RealtimeEventSelector
            onSelectEvent={handleSelectEvent}
            pageTitle="투표 현황"
          />
        )}
      </main>
    </div>
  );
}
