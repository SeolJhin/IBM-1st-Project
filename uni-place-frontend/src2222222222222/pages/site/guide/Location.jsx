import PageHeader from "../components/PageHeader";
import {
  CalendarDays,
  MapPin,
  Phone,
  ParkingCircle,
  Banknote,
  Clock,
  Train,
  Bus,
  Car,
  Navigation,
  AlertTriangle,
  Map,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";

const GUIDE_CATEGORIES = [
  { label: "현장 운영 안내", path: "/guide/operation" },
  { label: "장소/오시는길", path: "/guide/location" },
];

const GUIDE_SUBTITLE_MAP = {
  "/guide/operation":
    "원활하고 즐거운 행사 참여를 위해 아래 안내 사항을 미리 확인해 주세요",
  "/guide/location":
    "행사장 위치와 교통편 안내입니다. 대중교통 이용을 적극 권장드립니다.",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .loc-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA;
    min-height: 100vh;
  }
  .loc-root *, .loc-root *::before, .loc-root *::after {
    box-sizing: border-box; font-family: inherit;
  }
  .loc-container {
    max-width: 860px; margin: 0 auto;
    padding: 28px 20px 80px;
  }

  /* ── 지도 영역 ── */
  .loc-map-hero {
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #EBEBEB;
    margin-bottom: 12px;
  }
  .loc-map-visual {
    height: 240px;
    background: linear-gradient(135deg, #EEF2FF 0%, #DBEAFE 50%, #E0E7FF 100%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    position: relative; overflow: hidden;
  }
  .loc-map-visual::before {
    content: '';
    position: absolute; inset: 0;
    background:
      repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(255,255,255,0.4) 32px, rgba(255,255,255,0.4) 33px),
      repeating-linear-gradient(90deg, transparent, transparent 32px, rgba(255,255,255,0.4) 32px, rgba(255,255,255,0.4) 33px);
    pointer-events: none;
  }
  .loc-map-pin {
    width: 56px; height: 56px;
    border-radius: 50%;
    background: #1B50D9;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 24px rgba(27,80,217,0.3), 0 0 0 8px rgba(27,80,217,0.12);
    position: relative; z-index: 1;
  }
  .loc-map-label {
    font-size: 14px; font-weight: 700;
    color: #1B50D9; background: #fff;
    padding: 7px 16px; border-radius: 100px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    position: relative; z-index: 1;
  }
  .loc-map-sublabel {
    font-size: 12px; color: #9CA3AF;
    position: relative; z-index: 1; margin-top: -4px;
  }

  .loc-map-footer {
    padding: 18px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .loc-addr-main {
    font-size: 15px; font-weight: 700; color: #111827;
  }
  .loc-addr-sub {
    font-size: 12.5px; color: #9CA3AF; margin-top: 4px;
    display: flex; align-items: center; gap: 5px;
  }
  .loc-map-cta {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: 10px;
    background: #1B50D9; color: #fff;
    font-size: 13px; font-weight: 700;
    border: none; cursor: pointer;
    font-family: inherit; transition: all 0.15s;
    white-space: nowrap; flex-shrink: 0;
  }
  .loc-map-cta:hover { background: #1640B8; }

  /* ── 정보 카드 그리드 ── */
  .loc-info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 28px;
  }
  .loc-info-card {
    background: #fff;
    border: 1px solid #EBEBEB;
    border-radius: 16px;
    padding: 20px;
  }
  .loc-info-card-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px; padding-bottom: 14px;
    border-bottom: 1px solid #F3F4F6;
  }
  .loc-info-card-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .loc-info-card-icon.blue   { background: #EEF2FF; color: #1B50D9; }
  .loc-info-card-icon.amber  { background: #FEF3C7; color: #92400E; }
  .loc-info-card-icon.slate  { background: #F3F4F6; color: #374151; }
  .loc-info-card-title {
    font-size: 14px; font-weight: 700; color: #111827;
  }

  .loc-detail-row {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid #F9FAFB;
  }
  .loc-detail-row:last-child { border-bottom: none; padding-bottom: 0; }
  .loc-detail-icon { color: #D1D5DB; flex-shrink: 0; margin-top: 2px; }
  .loc-detail-label {
    font-size: 11px; font-weight: 700;
    color: #9CA3AF; letter-spacing: 0.3px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .loc-detail-value {
    font-size: 13px; font-weight: 500;
    color: #111827; line-height: 1.55;
  }
  .loc-detail-muted {
    font-size: 12px; color: #9CA3AF; margin-top: 2px;
  }
  .loc-detail-highlight {
    font-weight: 700; color: #1B50D9;
  }

  /* ── 섹션 헤더 ── */
  .loc-sec-label {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
  }
  .loc-sec-num {
    font-size: 13px; font-weight: 800;
    color: #1B50D9;
    width: 32px; height: 32px;
    background: #EEF2FF;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .loc-sec-text {
    font-size: 17px; font-weight: 800; color: #111827;
    letter-spacing: -0.3px;
  }

  /* ── 교통편 카드 ── */
  .loc-transport {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 12px;
  }
  .loc-tr-card {
    background: #fff;
    border: 1px solid #EBEBEB;
    border-radius: 16px;
    padding: 20px;
    position: relative; overflow: hidden;
    transition: all 0.2s;
  }
  .loc-tr-card::before {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 100%; height: 3px;
    background: #1B50D9;
    opacity: 0; transition: opacity 0.2s;
  }
  .loc-tr-card:hover {
    border-color: #C7D2FA;
    box-shadow: 0 4px 16px rgba(27,80,217,0.08);
    transform: translateY(-2px);
  }
  .loc-tr-card:hover::before { opacity: 1; }

  .loc-tr-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
  }
  .loc-tr-icon.subway { background: #EEF2FF; color: #1B50D9; }
  .loc-tr-icon.bus    { background: #D1FAE5; color: #065F46; }
  .loc-tr-icon.car    { background: #FEF3C7; color: #92400E; }

  .loc-tr-title {
    font-size: 14px; font-weight: 700;
    color: #111827; margin-bottom: 14px;
  }
  .loc-tr-row {
    display: flex; align-items: flex-start; gap: 9px;
    margin-bottom: 10px;
  }
  .loc-tr-row:last-child { margin-bottom: 0; }
  .loc-tr-badge {
    width: 22px; height: 22px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800;
    flex-shrink: 0; margin-top: 1px;
  }
  .loc-tr-badge.dark   { background: #1B50D9; color: #fff; }
  .loc-tr-badge.green  { background: #059669; color: #fff; }
  .loc-tr-badge.orange { background: #D97706; color: #fff; }
  .loc-tr-text {
    font-size: 13px; color: #6B7280;
    line-height: 1.55;
  }
  .loc-tr-text strong { font-weight: 700; color: #111827; }
  .loc-tr-warn {
    font-size: 12.5px; color: #DC2626;
    font-weight: 600;
  }

  /* ── 공지 ── */
  .loc-alert {
    background: #FFFBEB;
    border: 1.5px solid #FDE68A;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .loc-alert-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: #FEF3C7;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: #92400E;
  }
  .loc-alert-title {
    font-size: 13px; font-weight: 700;
    color: #92400E; margin-bottom: 3px;
  }
  .loc-alert-text {
    font-size: 13px; color: #92400E;
    line-height: 1.6; opacity: 0.75;
  }

  @media (max-width: 860px) {
    .loc-info-grid { grid-template-columns: 1fr; }
    .loc-transport { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .loc-container { padding: 20px 16px 64px; }
    .loc-map-footer { flex-direction: column; align-items: flex-start; }
    .loc-sec-text { font-size: 16px; }
  }
`;

export default function Location({ onNavigate }) {
  const currentPath = "/guide/location";

  return (
    <div className="loc-root">
      <style>{styles}</style>
      <PageHeader
        title="장소 / 오시는길"
        subtitle={GUIDE_SUBTITLE_MAP[currentPath]}
        categories={GUIDE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
      <main className="loc-container">
        {/* 지도 영역 */}
        <div className="loc-map-hero">
          <div className="loc-map-visual">
            <div className="loc-map-pin">
              <Map size={26} color="#fff" />
            </div>
            <div className="loc-map-label">
              서울 올림픽공원 SK핸드볼경기장 주변
            </div>
            <div className="loc-map-sublabel">지도를 불러오는 중...</div>
          </div>
          <div className="loc-map-footer">
            <div>
              <div className="loc-addr-main">
                서울특별시 송파구 올림픽로 424
              </div>
              <div className="loc-addr-sub">
                <MapPin size={12} />
                올림픽공원 내 특설 행사장 (SK핸드볼경기장 인근)
              </div>
            </div>
            <button
              className="loc-map-cta"
              onClick={() => window.open("https://map.naver.com", "_blank")}
            >
              <Navigation size={14} />
              지도 앱으로 보기
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* 정보 카드 */}
        <div className="loc-info-grid">
          {/* 행사 기본 정보 */}
          <div className="loc-info-card">
            <div className="loc-info-card-header">
              <div className="loc-info-card-icon blue">
                <CalendarDays size={17} />
              </div>
              <div className="loc-info-card-title">행사 기본 정보</div>
            </div>
            <div className="loc-detail-row">
              <CalendarDays size={14} className="loc-detail-icon" />
              <div>
                <div className="loc-detail-label">일시</div>
                <div className="loc-detail-value">
                  2026.04.12 (토) – 04.13 (일)
                </div>
                <div className="loc-detail-muted">오전 10:00 – 오후 6:00</div>
              </div>
            </div>
            <div className="loc-detail-row">
              <MapPin size={14} className="loc-detail-icon" />
              <div>
                <div className="loc-detail-label">장소</div>
                <div className="loc-detail-value">
                  서울 올림픽공원 특설 행사장
                </div>
              </div>
            </div>
            <div className="loc-detail-row">
              <Phone size={14} className="loc-detail-icon" />
              <div>
                <div className="loc-detail-label">문의</div>
                <div className="loc-detail-value">02-1234-5678</div>
                <div className="loc-detail-muted">평일 10:00 – 17:00</div>
              </div>
            </div>
          </div>

          {/* 주차 안내 */}
          <div className="loc-info-card">
            <div className="loc-info-card-header">
              <div className="loc-info-card-icon amber">
                <ParkingCircle size={17} />
              </div>
              <div className="loc-info-card-title">주차 안내</div>
            </div>
            <div className="loc-detail-row">
              <AlertTriangle
                size={14}
                className="loc-detail-icon"
                style={{ color: "#D97706" }}
              />
              <div>
                <div className="loc-detail-label">주의</div>
                <div className="loc-detail-value">
                  행사 기간 중 주차 공간이 매우 혼잡합니다.{" "}
                  <span className="loc-detail-highlight">대중교통 이용</span>을
                  권장합니다.
                </div>
              </div>
            </div>
            <div className="loc-detail-row">
              <Banknote size={14} className="loc-detail-icon" />
              <div>
                <div className="loc-detail-label">주차 요금</div>
                <div className="loc-detail-value">
                  최초 30분 무료, 이후 10분당 400원
                </div>
              </div>
            </div>
            <div className="loc-detail-row">
              <Clock size={14} className="loc-detail-icon" />
              <div>
                <div className="loc-detail-label">운영 시간</div>
                <div className="loc-detail-value">오전 8:00 – 오후 8:00</div>
              </div>
            </div>
          </div>

          {/* 빠른 안내 */}
          <div className="loc-info-card">
            <div className="loc-info-card-header">
              <div className="loc-info-card-icon slate">
                <Navigation size={17} />
              </div>
              <div className="loc-info-card-title">빠른 길 안내</div>
            </div>
            <div className="loc-detail-row">
              <Train size={14} className="loc-detail-icon" />
              <div>
                <div className="loc-detail-label">추천 경로</div>
                <div className="loc-detail-value">
                  5호선 올림픽공원역 3번 출구
                </div>
                <div className="loc-detail-muted">도보 약 5분</div>
              </div>
            </div>
            <div className="loc-detail-row">
              <Bus size={14} className="loc-detail-icon" />
              <div>
                <div className="loc-detail-label">버스 정류장</div>
                <div className="loc-detail-value">올림픽공원 정류장</div>
                <div className="loc-detail-muted">하차 후 도보 3분</div>
              </div>
            </div>
            <div className="loc-detail-row">
              <Car size={14} className="loc-detail-icon" />
              <div>
                <div className="loc-detail-label">내비게이션</div>
                <div className="loc-detail-value">
                  「올림픽공원 특설 행사장」
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 교통편 상세 */}
        <div className="loc-sec-label">
          <div className="loc-sec-num">01</div>
          <h2 className="loc-sec-text">교통편 안내</h2>
        </div>
        <div className="loc-transport">
          {/* 지하철 */}
          <div className="loc-tr-card">
            <div className="loc-tr-icon subway">
              <Train size={20} />
            </div>
            <div className="loc-tr-title">지하철</div>
            <div className="loc-tr-row">
              <div className="loc-tr-badge dark">5</div>
              <div className="loc-tr-text">
                <strong>5호선</strong> 올림픽공원역 3번 출구 → 도보 5분
              </div>
            </div>
            <div className="loc-tr-row">
              <div className="loc-tr-badge orange">9</div>
              <div className="loc-tr-text">
                <strong>9호선</strong> 한성백제역 1번 출구 → 도보 10분
              </div>
            </div>
            <div className="loc-tr-row">
              <div className="loc-tr-badge green">2</div>
              <div className="loc-tr-text">
                <strong>2호선</strong> 잠실역 8번 출구 → 버스 환승 10분
              </div>
            </div>
          </div>

          {/* 버스 */}
          <div className="loc-tr-card">
            <div className="loc-tr-icon bus">
              <Bus size={20} />
            </div>
            <div className="loc-tr-title">버스</div>
            <div className="loc-tr-row">
              <div className="loc-tr-badge dark">간</div>
              <div className="loc-tr-text">
                <strong>간선버스</strong> 340, 3312, 3411
              </div>
            </div>
            <div className="loc-tr-row">
              <div className="loc-tr-badge green">지</div>
              <div className="loc-tr-text">
                <strong>지선버스</strong> 2412, 3313
              </div>
            </div>
            <div className="loc-tr-row">
              <MapPin
                size={14}
                style={{ color: "#D1D5DB", flexShrink: 0, marginTop: 3 }}
              />
              <div className="loc-tr-text">
                올림픽공원 정류장 하차 후 도보 3분
              </div>
            </div>
          </div>

          {/* 자가용 */}
          <div className="loc-tr-card">
            <div className="loc-tr-icon car">
              <Car size={20} />
            </div>
            <div className="loc-tr-title">자가용</div>
            <div className="loc-tr-row">
              <Navigation
                size={14}
                style={{ color: "#D1D5DB", flexShrink: 0, marginTop: 3 }}
              />
              <div className="loc-tr-text">
                <strong>내비게이션 검색</strong>
                <br />
                「올림픽공원 특설 행사장」
              </div>
            </div>
            <div className="loc-tr-row">
              <Car
                size={14}
                style={{ color: "#D1D5DB", flexShrink: 0, marginTop: 3 }}
              />
              <div className="loc-tr-text">
                강변북로 → 올림픽대로 → 올림픽공원 진입
              </div>
            </div>
            <div className="loc-tr-row">
              <AlertTriangle
                size={14}
                style={{ color: "#DC2626", flexShrink: 0, marginTop: 3 }}
              />
              <div className="loc-tr-warn">행사 당일 도로 혼잡 예상</div>
            </div>
          </div>
        </div>

        {/* 공지 */}
        <div className="loc-alert">
          <div className="loc-alert-icon">
            <AlertTriangle size={16} />
          </div>
          <div>
            <div className="loc-alert-title">교통 혼잡 안내</div>
            <div className="loc-alert-text">
              행사 당일 주변 도로가 매우 혼잡할 수 있습니다. 여유 있는 출발
              시간을 계획하시고, 가급적 대중교통을 이용해 주시기 바랍니다.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
