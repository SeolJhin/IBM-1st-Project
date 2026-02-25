import PageHeader from "../components/PageHeader";
import { useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  ChevronRight,
  Users,
  Mic,
  Coffee,
  BookOpen,
  Star,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Info,
  Megaphone,
  Layers,
  ArrowRight,
} from "lucide-react";

// ────────────────────────────────────────────────
// 공통 상수 (Location 페이지와 동일하게 유지)
// ────────────────────────────────────────────────
// ────────────────────────────────────────────────
// 일정 데이터
// ────────────────────────────────────────────────
const EVENT_DAYS = [
  {
    day: 1,
    date: "2026.04.12 (토)",
    label: "DAY 1",
    color: "#1a4fd6",
    bg: "#eff4ff",
    sessions: [
      {
        time: "09:00 – 10:00",
        duration: "60분",
        type: "등록",
        title: "참가자 등록 및 입장",
        desc: "현장 등록 데스크 운영. 사전 등록자 QR코드 지참 필수",
        icon: "checkin",
        highlight: false,
      },
      {
        time: "10:00 – 10:30",
        duration: "30분",
        type: "개회식",
        title: "개회식 및 환영사",
        desc: "주최사 대표 개회사, 주요 내빈 소개 및 행사 안내",
        icon: "flag",
        highlight: true,
      },
      {
        time: "10:30 – 12:00",
        duration: "90분",
        type: "기조강연",
        title: "기조강연 I – AI가 바꾸는 비즈니스 패러다임",
        desc: "2026년 AI 트렌드와 산업 전반에 걸친 변화 전망 발표",
        icon: "mic",
        highlight: true,
        speaker: "김민준 / 테크비전 CTO",
      },
      {
        time: "12:00 – 13:30",
        duration: "90분",
        type: "점심",
        title: "점심 식사 및 네트워킹",
        desc: "행사장 내 지정 식사 구역 운영. 참가자 간 자유 교류",
        icon: "coffee",
        highlight: false,
      },
      {
        time: "13:30 – 15:00",
        duration: "90분",
        type: "세션",
        title: "세션 A – 스타트업 투자 트렌드 2026",
        desc: "국내외 VC 패널 토론 및 투자 유치 전략 공유",
        icon: "session",
        highlight: false,
        speaker: "박서연, 이준혁, 최지현 / 패널리스트",
      },
      {
        time: "15:00 – 15:20",
        duration: "20분",
        type: "휴식",
        title: "휴식 시간",
        desc: "",
        icon: "coffee",
        highlight: false,
      },
      {
        time: "15:20 – 17:00",
        duration: "100분",
        type: "세션",
        title: "세션 B – 디지털 전환 성공 사례 발표",
        desc: "제조·유통·금융 업종별 DX 도입 사례 및 ROI 분석",
        icon: "session",
        highlight: false,
        speaker: "정유진 / 현장 전문가 3인",
      },
      {
        time: "17:00 – 18:00",
        duration: "60분",
        type: "네트워킹",
        title: "스타트업 피칭 & 네트워킹",
        desc: "선정된 스타트업 5팀 3분 피칭 후 자유 네트워킹",
        icon: "network",
        highlight: true,
      },
    ],
  },
  {
    day: 2,
    date: "2026.04.13 (일)",
    label: "DAY 2",
    color: "#7c3aed",
    bg: "#f5f3ff",
    sessions: [
      {
        time: "09:30 – 10:00",
        duration: "30분",
        type: "등록",
        title: "2일차 입장 및 안내",
        desc: "사전 등록 QR 또는 명찰 지참 후 입장",
        icon: "checkin",
        highlight: false,
      },
      {
        time: "10:00 – 11:30",
        duration: "90분",
        type: "기조강연",
        title: "기조강연 II – 글로벌 시장 진출 전략",
        desc: "동남아·북미 시장 진출 성공/실패 경험 공유 및 전략 제언",
        icon: "mic",
        highlight: true,
        speaker: "Sarah Kim / Global Ventures 파트너",
      },
      {
        time: "11:30 – 13:00",
        duration: "90분",
        type: "워크샵",
        title: "워크샵 – 린 스타트업 실전 방법론",
        desc: "팀별 실습 워크샵. 사전 신청자 한정 (50명). 노트북 지참 권장",
        icon: "session",
        highlight: false,
        speaker: "오태경 / 린캠퍼스 대표",
      },
      {
        time: "13:00 – 14:00",
        duration: "60분",
        type: "점심",
        title: "점심 식사",
        desc: "지정 케이터링 구역 이용",
        icon: "coffee",
        highlight: false,
      },
      {
        time: "14:00 – 15:30",
        duration: "90분",
        type: "세션",
        title: "세션 C – ESG 경영과 스타트업 생존 전략",
        desc: "지속가능 경영 실천 방법과 투자자 관점의 ESG 체크리스트",
        icon: "session",
        highlight: false,
        speaker: "한지수 / ESG연구원 수석연구위원",
      },
      {
        time: "15:30 – 15:50",
        duration: "20분",
        type: "휴식",
        title: "휴식 시간",
        desc: "",
        icon: "coffee",
        highlight: false,
      },
      {
        time: "15:50 – 17:20",
        duration: "90분",
        type: "세션",
        title: "세션 D – 핀테크 규제 샌드박스 활용법",
        desc: "금융위원회 담당자 직접 설명 및 Q&A",
        icon: "session",
        highlight: false,
        speaker: "금융위원회 혁신금융팀",
      },
      {
        time: "17:20 – 18:00",
        duration: "40분",
        type: "폐회식",
        title: "시상식 및 폐회식",
        desc: "우수 스타트업 시상, 폐회사 및 기념 촬영",
        icon: "flag",
        highlight: true,
      },
    ],
  },
];

