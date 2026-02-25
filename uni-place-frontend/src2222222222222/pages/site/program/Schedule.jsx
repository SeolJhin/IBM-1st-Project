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
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Tag,
  CheckCircle2,
  Circle,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .sc-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .sc-root *, .sc-root *::before, .sc-root *::after { box-sizing: border-box; font-family: inherit; }
  .sc-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .sc-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .sc-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px;
    display: flex; align-items: center; gap: 14px;
  }
  .sc-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sc-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .sc-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .sc-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .sc-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .sc-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .sc-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .sc-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  .sc-main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 14px; }

  /* Day selector */
  .sc-day-list { display: flex; flex-direction: column; gap: 8px; }
  .sc-day-item {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 18px; border: 1px solid #e9ecef; border-radius: 10px;
    background: #fff; cursor: pointer; transition: all 0.15s;
  }
  .sc-day-item:hover { border-color: #1a4fd6; }
  .sc-day-item.active { border-color: #1a4fd6; background: #f5f8ff; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .sc-day-icon {
    width: 44px; height: 44px; border-radius: 10px; background: #f3f4f6;
    display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sc-day-icon.active { background: #1a4fd6; }
  .sc-day-icon .sc-day-d { font-size: 16px; font-weight: 900; color: #111827; line-height: 1; }
  .sc-day-icon.active .sc-day-d { color: #fff; }
  .sc-day-icon .sc-day-w { font-size: 9px; font-weight: 600; color: #9ca3af; }
  .sc-day-icon.active .sc-day-w { color: rgba(255,255,255,0.7); }
  .sc-day-info { flex: 1; }
  .sc-day-title { font-size: 14px; font-weight: 700; color: #111827; }
  .sc-day-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .sc-day-count {
    font-size: 11px; font-weight: 700; color: #1a4fd6; background: #eff4ff;
    padding: 3px 10px; border-radius: 100px;
  }

  /* Schedule timeline */
  .sc-timeline { display: flex; flex-direction: column; gap: 0; }
  .sc-time-group { margin-bottom: 20px; }
  .sc-time-label {
    font-size: 12px; font-weight: 700; color: #1a4fd6; background: #eff4ff;
    display: inline-flex; padding: 3px 10px; border-radius: 100px; margin-bottom: 10px;
  }
  .sc-event-list { display: flex; flex-direction: column; gap: 8px; }
  .sc-event-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px 18px; border: 1px solid #e9ecef; border-radius: 10px;
    background: #fff; transition: all 0.15s; cursor: pointer;
  }
  .sc-event-item:hover { border-color: #1a4fd6; background: #f8faff; }
  .sc-event-item.active { border-color: #10b981; background: #f0fdf9; }
  .sc-event-item.done { opacity: 0.55; }
  .sc-event-dot { margin-top: 4px; flex-shrink: 0; }
  .sc-event-info { flex: 1; }
  .sc-event-name { font-size: 14px; font-weight: 700; color: #111827; }
  .sc-event-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; font-size: 12px; color: #9ca3af; }
  .sc-event-meta-item { display: flex; align-items: center; gap: 3px; }
  .sc-event-tags { display: flex; gap: 6px; margin-top: 8px; }
  .sc-event-tag {
    font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 100px;
  }
  .sc-event-tag.session { background: #eff4ff; color: #1a4fd6; }
  .sc-event-tag.contest { background: #fef3c7; color: #d97706; }
  .sc-event-tag.experience { background: #fce7f3; color: #ec4899; }
  .sc-event-tag.ceremony { background: #f5f3ff; color: #8b5cf6; }
  .sc-event-badge {
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; flex-shrink: 0;
  }
  .sc-event-badge.live { background: #ecfdf5; color: #059669; }
  .sc-event-badge.upcoming { background: #fff7ed; color: #d97706; }
  .sc-event-badge.done { background: #f3f4f6; color: #9ca3af; }

  @media (max-width: 900px) {
    .sc-main-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .sc-container { padding: 20px 16px 48px; }
    .sc-stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;

const DAYS = [
  {
    date: "15",
    weekday: "토",
    title: "1일차 · 개막일",
    sub: "세미나 & 전시 오픈",
    events: 8,
  },
  {
    date: "16",
    weekday: "일",
    title: "2일차 · 본행사",
    sub: "콘테스트 & 체험",
    events: 12,
  },
  {
    date: "17",
    weekday: "월",
    title: "3일차 · 폐막일",
    sub: "시상식 & 폐막",
    events: 6,
  },
];

const SCHEDULE = {
  morning: [
    {
      name: "개막식 및 환영사",
      time: "09:00~09:30",
      zone: "메인 무대",
      people: 200,
      type: "ceremony",
      status: "done",
    },
    {
      name: "반려동물 건강 세미나",
      time: "10:00~11:30",
      zone: "세미나실 A",
      people: 80,
      type: "session",
      status: "done",
    },
    {
      name: "반려견 아지리티 체험",
      time: "10:00~12:00",
      zone: "야외 운동장",
      people: 40,
      type: "experience",
      status: "done",
    },
  ],
  afternoon: [
    {
      name: "펫 쿠킹 클래스",
      time: "13:00~14:00",
      zone: "B동 2층",
      people: 15,
      type: "experience",
      status: "live",
    },
    {
      name: "베스트 드레서 콘테스트",
      time: "14:00~15:30",
      zone: "메인 무대",
      people: 32,
      type: "contest",
      status: "live",
    },
    {
      name: "동물 행동학 강연",
      time: "15:00~16:30",
      zone: "세미나실 B",
      people: 60,
      type: "session",
      status: "upcoming",
    },
  ],
  evening: [
    {
      name: "강아지 수영 체험",
      time: "16:00~17:30",
      zone: "야외 수영장",
      people: 16,
      type: "experience",
      status: "upcoming",
    },
    {
      name: "묘기 자랑 대회",
      time: "17:00~18:00",
      zone: "메인 무대",
      people: 18,
      type: "contest",
      status: "upcoming",
    },
    {
      name: "네트워킹 파티",
      time: "18:30~20:00",
      zone: "카페테리아",
      people: 100,
      type: "ceremony",
      status: "upcoming",
    },
  ],
};

const TIME_LABELS = { morning: "오전", afternoon: "오후", evening: "저녁" };
const TYPE_LABEL = {
  session: "세미나",
  contest: "콘테스트",
  experience: "체험",
  ceremony: "행사",
};
const STATUS_LABEL = { live: "진행 중", upcoming: "예정", done: "완료" };

function ScheduleContent() {
  const [selectedDay, setSelectedDay] = useState(1);

  return (
    <>
      <div className="sc-stat-grid">
        {[
          {
            label: "행사 기간",
            value: "3일",
            icon: <CalendarDays size={20} color="#1a4fd6" />,
            bg: "#eff4ff",
          },
          {
            label: "오늘 프로그램",
            value: "12개",
            icon: <CalendarCheck size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
          {
            label: "전체 참가자",
            value: "461명",
            icon: <Users size={20} color="#f59e0b" />,
            bg: "#fffbeb",
          },
          {
            label: "진행 중",
            value: "2개",
            icon: <AlertCircle size={20} color="#ef4444" />,
            bg: "#fff0f0",
          },
        ].map((s) => (
          <div key={s.label} className="sc-stat-card">
            <div className="sc-stat-icon" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="sc-stat-label">{s.label}</div>
              <div className="sc-stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sc-main-grid">
        {/* Left: Day selector */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div className="sc-card-title">
              <div className="sc-card-title-icon">
                <CalendarDays size={14} color="#f59e0b" />
              </div>
              일자 선택
            </div>
            <span className="sc-card-tag">3월</span>
          </div>
          <div className="sc-day-list">
            {DAYS.map((d, i) => (
              <div
                key={d.date}
                className={`sc-day-item${selectedDay === i ? " active" : ""}`}
                onClick={() => setSelectedDay(i)}
              >
                <div
                  className={`sc-day-icon${selectedDay === i ? " active" : ""}`}
                >
                  <span className="sc-day-d">{d.date}</span>
                  <span className="sc-day-w">{d.weekday}</span>
                </div>
                <div className="sc-day-info">
                  <div className="sc-day-title">{d.title}</div>
                  <div className="sc-day-sub">{d.sub}</div>
                </div>
                <span className="sc-day-count">{d.events}개</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div className="sc-card-title">
              <div className="sc-card-title-icon">
                <Clock size={14} color="#f59e0b" />
              </div>
              {DAYS[selectedDay].title} 일정
            </div>
            <span className="sc-card-tag">
              {Object.values(SCHEDULE).flat().length}개 프로그램
            </span>
          </div>
          <div className="sc-timeline">
            {Object.entries(SCHEDULE).map(([period, events]) => (
              <div key={period} className="sc-time-group">
                <div className="sc-time-label">{TIME_LABELS[period]}</div>
                <div className="sc-event-list">
                  {events.map((e) => (
                    <div
                      key={e.name}
                      className={`sc-event-item${e.status === "live" ? " active" : ""}${e.status === "done" ? " done" : ""}`}
                    >
                      <div className="sc-event-dot">
                        {e.status === "done" ? (
                          <CheckCircle2 size={16} color="#10b981" />
                        ) : e.status === "live" ? (
                          <AlertCircle size={16} color="#10b981" />
                        ) : (
                          <Circle size={16} color="#d1d5db" />
                        )}
                      </div>
                      <div className="sc-event-info">
                        <div className="sc-event-name">{e.name}</div>
                        <div className="sc-event-meta">
                          <span className="sc-event-meta-item">
                            <Clock size={11} /> {e.time}
                          </span>
                          <span className="sc-event-meta-item">
                            <MapPin size={11} /> {e.zone}
                          </span>
                          <span className="sc-event-meta-item">
                            <Users size={11} /> {e.people}명
                          </span>
                        </div>
                        <div className="sc-event-tags">
                          <span className={`sc-event-tag ${e.type}`}>
                            {TYPE_LABEL[e.type]}
                          </span>
                        </div>
                      </div>
                      <span className={`sc-event-badge ${e.status}`}>
                        {STATUS_LABEL[e.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Schedule() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const currentPath = "/program/schedule";

  if (!eventId) {
    return (
      <div className="sc-root">
        <style>{styles}</style>
        <PageHeader
          title="프로그램 안내"
          subtitle="행사를 선택해 프로그램 일정을 확인하세요"
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
        />
        <EventSelectPage events={SAMPLE_EVENTS} basePath="/program/schedule" />
      </div>
    );
  }

  return (
    <div className="sc-root">
      <style>{styles}</style>
      <PageHeader
        title="프로그램 안내"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
      />
      <main className="sc-container">
        <ScheduleContent />
      </main>
    </div>
  );
}
