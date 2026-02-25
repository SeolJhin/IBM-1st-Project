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
  Mic,
  Users,
  Clock,
  MapPin,
  BookOpen,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Star,
  MessageSquare,
  UserCircle,
  Video,
} from "lucide-react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ss-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .ss-root *, .ss-root *::before, .ss-root *::after { box-sizing: border-box; font-family: inherit; }
  .ss-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .ss-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .ss-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: ss-pulse 1.4s ease-in-out infinite;
  }
  @keyframes ss-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .ss-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .ss-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px;
    display: flex; align-items: center; gap: 14px;
  }
  .ss-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ss-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .ss-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .ss-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .ss-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .ss-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .ss-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .ss-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  /* Filter tabs */
  .ss-filter-bar { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
  .ss-filter-btn {
    padding: 7px 16px; border: 1px solid #e9ecef; border-radius: 100px;
    background: #fff; font-size: 12px; font-weight: 600; color: #6b7280;
    cursor: pointer; transition: all 0.15s; font-family: inherit;
  }
  .ss-filter-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .ss-filter-btn.active { background: #1a4fd6; border-color: #1a4fd6; color: #fff; }

  /* Session list */
  .ss-session-list { display: flex; flex-direction: column; gap: 12px; }
  .ss-session-item {
    display: flex; gap: 18px; padding: 20px 22px; border: 1px solid #e9ecef;
    border-radius: 12px; background: #fff; transition: all 0.15s; cursor: pointer;
  }
  .ss-session-item:hover { border-color: #1a4fd6; background: #f8faff; }
  .ss-session-item.live { border-color: #10b981; background: #f0fdf9; }
  .ss-session-time {
    width: 80px; flex-shrink: 0; text-align: center; padding-top: 2px;
  }
  .ss-session-time-main { font-size: 16px; font-weight: 800; color: #111827; }
  .ss-session-time-end { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .ss-session-divider { width: 3px; border-radius: 2px; flex-shrink: 0; }
  .ss-session-body { flex: 1; }
  .ss-session-name { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .ss-session-desc { font-size: 12.5px; color: #6b7280; line-height: 1.5; margin-bottom: 10px; }
  .ss-session-speaker { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .ss-speaker-avatar {
    width: 28px; height: 28px; border-radius: 50%; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
  }
  .ss-speaker-name { font-size: 12px; font-weight: 600; color: #111827; }
  .ss-speaker-role { font-size: 11px; color: #9ca3af; }
  .ss-session-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #9ca3af; }
  .ss-session-meta-item { display: flex; align-items: center; gap: 3px; }
  .ss-session-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .ss-session-badge {
    padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600;
  }
  .ss-session-badge.live { background: #ecfdf5; color: #059669; }
  .ss-session-badge.upcoming { background: #fff7ed; color: #d97706; }
  .ss-session-badge.done { background: #f3f4f6; color: #9ca3af; }
  .ss-session-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #f59e0b; font-weight: 600; }
  .ss-session-cap { font-size: 11px; color: #9ca3af; }

  .ss-tag-list { display: flex; gap: 5px; margin-top: 8px; }
  .ss-tag {
    font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 100px;
  }
  .ss-tag.health { background: #ecfdf5; color: #059669; }
  .ss-tag.training { background: #eff4ff; color: #1a4fd6; }
  .ss-tag.nutrition { background: #fef3c7; color: #d97706; }
  .ss-tag.behavior { background: #fce7f3; color: #ec4899; }
  .ss-tag.care { background: #f5f3ff; color: #8b5cf6; }

  @media (max-width: 640px) {
    .ss-container { padding: 20px 16px 48px; }
    .ss-stat-grid { grid-template-columns: 1fr 1fr; }
    .ss-session-item { flex-direction: column; gap: 10px; }
    .ss-session-time { width: auto; text-align: left; display: flex; gap: 6px; align-items: baseline; }
  }
`;

const FILTERS = ["전체", "건강", "훈련", "영양", "행동학", "케어"];

const SESSIONS = [
  {
    name: "반려동물 건강검진의 중요성",
    desc: "정기 건강검진의 필요성과 주요 검사 항목에 대해 알아봅니다",
    speaker: "김수의",
    role: "서울동물의료센터 원장",
    time: "10:00",
    endTime: "11:30",
    zone: "세미나실 A",
    people: 72,
    max: 80,
    rating: 4.9,
    tags: ["health"],
    status: "done",
    color: "#10b981",
  },
  {
    name: "올바른 사회화 훈련 방법",
    desc: "강아지 사회화 시기의 중요성과 효과적인 훈련 프로그램 소개",
    speaker: "박훈련",
    role: "반려동물 행동전문가",
    time: "11:00",
    endTime: "12:00",
    zone: "세미나실 B",
    people: 55,
    max: 60,
    rating: 4.7,
    tags: ["training", "behavior"],
    status: "done",
    color: "#1a4fd6",
  },
  {
    name: "수제 사료와 영양 균형",
    desc: "집에서 만드는 건강한 수제 사료 레시피와 필수 영양소 가이드",
    speaker: "이영양",
    role: "수의영양학 박사",
    time: "13:00",
    endTime: "14:30",
    zone: "세미나실 A",
    people: 48,
    max: 80,
    rating: null,
    tags: ["nutrition"],
    status: "live",
    color: "#f59e0b",
  },
  {
    name: "노견 케어 & 재활 운동",
    desc: "노령 반려동물의 건강 관리와 관절 재활 운동법",
    speaker: "최재활",
    role: "동물재활전문 수의사",
    time: "15:00",
    endTime: "16:30",
    zone: "세미나실 B",
    people: 0,
    max: 60,
    rating: null,
    tags: ["health", "care"],
    status: "upcoming",
    color: "#8b5cf6",
  },
  {
    name: "반려동물 분리불안 극복하기",
    desc: "분리불안의 원인을 이해하고 단계별 개선 방법을 배웁니다",
    speaker: "정행동",
    role: "동물행동학 교수",
    time: "16:00",
    endTime: "17:00",
    zone: "세미나실 A",
    people: 0,
    max: 80,
    rating: null,
    tags: ["behavior", "training"],
    status: "upcoming",
    color: "#ec4899",
  },
];

const TAG_MAP = {
  health: "건강",
  training: "훈련",
  nutrition: "영양",
  behavior: "행동학",
  care: "케어",
};
const STATUS_LABEL = { live: "진행 중", upcoming: "예정", done: "완료" };

function SessionContent() {
  const [filter, setFilter] = useState("전체");

  const filtered =
    filter === "전체"
      ? SESSIONS
      : SESSIONS.filter((s) => s.tags.some((t) => TAG_MAP[t] === filter));

  return (
    <>
      <div className="ss-live-badge">
        <div className="ss-live-dot" />
        LIVE
      </div>

      <div className="ss-stat-grid">
        {[
          {
            label: "전체 세션",
            value: "5개",
            icon: <Mic size={20} color="#1a4fd6" />,
            bg: "#eff4ff",
          },
          {
            label: "진행 중",
            value: "1개",
            icon: <PlayCircle size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
          {
            label: "총 참석자",
            value: "175명",
            icon: <Users size={20} color="#f59e0b" />,
            bg: "#fffbeb",
          },
          {
            label: "평균 평점",
            value: "4.8",
            icon: <Star size={20} color="#ec4899" />,
            bg: "#fce7f3",
          },
        ].map((s) => (
          <div key={s.label} className="ss-stat-card">
            <div className="ss-stat-icon" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="ss-stat-label">{s.label}</div>
              <div className="ss-stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="ss-card">
        <div className="ss-card-header">
          <div className="ss-card-title">
            <div className="ss-card-title-icon">
              <BookOpen size={14} color="#f59e0b" />
            </div>
            세션 ．강연
          </div>
          <span className="ss-card-tag">총 {SESSIONS.length}개</span>
        </div>

        <div className="ss-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`ss-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="ss-session-list">
          {filtered.map((s) => (
            <div
              key={s.name}
              className={`ss-session-item${s.status === "live" ? " live" : ""}`}
            >
              <div className="ss-session-time">
                <div className="ss-session-time-main">{s.time}</div>
                <div className="ss-session-time-end">~{s.endTime}</div>
              </div>
              <div
                className="ss-session-divider"
                style={{ background: s.color }}
              />
              <div className="ss-session-body">
                <div className="ss-session-name">{s.name}</div>
                <div className="ss-session-desc">{s.desc}</div>
                <div className="ss-session-speaker">
                  <div className="ss-speaker-avatar">
                    <UserCircle size={18} color="#9ca3af" />
                  </div>
                  <div>
                    <div className="ss-speaker-name">{s.speaker}</div>
                    <div className="ss-speaker-role">{s.role}</div>
                  </div>
                </div>
                <div className="ss-session-meta">
                  <span className="ss-session-meta-item">
                    <MapPin size={11} /> {s.zone}
                  </span>
                  <span className="ss-session-meta-item">
                    <Users size={11} /> {s.people}/{s.max}명
                  </span>
                  {s.status === "live" && (
                    <span className="ss-session-meta-item">
                      <Video size={11} /> 실시간 스트리밍
                    </span>
                  )}
                </div>
                <div className="ss-tag-list">
                  {s.tags.map((t) => (
                    <span key={t} className={`ss-tag ${t}`}>
                      {TAG_MAP[t]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ss-session-right">
                <span className={`ss-session-badge ${s.status}`}>
                  {STATUS_LABEL[s.status]}
                </span>
                {s.rating && (
                  <div className="ss-session-rating">
                    <Star size={12} fill="#f59e0b" /> {s.rating}
                  </div>
                )}
                <ChevronRight size={16} color="#d1d5db" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Session() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const currentPath = "/program/session";

  if (!eventId) {
    return (
      <div className="ss-root">
        <style>{styles}</style>
        <PageHeader
          title="세션 · 강연"
          subtitle="행사를 선택해 세션과 강연 일정을 확인하세요"
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
        />
        <EventSelectPage events={SAMPLE_EVENTS} basePath="/program/session" />
      </div>
    );
  }

  return (
    <div className="ss-root">
      <style>{styles}</style>
      <PageHeader
        title="세션 · 강연"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
      />
      <main className="ss-container">
        <SessionContent />
      </main>
    </div>
  );
}
