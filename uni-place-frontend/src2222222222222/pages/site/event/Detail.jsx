import PageHeader from "../components/PageHeader";
import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  Mic,
  Coffee,
  BookOpen,
  Star,
  ExternalLink,
  Download,
  Share2,
  Info,
} from "lucide-react";

export const SERVICE_CATEGORIES = [
  { label: "현재 진행 행사", path: "/event/current" },
  { label: "예정 행사", path: "/event/upcoming" },
  { label: "종료 행사", path: "/event/closed" },
  { label: "행사 사전 등록", path: "/event/preregister" },
  { label: "행사 일정 안내", path: "/event/eventschedule" },
];

export const SUBTITLE_MAP = {
  "/event/current": "현재 진행 중인 행사 목록을 확인합니다",
  "/event/upcoming": "예정된 행사 일정을 확인합니다",
  "/event/closed": "종료된 행사 목록을 확인합니다",
  "/event/preregister": "행사 사전 등록을 진행합니다",
  "/event/eventschedule": "행사 일정을 안내합니다",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .dt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .dt-root *, .dt-root *::before, .dt-root *::after { box-sizing: border-box; font-family: inherit; }

  .dt-header { background: #fff; border-bottom: 1px solid #e9ecef; padding: 0 32px; }
  .dt-header-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between; height: 64px;
  }
  .dt-header-title { font-size: 17px; font-weight: 800; color: #111827; }
  .dt-header-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }
  .dt-nav { display: flex; gap: 4px; }
  .dt-nav-btn {
    height: 34px; padding: 0 14px; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #6b7280; background: transparent;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .dt-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .dt-nav-btn.active { background: #1a4fd6; color: #fff; font-weight: 600; }

  .dt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* Event picker */
  .dt-event-tabs { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
  .dt-event-tab {
    padding: 10px 20px; border: 1px solid #e2e8f0; border-radius: 10px;
    background: #fff; cursor: pointer; transition: all 0.15s; text-align: left;
  }
  .dt-event-tab:hover { border-color: #1a4fd6; }
  .dt-event-tab.active { border-color: #1a4fd6; background: #eff4ff; }
  .dt-event-tab-name { font-size: 13px; font-weight: 700; color: #111827; }
  .dt-event-tab.active .dt-event-tab-name { color: #1a4fd6; }
  .dt-event-tab-date { font-size: 11px; color: #9ca3af; margin-top: 2px; }

  /* Hero banner */
  .dt-hero {
    border-radius: 16px; padding: 32px 36px; margin-bottom: 20px;
    display: flex; align-items: flex-end; justify-content: space-between;
    color: #fff; position: relative; overflow: hidden; min-height: 180px;
  }
  .dt-hero-content { position: relative; z-index: 1; }
  .dt-hero-category { font-size: 12px; font-weight: 600; opacity: 0.8; margin-bottom: 8px; }
  .dt-hero-title { font-size: 26px; font-weight: 800; margin-bottom: 12px; line-height: 1.25; }
  .dt-hero-meta { display: flex; gap: 20px; flex-wrap: wrap; }
  .dt-hero-meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; opacity: 0.9; }
  .dt-hero-actions { display: flex; gap: 8px; flex-shrink: 0; position: relative; z-index: 1; align-self: flex-start; }
  .dt-hero-btn {
    height: 36px; padding: 0 16px; border-radius: 8px; font-size: 12.5px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit;
    transition: all 0.15s; white-space: nowrap;
  }
  .dt-hero-btn.white { background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); }
  .dt-hero-btn.white:hover { background: rgba(255,255,255,0.35); }
  .dt-hero-btn.solid { background: #fff; color: #1a4fd6; border: none; font-weight: 700; }
  .dt-hero-btn.solid:hover { opacity: 0.92; }

  /* Layout */
  .dt-layout { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }

  /* Card */
  .dt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .dt-card:last-child { margin-bottom: 0; }
  .dt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .dt-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; }
  .dt-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #eff4ff; display: flex; align-items: center; justify-content: center; }

  /* Schedule timeline */
  .dt-timeline { display: flex; flex-direction: column; }
  .dt-tl-item {
    display: flex; gap: 16px; padding: 14px 0;
    border-bottom: 1px solid #f1f3f5; cursor: pointer;
  }
  .dt-tl-item:last-child { border-bottom: none; }
  .dt-tl-item:hover .dt-tl-title { color: #1a4fd6; }
  .dt-tl-time { flex-shrink: 0; width: 80px; font-size: 12px; font-weight: 600; color: #9ca3af; padding-top: 2px; }
  .dt-tl-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; }
  .dt-tl-body { flex: 1; min-width: 0; }
  .dt-tl-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 3px; transition: color 0.15s; }
  .dt-tl-speaker { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .dt-tl-tags { display: flex; gap: 5px; flex-wrap: wrap; }
  .dt-tl-tag { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
  .dt-tl-chevron { flex-shrink: 0; color: #d1d5db; margin-top: 2px; transition: transform 0.15s; }
  .dt-tl-chevron.open { transform: rotate(180deg); }
  .dt-tl-expand { padding: 12px 0 4px 24px; font-size: 13px; color: #6b7280; line-height: 1.6; }

  /* Speakers */
  .dt-speaker-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .dt-speaker-card {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 14px; border: 1px solid #f1f3f5; border-radius: 10px;
  }
  .dt-speaker-avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700;
  }
  .dt-speaker-name { font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 2px; }
  .dt-speaker-title { font-size: 11.5px; color: #6b7280; }
  .dt-speaker-org { font-size: 11px; color: #9ca3af; margin-top: 2px; }

  /* Right info */
  .dt-info-row { padding: 12px 0; border-bottom: 1px solid #f1f3f5; display: flex; gap: 12px; align-items: flex-start; }
  .dt-info-row:last-child { border-bottom: none; }
  .dt-info-icon { color: #9ca3af; flex-shrink: 0; margin-top: 1px; }
  .dt-info-label { font-size: 11.5px; color: #9ca3af; margin-bottom: 3px; }
  .dt-info-val { font-size: 13px; font-weight: 600; color: #111827; line-height: 1.4; }

  .dt-cta-btn {
    width: 100%; height: 46px; border: none; border-radius: 10px;
    background: #1a4fd6; color: #fff; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: inherit; display: flex; align-items: center;
    justify-content: center; gap: 8px; margin-top: 20px; transition: background 0.15s;
  }
  .dt-cta-btn:hover { background: #1640b0; }
  .dt-map-thumb {
    width: 100%; height: 120px; background: linear-gradient(135deg, #e8edf5 0%, #d1dae9 100%);
    border-radius: 10px; margin-top: 16px; display: flex; align-items: center;
    justify-content: center; color: #6b7280; font-size: 13px; font-weight: 600; gap: 6px;
    border: 1px solid #e2e8f0;
  }

  @media (max-width: 1000px) {
    .dt-layout { grid-template-columns: 1fr; }
    .dt-hero { flex-direction: column; gap: 16px; }
    .dt-speaker-grid { grid-template-columns: 1fr; }
  }
`;

const NAV_ITEMS = [
  { label: "현재 진행 행사", path: "/event/current" },
  { label: "예정 행사", path: "/event/upcoming" },
  { label: "종료 행사", path: "/event/closed" },
  { label: "행사 사전 등록", path: "/event/preregister" },
  { label: "행사 일정 안내", path: "/event/eventschedule" },
];

const EVENTS = [
  {
    id: 1,
    category: "컨퍼런스",
    title: "2026 클라우드 테크 서밋",
    date: "2026.03.05",
    time: "09:00 ~ 17:30",
    location: "코엑스 컨벤션홀 A·B동, 서울 강남구",
    capacity: 1200,
    registered: 748,
    gradient: "linear-gradient(135deg, #1a4fd6 0%, #6366f1 100%)",
    organizer: "한국클라우드산업협회",
    contact: "summit@kcca.or.kr",
    website: "https://cloudtech2026.kr",
    schedule: [
      {
        time: "09:00",
        title: "등록 및 입장",
        speaker: "",
        type: "break",
        color: "#9ca3af",
        desc: "사전 등록 확인 후 네임택 수령 및 행사장 입장.",
      },
      {
        time: "10:00",
        title: "개막식 및 키노트",
        speaker: "이승현 회장 · 한국클라우드산업협회",
        type: "keynote",
        color: "#1a4fd6",
        desc: "2026 클라우드 시장 전망과 국내외 동향을 발표합니다.",
      },
      {
        time: "11:00",
        title: "멀티 클라우드 전략 설계",
        speaker: "박민준 부사장 · AWS Korea",
        type: "talk",
        color: "#7c3aed",
        desc: "엔터프라이즈 환경에서의 멀티 클라우드 아키텍처 구성 전략을 소개합니다.",
      },
      {
        time: "12:00",
        title: "네트워킹 런치",
        speaker: "",
        type: "break",
        color: "#9ca3af",
        desc: "참가자 간 자유 네트워킹 시간입니다. 도시락이 제공됩니다.",
      },
      {
        time: "13:30",
        title: "AI-Native 클라우드 인프라",
        speaker: "최유진 CTO · NHN Cloud",
        type: "talk",
        color: "#7c3aed",
        desc: "생성 AI 워크로드를 위한 클라우드 인프라 최적화 방법론을 공유합니다.",
      },
      {
        time: "15:00",
        title: "보안·컴플라이언스 패널 토론",
        speaker: "4인 패널",
        type: "panel",
        color: "#059669",
        desc: "클라우드 보안 규제 대응 및 제로트러스트 도입 사례를 논의합니다.",
      },
      {
        time: "16:30",
        title: "클로징 세션 & 경품 추첨",
        speaker: "",
        type: "break",
        color: "#f59e0b",
        desc: "행사 마무리 및 협찬사 경품 추첨이 진행됩니다.",
      },
    ],
    speakers: [
      {
        name: "이승현",
        title: "회장",
        org: "한국클라우드산업협회",
        emoji: "👤",
        bg: "#eff4ff",
        color: "#1a4fd6",
      },
      {
        name: "박민준",
        title: "부사장",
        org: "AWS Korea",
        emoji: "☁️",
        bg: "#f5f3ff",
        color: "#7c3aed",
      },
      {
        name: "최유진",
        title: "CTO",
        org: "NHN Cloud",
        emoji: "⚡",
        bg: "#ecfdf5",
        color: "#059669",
      },
      {
        name: "김지수",
        title: "이사",
        org: "Microsoft Azure",
        emoji: "🔷",
        bg: "#fff7ed",
        color: "#d97706",
      },
    ],
  },
  {
    id: 2,
    category: "워크샵",
    title: "AI & 머신러닝 실전 워크샵",
    date: "2026.03.08",
    time: "14:00 ~ 18:00",
    location: "강남 D.CAMP 4층, 서울",
    capacity: 80,
    registered: 62,
    gradient: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
    organizer: "D.CAMP × 모두의연구소",
    contact: "workshop@dcamp.kr",
    website: "https://dcamp.kr",
    schedule: [
      {
        time: "14:00",
        title: "환경 설정 및 오리엔테이션",
        speaker: "",
        type: "break",
        color: "#9ca3af",
        desc: "Python 환경 및 Colab 세팅을 함께 진행합니다.",
      },
      {
        time: "14:30",
        title: "머신러닝 기초 실습",
        speaker: "홍나래 연구원 · 모두의연구소",
        type: "talk",
        color: "#7c3aed",
        desc: "scikit-learn을 이용한 분류 모델 구축 실습.",
      },
      {
        time: "16:00",
        title: "딥러닝 모델 파인튜닝",
        speaker: "강현우 박사 · KAIST",
        type: "talk",
        color: "#ec4899",
        desc: "허깅페이스 트랜스포머를 활용한 파인튜닝 실습.",
      },
      {
        time: "17:30",
        title: "Q&A 및 마무리",
        speaker: "",
        type: "break",
        color: "#9ca3af",
        desc: "자유 질의응답 시간입니다.",
      },
    ],
    speakers: [
      {
        name: "홍나래",
        title: "연구원",
        org: "모두의연구소",
        emoji: "🔬",
        bg: "#f5f3ff",
        color: "#7c3aed",
      },
      {
        name: "강현우",
        title: "박사",
        org: "KAIST AI 연구소",
        emoji: "🎓",
        bg: "#fdf2f8",
        color: "#db2777",
      },
    ],
  },
];

const TYPE_ICONS = {
  keynote: <Star size={11} />,
  talk: <Mic size={11} />,
  break: <Coffee size={11} />,
  panel: <Users size={11} />,
};

const TYPE_LABELS = {
  keynote: "키노트",
  talk: "발표",
  break: "휴식/식사",
  panel: "패널",
};

export default function Detail() {
  const [selectedId, setSelectedId] = useState(1);
  const [expanded, setExpanded] = useState({});
  const [currentPath, setCurrentPath] = useState("/event/schedule");

  const ev = EVENTS.find((e) => e.id === selectedId);
  const pct = ev ? Math.round((ev.registered / ev.capacity) * 100) : 0;

  const toggleExpand = (i) => setExpanded((s) => ({ ...s, [i]: !s[i] }));

  return (
    <div className="dt-root">
      <style>{styles}</style>
      <PageHeader
        title="행사 일정 안내"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main className="dt-container">
        {/* Event tabs */}
        <div className="dt-event-tabs">
          {EVENTS.map((e) => (
            <div
              key={e.id}
              className={`dt-event-tab${selectedId === e.id ? " active" : ""}`}
              onClick={() => setSelectedId(e.id)}
            >
              <div className="dt-event-tab-name">{e.title}</div>
              <div className="dt-event-tab-date">
                {e.date} · {e.category}
              </div>
            </div>
          ))}
        </div>

        {/* Hero */}
        <div className="dt-hero" style={{ background: ev.gradient }}>
          <div className="dt-hero-content">
            <div className="dt-hero-category">{ev.category}</div>
            <div className="dt-hero-title">{ev.title}</div>
            <div className="dt-hero-meta">
              <div className="dt-hero-meta-item">
                <Calendar size={13} />
                {ev.date}
              </div>
              <div className="dt-hero-meta-item">
                <Clock size={13} />
                {ev.time}
              </div>
              <div className="dt-hero-meta-item">
                <MapPin size={13} />
                {ev.location}
              </div>
              <div className="dt-hero-meta-item">
                <Users size={13} />
                {ev.registered.toLocaleString()} /{" "}
                {ev.capacity.toLocaleString()}명
              </div>
            </div>
          </div>
          <div className="dt-hero-actions">
            <button className="dt-hero-btn white">
              <Share2 size={13} />
              공유
            </button>
            <button className="dt-hero-btn white">
              <Download size={13} />
              자료
            </button>
            <button className="dt-hero-btn solid">
              <ExternalLink size={13} />
              공식 사이트
            </button>
          </div>
        </div>

        <div className="dt-layout">
          <div>
            {/* Schedule */}
            <div className="dt-card">
              <div className="dt-card-header">
                <div className="dt-card-title">
                  <div className="dt-card-title-icon">
                    <CalendarDays size={14} color="#1a4fd6" />
                  </div>
                  세부 일정
                </div>
              </div>
              <div className="dt-timeline">
                {ev.schedule.map((s, i) => (
                  <div key={i}>
                    <div
                      className="dt-tl-item"
                      onClick={() => s.desc && toggleExpand(i)}
                    >
                      <div className="dt-tl-time">{s.time}</div>
                      <div
                        className="dt-tl-dot"
                        style={{ background: s.color }}
                      />
                      <div className="dt-tl-body">
                        <div className="dt-tl-title">{s.title}</div>
                        {s.speaker && (
                          <div className="dt-tl-speaker">{s.speaker}</div>
                        )}
                        <div className="dt-tl-tags">
                          <span
                            className="dt-tl-tag"
                            style={{
                              background: s.color + "22",
                              color: s.color,
                            }}
                          >
                            {TYPE_ICONS[s.type]} {TYPE_LABELS[s.type]}
                          </span>
                        </div>
                      </div>
                      {s.desc && (
                        <div
                          className={`dt-tl-chevron${expanded[i] ? " open" : ""}`}
                        >
                          {expanded[i] ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </div>
                      )}
                    </div>
                    {expanded[i] && s.desc && (
                      <div className="dt-tl-expand">{s.desc}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Speakers */}
            <div className="dt-card">
              <div className="dt-card-header">
                <div className="dt-card-title">
                  <div className="dt-card-title-icon">
                    <Mic size={14} color="#1a4fd6" />
                  </div>
                  연사 소개
                </div>
              </div>
              <div className="dt-speaker-grid">
                {ev.speakers.map((sp, i) => (
                  <div key={i} className="dt-speaker-card">
                    <div
                      className="dt-speaker-avatar"
                      style={{ background: sp.bg, color: sp.color }}
                    >
                      {sp.emoji}
                    </div>
                    <div>
                      <div className="dt-speaker-name">{sp.name}</div>
                      <div className="dt-speaker-title">{sp.title}</div>
                      <div className="dt-speaker-org">{sp.org}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div>
            <div className="dt-card">
              <div className="dt-card-header">
                <div className="dt-card-title">
                  <div className="dt-card-title-icon">
                    <Info size={14} color="#1a4fd6" />
                  </div>
                  행사 정보
                </div>
              </div>
              {[
                {
                  icon: <CalendarDays size={15} />,
                  label: "날짜",
                  val: ev.date,
                },
                { icon: <Clock size={15} />, label: "시간", val: ev.time },
                { icon: <MapPin size={15} />, label: "장소", val: ev.location },
                {
                  icon: <Users size={15} />,
                  label: "정원",
                  val: `${ev.capacity.toLocaleString()}명 (등록 ${pct}%)`,
                },
                {
                  icon: <BookOpen size={15} />,
                  label: "주최",
                  val: ev.organizer,
                },
              ].map((r, i) => (
                <div key={i} className="dt-info-row">
                  <div className="dt-info-icon">{r.icon}</div>
                  <div>
                    <div className="dt-info-label">{r.label}</div>
                    <div className="dt-info-val">{r.val}</div>
                  </div>
                </div>
              ))}
              <div className="dt-map-thumb">
                <MapPin size={16} />
                {ev.location.split(",")[0]}
              </div>
              <button className="dt-cta-btn">
                <BookOpen size={16} />
                사전 등록하기
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