const TYPE_STYLES = {
  등록: { color: "#374151", bg: "#f3f4f6" },
  개회식: { color: "#1a4fd6", bg: "#dbeafe" },
  기조강연: { color: "#7c3aed", bg: "#ede9fe" },
  점심: { color: "#059669", bg: "#d1fae5" },
  세션: { color: "#0369a1", bg: "#e0f2fe" },
  휴식: { color: "#9ca3af", bg: "#f3f4f6" },
  워크샵: { color: "#d97706", bg: "#fde68a" },
  네트워킹: { color: "#db2777", bg: "#fce7f3" },
  폐회식: { color: "#1a4fd6", bg: "#dbeafe" },
};

function SessionIcon({ type }) {
  const props = { size: 14 };
  if (type === "checkin") return <CheckCircle2 {...props} />;
  if (type === "flag") return <Flag {...props} />;
  if (type === "mic") return <Mic {...props} />;
  if (type === "coffee") return <Coffee {...props} />;
  if (type === "session") return <BookOpen {...props} />;
  if (type === "network") return <Users {...props} />;
  return <Star {...props} />;
}

// ────────────────────────────────────────────────
// PageHeader (인라인 구현 – Location과 동일한 구조)
// ────────────────────────────────────────────────

// ────────────────────────────────────────────────
// 스타일
// ────────────────────────────────────────────────
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

  .det-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc; min-height: 100vh;
  }
  .det-root *, .det-root *::before, .det-root *::after { box-sizing: border-box; font-family: inherit; }

  /* ── PageHeader (Location 동일) ── */
  .ph-header { background: #fff; border-bottom: 1px solid #e9ecef; padding: 0 32px; }
  .ph-header-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between; height: 64px;
  }
  .ph-header-left { display: flex; flex-direction: column; }
  .ph-header-title { font-size: 17px; font-weight: 800; color: #111827; }
  .ph-header-sub   { font-size: 12px; color: #9ca3af; margin-top: 1px; }
  .ph-nav { display: flex; gap: 4px; }
  .ph-nav-btn {
    height: 34px; padding: 0 14px; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #6b7280; background: transparent;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .ph-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .ph-nav-btn.active { background: #1a4fd6; color: #fff; font-weight: 600; }

  /* ── Container ── */
  .det-container { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }

  /* ── 요약 카드 그리드 ── */
  .det-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .det-summary-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 18px 20px; display: flex; align-items: center; gap: 13px;
  }
  .det-summary-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .det-summary-label { font-size: 11.5px; color: #6b7280; font-weight: 500; }
  .det-summary-value { font-size: 14px; font-weight: 800; color: #111827; margin-top: 2px; line-height: 1.4; }

  /* ── 탭 ── */
  .det-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
  .det-tab {
    height: 38px; padding: 0 18px; border-radius: 9px; border: 1px solid #e2e8f0;
    background: #fff; font-size: 13.5px; font-weight: 600; color: #6b7280;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
    display: flex; align-items: center; gap: 7px;
  }
  .det-tab:hover { border-color: #c7d2fe; color: #1a4fd6; }
  .det-tab.active { background: #1a4fd6; border-color: #1a4fd6; color: #fff; }
  .det-tab-dot { width: 8px; height: 8px; border-radius: 50%; }

  /* ── 섹션 헤더 ── */
  .det-section-header { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
  .det-section-icon { width: 28px; height: 28px; border-radius: 7px; background: #eff4ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .det-section-title { font-size: 15px; font-weight: 800; color: #111827; margin: 0; }

  /* ── 타임라인 ── */
  .det-timeline { position: relative; }
  .det-timeline-line {
    position: absolute; left: 78px; top: 0; bottom: 0;
    width: 2px; background: linear-gradient(to bottom, #dbeafe, #e0e7ff, #dbeafe);
    border-radius: 2px;
  }

  .det-session {
    display: flex; gap: 0; margin-bottom: 10px; position: relative;
  }

  /* 시간 레이블 */
  .det-session-time-col {
    width: 78px; flex-shrink: 0; padding-right: 18px;
    display: flex; flex-direction: column; align-items: flex-end;
    padding-top: 14px;
  }
  .det-session-time {
    font-size: 11.5px; font-weight: 700; color: #1a4fd6;
    white-space: nowrap; line-height: 1.3;
  }
  .det-session-dur {
    font-size: 10.5px; color: #9ca3af; margin-top: 2px;
  }

  /* 타임라인 점 */
  .det-session-dot-col {
    position: relative; width: 18px; flex-shrink: 0; display: flex; justify-content: center;
  }
  .det-session-dot {
    width: 10px; height: 10px; border-radius: 50%; border: 2px solid #1a4fd6;
    background: #fff; margin-top: 19px; flex-shrink: 0; z-index: 1;
  }
  .det-session.highlight .det-session-dot {
    background: #1a4fd6; border-color: #1a4fd6;
    box-shadow: 0 0 0 4px rgba(26,79,214,0.15);
  }

  /* 세션 카드 */
  .det-session-card {
    flex: 1; margin-left: 14px;
    background: #fff; border: 1px solid #e9ecef; border-radius: 12px;
    padding: 14px 16px; transition: box-shadow 0.15s;
  }
  .det-session-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .det-session.highlight .det-session-card {
    border-color: #c7d2fe; background: #fafbff;
  }
  .det-session.rest .det-session-card {
    background: #f9fafb; border-style: dashed;
  }

  .det-session-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .det-type-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 9px; border-radius: 100px;
    font-size: 11px; font-weight: 700;
  }
  .det-session-title { font-size: 14px; font-weight: 700; color: #111827; line-height: 1.45; }
  .det-session-desc  { font-size: 12.5px; color: #6b7280; margin-top: 5px; line-height: 1.55; }
  .det-session-speaker {
    display: inline-flex; align-items: center; gap: 5px;
    margin-top: 8px; padding: 3px 9px; border-radius: 6px;
    background: #f1f5f9; font-size: 12px; color: #374151; font-weight: 500;
  }

  /* ── 안내 공지 ── */
  .det-notice {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
    padding: 15px 20px; display: flex; gap: 12px; align-items: flex-start; margin-top: 24px;
  }
  .det-notice-icon { color: #d97706; flex-shrink: 0; margin-top: 1px; }
  .det-notice-title { font-size: 13px; font-weight: 700; color: #78350f; margin-bottom: 3px; }
  .det-notice-text  { font-size: 13px; color: #92400e; line-height: 1.65; }

  /* ── 범례 ── */
  .det-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
  .det-legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #6b7280; }
  .det-legend-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  @media (max-width: 768px) {
    .det-container { padding: 20px 16px 48px; }
    .det-summary-grid { grid-template-columns: 1fr 1fr; }
    .ph-nav { display: none; }
    .det-timeline-line { left: 64px; }
    .det-session-time-col { width: 64px; }
  }
  @media (max-width: 480px) {
    .det-summary-grid { grid-template-columns: 1fr; }
  }
`;

// ────────────────────────────────────────────────
// 메인 컴포넌트
// ────────────────────────────────────────────────
export default function EventDetail({ onNavigate }) {
  const [currentPath, setCurrentPath] = useState("/event/eventschedule");
  const [activeDay, setActiveDay] = useState(1);

  const currentDayData = EVENT_DAYS.find((d) => d.day === activeDay);

  return (
    <div className="det-root">
      <style>{styles}</style>

      <PageHeader
        title="행사 일정 안내"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main className="det-container">
        {/* ── 요약 카드 ── */}
        <div className="det-summary-grid">
          {[
            {
              label: "행사 기간",
              value: "2026.04.12 – 04.13",
              icon: <CalendarDays size={18} color="#1a4fd6" />,
              bg: "#eff4ff",
            },
            {
              label: "운영 시간",
              value: "오전 9:00 – 오후 6:00",
              icon: <Clock size={18} color="#059669" />,
              bg: "#ecfdf5",
            },
            {
              label: "장소",
              value: "올림픽공원 특설 행사장",
              icon: <MapPin size={18} color="#d97706" />,
              bg: "#fffbeb",
            },
          ].map((s) => (
            <div key={s.label} className="det-summary-card">
              <div className="det-summary-icon" style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div>
                <div className="det-summary-label">{s.label}</div>
                <div className="det-summary-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 섹션 헤더 ── */}
        <div className="det-section-header">
          <div className="det-section-icon">
            <Layers size={15} color="#1a4fd6" />
          </div>
          <h2 className="det-section-title">전체 일정</h2>
        </div>

        {/* ── 일차 탭 ── */}
        <div className="det-tabs">
          {EVENT_DAYS.map((d) => (
            <button
              key={d.day}
              className={`det-tab${activeDay === d.day ? " active" : ""}`}
              onClick={() => setActiveDay(d.day)}
            >
              <div
                className="det-tab-dot"
                style={{
                  background:
                    activeDay === d.day ? "rgba(255,255,255,0.7)" : d.color,
                }}
              />
              {d.label} · {d.date}
            </button>
          ))}
        </div>

        {/* ── 범례 ── */}
        <div className="det-legend">
          {Object.entries(TYPE_STYLES)
            .filter(([k]) =>
              [
                "기조강연",
                "세션",
                "워크샵",
                "네트워킹",
                "점심",
                "휴식",
              ].includes(k),
            )
            .map(([type, s]) => (
              <div key={type} className="det-legend-item">
                <div
                  className="det-legend-dot"
                  style={{ background: s.color }}
                />
                {type}
              </div>
            ))}
        </div>

        {/* ── 타임라인 ── */}
        <div className="det-timeline">
          <div className="det-timeline-line" />
          {currentDayData.sessions.map((s, i) => {
            const ts = TYPE_STYLES[s.type] ?? {
              color: "#374151",
              bg: "#f3f4f6",
            };
            const isRest = s.type === "휴식";
            return (
              <div
                key={i}
                className={`det-session${s.highlight ? " highlight" : ""}${isRest ? " rest" : ""}`}
              >
                {/* 시간 */}
                <div className="det-session-time-col">
                  <div className="det-session-time">
                    {s.time.split(" – ").map((t, j) => (
                      <span key={j} style={{ display: "block" }}>
                        {t}
                        {j === 0 && (
                          <span
                            style={{
                              display: "block",
                              color: "#c7d2fe",
                              fontSize: 9,
                            }}
                          >
                            ▼
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="det-session-dur">{s.duration}</div>
                </div>

                {/* 점 */}
                <div className="det-session-dot-col">
                  <div className="det-session-dot" />
                </div>

                {/* 카드 */}
                <div className="det-session-card">
                  <div className="det-session-card-top">
                    <div
                      className="det-type-badge"
                      style={{ color: ts.color, background: ts.bg }}
                    >
                      <SessionIcon type={s.icon} />
                      {s.type}
                    </div>
                  </div>
                  {!isRest && (
                    <>
                      <div className="det-session-title">{s.title}</div>
                      {s.desc && (
                        <div className="det-session-desc">{s.desc}</div>
                      )}
                      {s.speaker && (
                        <div className="det-session-speaker">
                          <Mic size={11} color="#6b7280" />
                          {s.speaker}
                        </div>
                      )}
                    </>
                  )}
                  {isRest && (
                    <div
                      className="det-session-title"
                      style={{ color: "#9ca3af" }}
                    >
                      {s.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 안내 공지 ── */}
        <div className="det-notice">
          <AlertTriangle size={17} className="det-notice-icon" />
          <div>
            <div className="det-notice-title">일정 변경 안내</div>
            <div className="det-notice-text">
              위 일정은 사전 계획 기준이며, 현장 상황에 따라 세부 시간 및 내용이
              변경될 수 있습니다. 최신 정보는 공식 홈페이지 또는 현장 안내
              데스크를 통해 확인해 주시기 바랍니다.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
