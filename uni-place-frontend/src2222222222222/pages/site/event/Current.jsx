import PageHeader from "../components/PageHeader";
import EventDetailModal from "./EventDetailModal";
import { useState } from "react";
import {
  Play,
  MapPin,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  Search,
  Zap,
  TrendingUp,
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

  .ev-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .ev-root *, .ev-root *::before, .ev-root *::after { box-sizing: border-box; font-family: inherit; }

  .ev-header { background: #fff; border-bottom: 1px solid #e9ecef; padding: 0 32px; }
  .ev-header-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .ev-header-left { display: flex; flex-direction: column; }
  .ev-header-title { font-size: 17px; font-weight: 800; color: #111827; }
  .ev-header-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }
  .ev-nav { display: flex; gap: 4px; }
  .ev-nav-btn { height: 34px; padding: 0 14px; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; color: #6b7280; background: transparent; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .ev-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .ev-nav-btn.active { background: #1a4fd6; color: #fff; font-weight: 600; }

  .ev-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .ev-live-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca; border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444; margin-bottom: 20px; }
  .ev-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: ev-pulse 1.4s ease-in-out infinite; }
  @keyframes ev-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }

  .ev-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
  .ev-stat-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px; display: flex; align-items: center; gap: 14px; }
  .ev-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ev-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .ev-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .ev-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; }
  .ev-search-wrap { position: relative; flex: 1; }
  .ev-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  .ev-search { width: 100%; height: 40px; padding: 0 13px 0 36px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px; color: #111827; outline: none; font-family: inherit; background: #fff; transition: border-color 0.15s; }
  .ev-search:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }

  .ev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .ev-card { background: #fff; border: 1px solid #e9ecef; border-radius: 14px; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; cursor: pointer; }
  .ev-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-2px); }

  .ev-card-thumb { height: 160px; position: relative; overflow: hidden; }
  .ev-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
  .ev-card:hover .ev-card-thumb img { transform: scale(1.05); }
  .ev-card-thumb-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%); }
  .ev-card-thumb-label { position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.55); color: #fff; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; backdrop-filter: blur(4px); }
  .ev-card-thumb-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; }

  .ev-card-body { padding: 18px 20px 20px; }
  .ev-card-category { font-size: 11px; font-weight: 600; color: #1a4fd6; margin-bottom: 6px; }
  .ev-card-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 10px; line-height: 1.4; }
  .ev-card-meta { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .ev-card-meta-row { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #6b7280; }
  .ev-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #f1f3f5; }
  .ev-progress-wrap { flex: 1; margin-right: 14px; }
  .ev-progress-label { display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
  .ev-progress-track { height: 5px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .ev-progress-fill { height: 100%; border-radius: 100px; background: #1a4fd6; }
  .ev-card-btn { height: 32px; padding: 0 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; font-size: 12px; font-weight: 600; color: #374151; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: inherit; white-space: nowrap; transition: all 0.15s; flex-shrink: 0; }
  .ev-card-btn:hover { background: #1a4fd6; color: #fff; border-color: #1a4fd6; }

  @media (max-width: 1100px) { .ev-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 700px) { .ev-grid { grid-template-columns: 1fr; } .ev-stat-grid { grid-template-columns: repeat(3, 1fr); } }
`;

const EVENTS = [
  {
    id: 1,
    category: "컨퍼런스",
    title: "2026 스타트업 이노베이션 서밋",
    location: "코엑스 그랜드볼룸, 서울",
    time: "09:00 ~ 18:00",
    date: "2026.02.23",
    participants: 1240,
    capacity: 1500,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80",
    fallback: "🚀",
  },
  {
    id: 2,
    category: "워크샵",
    title: "AI & 머신러닝 실전 워크샵",
    location: "강남 D.CAMP, 서울",
    time: "13:00 ~ 17:00",
    date: "2026.02.23",
    participants: 87,
    capacity: 100,
    image:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&auto=format&fit=crop&q=80",
    fallback: "🤖",
  },
  {
    id: 3,
    category: "네트워킹",
    title: "테크 스타트업 네트워킹 나이트",
    location: "성수 헤이그라운드, 서울",
    time: "18:00 ~ 21:00",
    date: "2026.02.23",
    participants: 210,
    capacity: 250,
    image:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80",
    fallback: "🤝",
  },
  {
    id: 4,
    category: "세미나",
    title: "디지털 마케팅 전략 세미나 2026",
    location: "여의도 IFC, 서울",
    time: "10:00 ~ 16:00",
    date: "2026.02.23",
    participants: 310,
    capacity: 400,
    image:
      "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&auto=format&fit=crop&q=80",
    fallback: "📊",
  },
  {
    id: 5,
    category: "포럼",
    title: "ESG 경영 혁신 포럼",
    location: "롯데월드타워, 서울",
    time: "09:30 ~ 12:30",
    date: "2026.02.23",
    participants: 445,
    capacity: 600,
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
    fallback: "🌱",
  },
  {
    id: 6,
    category: "전시",
    title: "한국 핀테크 기술 박람회",
    location: "킨텍스 제1전시장, 일산",
    time: "10:00 ~ 18:00",
    date: "2026.02.23",
    participants: 3200,
    capacity: 5000,
    image:
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=600&auto=format&fit=crop&q=80",
    fallback: "💳",
  },
];

function EventThumb({ ev }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="ev-card-thumb">
      {!imgError ? (
        <img
          src={ev.image}
          alt={ev.title}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className="ev-card-thumb-fallback"
          style={{
            background: "linear-gradient(135deg, #1a4fd6 0%, #6366f1 100%)",
          }}
        >
          {ev.fallback}
        </div>
      )}
      <div className="ev-card-thumb-overlay" />
      <div className="ev-card-thumb-label">
        <Zap size={10} />
        진행 중
      </div>
    </div>
  );
}

export default function Current() {
  const [query, setQuery] = useState("");
  const [currentPath, setCurrentPath] = useState("/event/current");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filtered = EVENTS.filter(
    (e) =>
      e.title.includes(query) ||
      e.category.includes(query) ||
      e.location.includes(query),
  );

  return (
    <div className="ev-root">
      <style>{styles}</style>
      <PageHeader
        title="현재 진행 행사"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main className="ev-container">
        <div className="ev-live-badge">
          <div className="ev-live-dot" />
          LIVE · {EVENTS.length}개 행사 진행 중
        </div>

        <div className="ev-stat-grid">
          {[
            {
              label: "진행 중 행사",
              value: `${EVENTS.length}개`,
              icon: <Play size={20} color="#1a4fd6" />,
              bg: "#eff4ff",
            },
            {
              label: "총 참가자",
              value: `${EVENTS.reduce((a, e) => a + e.participants, 0).toLocaleString()}명`,
              icon: <Users size={20} color="#10b981" />,
              bg: "#ecfdf5",
            },
            {
              label: "평균 참석률",
              value: `${Math.round((EVENTS.reduce((a, e) => a + e.participants / e.capacity, 0) / EVENTS.length) * 100)}%`,
              icon: <TrendingUp size={20} color="#f59e0b" />,
              bg: "#fffbeb",
            },
          ].map((s) => (
            <div key={s.label} className="ev-stat-card">
              <div className="ev-stat-icon" style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div>
                <div className="ev-stat-label">{s.label}</div>
                <div className="ev-stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="ev-toolbar">
          <div className="ev-search-wrap">
            <Search size={15} className="ev-search-icon" />
            <input
              className="ev-search"
              placeholder="행사명, 카테고리, 장소 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="ev-grid">
          {filtered.map((ev) => {
            const pct = Math.round((ev.participants / ev.capacity) * 100);
            return (
              <div
                key={ev.id}
                className="ev-card"
                onClick={() => setSelectedEvent(ev)}
              >
                <EventThumb ev={ev} />
                <div className="ev-card-body">
                  <div className="ev-card-category">{ev.category}</div>
                  <div className="ev-card-title">{ev.title}</div>
                  <div className="ev-card-meta">
                    <div className="ev-card-meta-row">
                      <MapPin size={12} />
                      {ev.location}
                    </div>
                    <div className="ev-card-meta-row">
                      <Clock size={12} />
                      {ev.time}
                    </div>
                    <div className="ev-card-meta-row">
                      <Calendar size={12} />
                      {ev.date}
                    </div>
                  </div>
                  <div className="ev-card-footer">
                    <div className="ev-progress-wrap">
                      <div className="ev-progress-label">
                        <span>참가자 {ev.participants.toLocaleString()}명</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="ev-progress-track">
                        <div
                          className="ev-progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <button
                      className="ev-card-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                      }}
                    >
                      상세 <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
