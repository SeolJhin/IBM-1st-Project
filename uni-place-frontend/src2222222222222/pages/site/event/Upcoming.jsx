import PageHeader from "../components/PageHeader";
import { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Search,
  Bell,
  BellRing,
  Tag,
  Filter,
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

  .up-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .up-root *, .up-root *::before, .up-root *::after { box-sizing: border-box; font-family: inherit; }

  .up-header {
    background: #fff; border-bottom: 1px solid #e9ecef; padding: 0 32px;
  }
  .up-header-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between; height: 64px;
  }
  .up-header-title { font-size: 17px; font-weight: 800; color: #111827; }
  .up-header-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }
  .up-nav { display: flex; gap: 4px; }
  .up-nav-btn {
    height: 34px; padding: 0 14px; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #6b7280; background: transparent;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .up-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .up-nav-btn.active { background: #1a4fd6; color: #fff; font-weight: 600; }

  .up-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .up-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
  .up-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 20px 22px; display: flex; align-items: center; gap: 14px;
  }
  .up-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .up-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .up-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .up-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
  .up-search-wrap { position: relative; flex: 1; min-width: 200px; }
  .up-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  .up-search {
    width: 100%; height: 40px; padding: 0 13px 0 36px;
    border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px;
    color: #111827; outline: none; font-family: inherit; background: #fff;
    transition: border-color 0.15s;
  }
  .up-search:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .up-filter-btn {
    height: 40px; padding: 0 14px; border: 1px solid #e2e8f0; border-radius: 8px;
    background: #fff; font-size: 13px; font-weight: 500; color: #374151;
    cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit;
    transition: all 0.15s; white-space: nowrap;
  }
  .up-filter-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .up-filter-btn.active { border-color: #1a4fd6; background: #f5f8ff; color: #1a4fd6; }

  /* Timeline-style list */
  .up-list { display: flex; flex-direction: column; gap: 12px; }
  .up-event-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 14px;
    padding: 20px 24px; display: flex; align-items: flex-start; gap: 20px;
    transition: box-shadow 0.2s, transform 0.15s; cursor: pointer;
  }
  .up-event-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }
  .up-date-box {
    flex-shrink: 0; width: 60px; text-align: center;
    background: #f5f8ff; border-radius: 10px; padding: 10px 8px;
    border: 1px solid #e0e9ff;
  }
  .up-date-month { font-size: 10px; font-weight: 600; color: #1a4fd6; text-transform: uppercase; }
  .up-date-day { font-size: 24px; font-weight: 800; color: #111827; line-height: 1.1; }
  .up-date-dow { font-size: 10px; color: #9ca3af; font-weight: 500; }
  .up-event-main { flex: 1; min-width: 0; }
  .up-event-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
  .up-event-category {
    font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
  }
  .up-d-badge {
    font-size: 11px; font-weight: 700; color: #fff;
    padding: 2px 8px; border-radius: 4px; background: #ef4444;
  }
  .up-event-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 8px; }
  .up-event-meta { display: flex; gap: 16px; flex-wrap: wrap; }
  .up-event-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: #6b7280; }
  .up-event-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .up-participants { font-size: 12px; color: #6b7280; text-align: right; }
  .up-participants strong { display: block; font-size: 15px; font-weight: 700; color: #111827; }
  .up-alarm-btn {
    height: 32px; padding: 0 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 5px; font-family: inherit;
    transition: all 0.15s;
  }
  .up-alarm-btn.off { border: 1px solid #e2e8f0; background: #fff; color: #374151; }
  .up-alarm-btn.off:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .up-alarm-btn.on { border: 1px solid #1a4fd6; background: #eff4ff; color: #1a4fd6; }

  @media (max-width: 900px) {
    .up-stat-grid { grid-template-columns: repeat(3, 1fr); }
    .up-event-card { flex-wrap: wrap; }
    .up-event-right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; }
  }
`;

const CATEGORY_COLORS = {
  컨퍼런스: { bg: "#eff4ff", color: "#1a4fd6" },
  워크샵: { bg: "#f5f3ff", color: "#7c3aed" },
  세미나: { bg: "#ecfdf5", color: "#059669" },
  포럼: { bg: "#fff7ed", color: "#d97706" },
  전시: { bg: "#fef2f2", color: "#dc2626" },
  네트워킹: { bg: "#f0fdf4", color: "#16a34a" },
};

const EVENTS = [
  {
    id: 1,
    category: "컨퍼런스",
    title: "2026 클라우드 테크 서밋",
    date: "2026.03.05",
    month: "MAR",
    day: "05",
    dow: "목",
    location: "코엑스 컨벤션홀, 서울",
    time: "09:00 ~ 17:30",
    capacity: 1200,
    registered: 748,
    dday: 10,
  },
  {
    id: 2,
    category: "워크샵",
    title: "UI/UX 디자인 마스터클래스",
    date: "2026.03.08",
    month: "MAR",
    day: "08",
    dow: "일",
    location: "강남 위워크, 서울",
    time: "14:00 ~ 18:00",
    capacity: 80,
    registered: 62,
    dday: 13,
  },
  {
    id: 3,
    category: "세미나",
    title: "2026 블록체인 기술 동향 세미나",
    date: "2026.03.12",
    month: "MAR",
    day: "12",
    dow: "목",
    location: "여의도 전경련회관, 서울",
    time: "10:00 ~ 13:00",
    capacity: 300,
    registered: 189,
    dday: 17,
  },
  {
    id: 4,
    category: "포럼",
    title: "스마트시티 혁신 포럼 2026",
    date: "2026.03.18",
    month: "MAR",
    day: "18",
    dow: "수",
    location: "세종 정부청사 대강당",
    time: "09:00 ~ 18:00",
    capacity: 500,
    registered: 321,
    dday: 23,
  },
  {
    id: 5,
    category: "전시",
    title: "한국 로보틱스 & 자동화 엑스포",
    date: "2026.03.25",
    month: "MAR",
    day: "25",
    dow: "수",
    location: "킨텍스 제2전시장, 일산",
    time: "10:00 ~ 18:00",
    capacity: 8000,
    registered: 3240,
    dday: 30,
  },
  {
    id: 6,
    category: "네트워킹",
    title: "여성 테크 리더스 네트워킹",
    date: "2026.04.02",
    month: "APR",
    day: "02",
    dow: "목",
    location: "성수 카우앤독, 서울",
    time: "18:30 ~ 21:00",
    capacity: 150,
    registered: 87,
    dday: 38,
  },
];

export default function Upcoming() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [alarms, setAlarms] = useState({});
  const [currentPath, setCurrentPath] = useState("/event/upcoming");

  const filtered = EVENTS.filter((e) => {
    const matchQ = e.title.includes(query) || e.category.includes(query);
    const matchF = filter === "all" || e.category === filter;
    return matchQ && matchF;
  });

  const categories = ["all", ...new Set(EVENTS.map((e) => e.category))];

  return (
    <div className="up-root">
      <style>{styles}</style>
      <PageHeader
        title="예정 행사"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main className="up-container">
        <div className="up-stat-grid">
          {[
            {
              label: "예정 행사",
              value: `${EVENTS.length}개`,
              icon: <Calendar size={20} color="#1a4fd6" />,
              bg: "#eff4ff",
            },
            {
              label: "총 사전등록",
              value: `${EVENTS.reduce((a, e) => a + e.registered, 0).toLocaleString()}명`,
              icon: <Users size={20} color="#10b981" />,
              bg: "#ecfdf5",
            },
            {
              label: "알림 설정",
              value: `${Object.values(alarms).filter(Boolean).length}개`,
              icon: <BellRing size={20} color="#f59e0b" />,
              bg: "#fffbeb",
            },
          ].map((s) => (
            <div key={s.label} className="up-stat-card">
              <div className="up-stat-icon" style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div>
                <div className="up-stat-label">{s.label}</div>
                <div className="up-stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="up-toolbar">
          <div className="up-search-wrap">
            <Search size={15} className="up-search-icon" />
            <input
              className="up-search"
              placeholder="행사명, 카테고리 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {categories.map((c) => (
            <button
              key={c}
              className={`up-filter-btn${filter === c ? " active" : ""}`}
              onClick={() => setFilter(c)}
            >
              {c === "all" ? (
                <>
                  <Filter size={13} /> 전체
                </>
              ) : (
                <>
                  <Tag size={11} /> {c}
                </>
              )}
            </button>
          ))}
        </div>

        <div className="up-list">
          {filtered.map((ev) => {
            const cc = CATEGORY_COLORS[ev.category] || {
              bg: "#f3f4f6",
              color: "#374151",
            };
            const isOn = alarms[ev.id];
            return (
              <div key={ev.id} className="up-event-card">
                <div className="up-date-box">
                  <div className="up-date-month">{ev.month}</div>
                  <div className="up-date-day">{ev.day}</div>
                  <div className="up-date-dow">{ev.dow}요일</div>
                </div>
                <div className="up-event-main">
                  <div className="up-event-top">
                    <span
                      className="up-event-category"
                      style={{ background: cc.bg, color: cc.color }}
                    >
                      {ev.category}
                    </span>
                    <span className="up-d-badge">D-{ev.dday}</span>
                  </div>
                  <div className="up-event-title">{ev.title}</div>
                  <div className="up-event-meta">
                    <div className="up-event-meta-item">
                      <MapPin size={12} />
                      {ev.location}
                    </div>
                    <div className="up-event-meta-item">
                      <Clock size={12} />
                      {ev.time}
                    </div>
                  </div>
                </div>
                <div className="up-event-right">
                  <div className="up-participants">
                    <strong>{ev.registered.toLocaleString()}명</strong>
                    사전등록 / {ev.capacity.toLocaleString()}명
                  </div>
                  <button
                    className={`up-alarm-btn ${isOn ? "on" : "off"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAlarms((a) => ({ ...a, [ev.id]: !a[ev.id] }));
                    }}
                  >
                    {isOn ? <BellRing size={12} /> : <Bell size={12} />}
                    {isOn ? "알림 설정됨" : "알림 받기"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
