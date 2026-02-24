import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EventSelectPage from "../components/EventSelectPage";
import {
  SERVICE_CATEGORIES,
  SUBTITLE_MAP,
  SAMPLE_EVENTS,
} from "../constants/programConstants";
import {
  Store,
  MapPin,
  Users,
  Star,
  Clock,
  Eye,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Heart,
} from "lucide-react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .bt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .bt-root *, .bt-root *::before, .bt-root *::after { box-sizing: border-box; font-family: inherit; }
  .bt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .bt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .bt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: bt-pulse 1.4s ease-in-out infinite;
  }
  @keyframes bt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* Stat grid */
  .bt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .bt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px;
    display: flex; align-items: center; gap: 14px;
  }
  .bt-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .bt-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .bt-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  /* Card */
  .bt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .bt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .bt-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .bt-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .bt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  /* Layout */
  .bt-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* Booth card */
  .bt-booth-list { display: flex; flex-direction: column; gap: 10px; }
  .bt-booth-item {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 18px; border: 1px solid #e9ecef; border-radius: 10px;
    background: #fff; transition: all 0.15s; cursor: pointer;
  }
  .bt-booth-item:hover { border-color: #1a4fd6; background: #f8faff; }
  .bt-booth-item.popular { border-color: #fbbf24; background: #fffdf5; }
  .bt-booth-icon {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .bt-booth-info { flex: 1; }
  .bt-booth-name { font-size: 14px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 6px; }
  .bt-booth-sub { font-size: 12px; color: #9ca3af; margin-top: 3px; display: flex; align-items: center; gap: 10px; }
  .bt-booth-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
  }
  .bt-booth-badge.open { background: #ecfdf5; color: #059669; }
  .bt-booth-badge.closed { background: #f3f4f6; color: #9ca3af; }
  .bt-booth-badge.full { background: #fff0f0; color: #ef4444; }
  .bt-booth-arrow { color: #d1d5db; flex-shrink: 0; }

  /* Floor map placeholder */
  .bt-floor-map {
    width: 100%; aspect-ratio: 16/10; background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
    border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; color: #6b7280; border: 2px dashed #d1d5db;
  }
  .bt-floor-map-text { font-size: 13px; font-weight: 600; }

  /* Popular ranking */
  .bt-rank-list { display: flex; flex-direction: column; gap: 8px; }
  .bt-rank-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px;
    border-radius: 8px; background: #fafbfc;
  }
  .bt-rank-num {
    width: 28px; height: 28px; border-radius: 8px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #6b7280; flex-shrink: 0;
  }
  .bt-rank-num.top { background: #fef3c7; color: #d97706; }
  .bt-rank-name { flex: 1; font-size: 13px; font-weight: 600; color: #111827; }
  .bt-rank-visitors { font-size: 12px; color: #9ca3af; font-weight: 500; }
  .bt-rank-bar-bg { flex: 1; height: 6px; background: #f1f3f5; border-radius: 3px; overflow: hidden; margin-left: 8px; }
  .bt-rank-bar { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #1a4fd6, #3b82f6); }

  @media (max-width: 900px) {
    .bt-main-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .bt-container { padding: 20px 16px 48px; }
    .bt-stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;

const BOOTH_DATA = [
  {
    name: "멍멍이 간식 체험",
    zone: "A-01",
    visitors: 128,
    capacity: 20,
    status: "open",
    bg: "#eff4ff",
    color: "#1a4fd6",
    popular: true,
  },
  {
    name: "반려견 건강 상담",
    zone: "A-02",
    visitors: 95,
    capacity: 15,
    status: "open",
    bg: "#ecfdf5",
    color: "#10b981",
    popular: true,
  },
  {
    name: "펫 포토 스튜디오",
    zone: "A-03",
    visitors: 87,
    capacity: 10,
    status: "full",
    bg: "#fef3c7",
    color: "#d97706",
    popular: false,
  },
  {
    name: "수제 사료 시식",
    zone: "B-01",
    visitors: 72,
    capacity: 20,
    status: "open",
    bg: "#fce7f3",
    color: "#ec4899",
    popular: false,
  },
  {
    name: "반려동물 미용 시연",
    zone: "B-02",
    visitors: 65,
    capacity: 8,
    status: "full",
    bg: "#f5f3ff",
    color: "#8b5cf6",
    popular: false,
  },
  {
    name: "펫 용품 할인관",
    zone: "C-01",
    visitors: 110,
    capacity: 30,
    status: "open",
    bg: "#fff7ed",
    color: "#f59e0b",
    popular: true,
  },
  {
    name: "입양 상담 부스",
    zone: "C-02",
    visitors: 43,
    capacity: 10,
    status: "open",
    bg: "#f0fdf4",
    color: "#16a34a",
    popular: false,
  },
  {
    name: "동물 행동학 강연",
    zone: "D-01",
    visitors: 38,
    capacity: 50,
    status: "closed",
    bg: "#f1f5f9",
    color: "#64748b",
    popular: false,
  },
];

const TOP_BOOTHS = [
  { name: "멍멍이 간식 체험", visitors: 128 },
  { name: "펫 용품 할인관", visitors: 110 },
  { name: "반려견 건강 상담", visitors: 95 },
  { name: "펫 포토 스튜디오", visitors: 87 },
  { name: "수제 사료 시식", visitors: 72 },
];

const STATUS_LABEL = { open: "운영 중", closed: "운영 종료", full: "만석" };
const maxVisitors = Math.max(...TOP_BOOTHS.map((b) => b.visitors));

function BoothContent() {
  return (
    <>
      <div className="bt-live-badge">
        <div className="bt-live-dot" />
        LIVE
      </div>

      <div className="bt-stat-grid">
        {[
          {
            label: "전체 부스",
            value: "24개",
            icon: <Store size={20} color="#1a4fd6" />,
            bg: "#eff4ff",
          },
          {
            label: "운영 중",
            value: "18개",
            icon: <Eye size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
          {
            label: "총 방문자",
            value: "638명",
            icon: <Users size={20} color="#f59e0b" />,
            bg: "#fffbeb",
          },
          {
            label: "인기 부스",
            value: "3곳",
            icon: <Star size={20} color="#ec4899" />,
            bg: "#fce7f3",
          },
        ].map((s) => (
          <div key={s.label} className="bt-stat-card">
            <div className="bt-stat-icon" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="bt-stat-label">{s.label}</div>
              <div className="bt-stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bt-main-grid">
        {/* Left: Booth list */}
        <div className="bt-card">
          <div className="bt-card-header">
            <div className="bt-card-title">
              <div className="bt-card-title-icon">
                <Store size={14} color="#f59e0b" />
              </div>
              부스 목록
            </div>
            <span className="bt-card-tag">총 {BOOTH_DATA.length}개</span>
          </div>
          <div className="bt-booth-list">
            {BOOTH_DATA.map((b) => (
              <div
                key={b.zone}
                className={`bt-booth-item${b.popular ? " popular" : ""}`}
              >
                <div className="bt-booth-icon" style={{ background: b.bg }}>
                  <Store size={20} color={b.color} />
                </div>
                <div className="bt-booth-info">
                  <div className="bt-booth-name">
                    {b.name}
                    {b.popular && (
                      <Heart size={12} color="#ef4444" fill="#ef4444" />
                    )}
                  </div>
                  <div className="bt-booth-sub">
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <MapPin size={11} /> {b.zone}
                    </span>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <Users size={11} /> {b.visitors}명 방문
                    </span>
                  </div>
                </div>
                <span className={`bt-booth-badge ${b.status}`}>
                  {STATUS_LABEL[b.status]}
                </span>
                <ChevronRight size={16} className="bt-booth-arrow" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Map + Ranking */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="bt-card">
            <div className="bt-card-header">
              <div className="bt-card-title">
                <div className="bt-card-title-icon">
                  <MapPin size={14} color="#f59e0b" />
                </div>
                부스 배치도
              </div>
              <span className="bt-card-tag">1층 전시관</span>
            </div>
            <div className="bt-floor-map">
              <MapPin size={32} color="#9ca3af" />
              <span className="bt-floor-map-text">부스 배치도 영역</span>
            </div>
          </div>

          <div className="bt-card">
            <div className="bt-card-header">
              <div className="bt-card-title">
                <div className="bt-card-title-icon">
                  <TrendingUp size={14} color="#f59e0b" />
                </div>
                인기 부스 TOP 5
              </div>
              <span className="bt-card-tag">방문자 기준</span>
            </div>
            <div className="bt-rank-list">
              {TOP_BOOTHS.map((b, i) => (
                <div key={b.name} className="bt-rank-item">
                  <div className={`bt-rank-num${i < 3 ? " top" : ""}`}>
                    {i + 1}
                  </div>
                  <span className="bt-rank-name">{b.name}</span>
                  <div className="bt-rank-bar-bg">
                    <div
                      className="bt-rank-bar"
                      style={{ width: `${(b.visitors / maxVisitors) * 100}%` }}
                    />
                  </div>
                  <span className="bt-rank-visitors">{b.visitors}명</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Booth() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const currentPath = "/program/booth";

  // eventId 없으면 → 행사 선택 화면
  if (!eventId) {
    return (
      <div className="bt-root">
        <style>{styles}</style>
        <PageHeader
          title="부스 안내"
          subtitle="행사를 선택해 부스 운영 현황을 확인하세요"
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
        />
        <EventSelectPage events={SAMPLE_EVENTS} basePath="/program/booth" />
      </div>
    );
  }

  // eventId 있으면 → 기존 부스 상세 화면
  return (
    <div className="bt-root">
      <style>{styles}</style>
      <PageHeader
        title="부스 안내"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
      />
      <main className="bt-container">
        <BoothContent />
      </main>
    </div>
  );
}
