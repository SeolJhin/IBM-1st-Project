import PageHeader from "../components/PageHeader";
import {
  QrCode,
  PawPrint,
  Map,
  Trash2,
  Dog,
  Syringe,
  ShieldCheck,
  Ban,
  ParkingCircle,
  Stethoscope,
  AlertTriangle,
  ArrowRight,
  Sparkles,
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

  .op-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA;
    min-height: 100vh;
  }
  .op-root *, .op-root *::before, .op-root *::after {
    box-sizing: border-box; font-family: inherit;
  }
  .op-container {
    max-width: 860px; margin: 0 auto;
    padding: 28px 20px 80px;
  }

  /* ── 섹션 제목 ── */
  .op-sec-label {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
  }
  .op-sec-num {
    font-size: 13px; font-weight: 800;
    color: #1B50D9;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: #EEF2FF;
    display: flex; align-items: center; justify-content: center;
  }
  .op-sec-text {
    font-size: 17px; font-weight: 800; color: #111827;
    letter-spacing: -0.3px;
  }

  /* ── 입장 절차 카드 ── */
  .op-flow-card {
    background: #fff;
    border: 1px solid #EBEBEB;
    border-radius: 16px;
    padding: 28px 24px;
    margin-bottom: 12px;
  }
  .op-flow {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0;
    position: relative;
  }
  .op-flow::before {
    content: '';
    position: absolute;
    top: 30px; left: 60px; right: 60px;
    height: 1.5px;
    background: #E8E9EF;
    z-index: 0;
  }
  .op-flow-item {
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
    position: relative; z-index: 1;
  }
  .op-flow-circle {
    width: 60px; height: 60px;
    border-radius: 50%;
    background: #EEF2FF;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
    transition: all 0.2s;
  }
  .op-flow-item:hover .op-flow-circle {
    background: #1B50D9;
    box-shadow: 0 4px 16px rgba(27,80,217,0.25);
    transform: translateY(-3px);
  }
  .op-flow-circle svg { color: #1B50D9; transition: color 0.2s; }
  .op-flow-item:hover .op-flow-circle svg { color: #fff; }
  .op-flow-step {
    font-size: 11px; font-weight: 700;
    color: #1B50D9; letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 5px;
  }
  .op-flow-title {
    font-size: 14px; font-weight: 700;
    color: #111827; margin-bottom: 5px;
  }
  .op-flow-desc {
    font-size: 12.5px; color: #9CA3AF;
    line-height: 1.6; max-width: 170px;
    margin: 0 auto;
  }

  /* ── 가이드 그리드 ── */
  .op-guides {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 12px;
  }
  .op-guide-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #EBEBEB;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .op-guide-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 3px;
    background: #1B50D9;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .op-guide-card:hover {
    border-color: #C7D2FA;
    box-shadow: 0 4px 16px rgba(27,80,217,0.08);
    transform: translateY(-2px);
  }
  .op-guide-card:hover::after { opacity: 1; }

  .op-guide-top {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 12px;
  }
  .op-guide-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .op-guide-icon.blue   { background: #EEF2FF; color: #1B50D9; }
  .op-guide-icon.green  { background: #D1FAE5; color: #065F46; }
  .op-guide-icon.red    { background: #FEE2E2; color: #DC2626; }
  .op-guide-icon.slate  { background: #F3F4F6; color: #374151; }
  .op-guide-icon.purple { background: #EDE9FE; color: #7C3AED; }
  .op-guide-icon.teal   { background: #CCFBF1; color: #0D9488; }

  .op-guide-name {
    font-size: 14px; font-weight: 700;
    color: #111827;
  }
  .op-guide-desc {
    font-size: 13px; color: #6B7280;
    line-height: 1.7;
  }

  /* ── 공지 ── */
  .op-alert {
    background: #FFFBEB;
    border: 1.5px solid #FDE68A;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .op-alert-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: #FEF3C7;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #92400E;
  }
  .op-alert-title {
    font-size: 13px; font-weight: 700;
    color: #92400E; margin-bottom: 3px;
  }
  .op-alert-text {
    font-size: 13px; color: #92400E;
    line-height: 1.6; opacity: 0.75;
  }

  @media (max-width: 860px) {
    .op-flow { grid-template-columns: repeat(2, 1fr); gap: 24px; }
    .op-flow::before { display: none; }
  }
  @media (max-width: 640px) {
    .op-container { padding: 20px 16px 64px; }
    .op-flow { grid-template-columns: 1fr; gap: 16px; }
    .op-guides { grid-template-columns: 1fr; }
    .op-sec-text { font-size: 16px; }
  }
`;

const FLOW_ITEMS = [
  {
    Icon: QrCode,
    step: "Step 1",
    title: "QR 코드 제시",
    desc: "신청 완료 후 발급된 QR 코드를 입장 게이트에서 스캔해 주세요.",
  },
  {
    Icon: PawPrint,
    step: "Step 2",
    title: "반려동물 등록 확인",
    desc: "현장 데스크에서 반려동물 등록증 또는 예방접종 증명서를 확인합니다.",
  },
  {
    Icon: Map,
    step: "Step 3",
    title: "프로그램 참여",
    desc: "안내 지도를 수령 후 원하시는 부스 및 프로그램에 자유롭게 참여하세요.",
  },
  {
    Icon: Trash2,
    step: "Step 4",
    title: "매너 있는 관람",
    desc: "반려동물 배변 봉투는 현장에서 제공됩니다. 지정 배변 구역을 이용해 주세요.",
  },
];

const GUIDE_ITEMS = [
  {
    Icon: Dog,
    cls: "blue",
    title: "동반 가능 동물",
    desc: "개, 고양이, 소형 소동물 (케이지 지참 시). 공격성 있는 동물은 입장이 제한될 수 있습니다.",
  },
  {
    Icon: Syringe,
    cls: "green",
    title: "필수 서류",
    desc: "광견병 등 기본 예방접종 완료 증명서 지참 필수. 미지참 시 현장 입장이 거부될 수 있습니다.",
  },
  {
    Icon: ShieldCheck,
    cls: "slate",
    title: "목줄 / 하네스",
    desc: "모든 반려동물은 행사장 내 항상 목줄 또는 하네스를 착용해야 합니다.",
  },
  {
    Icon: Ban,
    cls: "red",
    title: "금지 사항",
    desc: "타인 동물에 대한 무단 접촉, 취식 물품 무단 급여, 지정 구역 외 배변은 금지됩니다.",
  },
  {
    Icon: ParkingCircle,
    cls: "purple",
    title: "주차 안내",
    desc: "행사장 내 주차 공간은 제한적입니다. 대중교통 이용을 권장하며, 주차는 선착순 운영됩니다.",
  },
  {
    Icon: Stethoscope,
    cls: "teal",
    title: "응급 처치",
    desc: "행사장 내 동물 응급 처치 부스가 운영됩니다. 긴급 상황 시 안내 데스크로 즉시 문의하세요.",
  },
];

export default function Operation({ onNavigate }) {
  const currentPath = "/guide/operation";

  return (
    <div className="op-root">
      <style>{styles}</style>
      <PageHeader
        title="현장 운영 안내"
        subtitle={GUIDE_SUBTITLE_MAP[currentPath]}
        categories={GUIDE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
      <main className="op-container">
        {/* 입장 절차 */}
        <div className="op-sec-label">
          <div className="op-sec-num">01</div>
          <h2 className="op-sec-text">입장 절차</h2>
        </div>
        <div className="op-flow-card">
          <div className="op-flow">
            {FLOW_ITEMS.map((item, i) => (
              <div key={i} className="op-flow-item">
                <div className="op-flow-circle">
                  <item.Icon size={24} />
                </div>
                <div className="op-flow-step">{item.step}</div>
                <div className="op-flow-title">{item.title}</div>
                <div className="op-flow-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 운영 가이드 */}
        <div className="op-sec-label" style={{ marginTop: 28 }}>
          <div className="op-sec-num">02</div>
          <h2 className="op-sec-text">운영 가이드</h2>
        </div>
        <div className="op-guides">
          {GUIDE_ITEMS.map((item) => (
            <div key={item.title} className="op-guide-card">
              <div className="op-guide-top">
                <div className={`op-guide-icon ${item.cls}`}>
                  <item.Icon size={20} />
                </div>
                <div className="op-guide-name">{item.title}</div>
              </div>
              <div className="op-guide-desc">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* 공지 */}
        <div className="op-alert">
          <div className="op-alert-icon">
            <AlertTriangle size={16} />
          </div>
          <div>
            <div className="op-alert-title">운영자 안내</div>
            <div className="op-alert-text">
              행사장 내 안내 스태프의 지시에 따라 주시기 바랍니다. 반복적인 규정
              위반 시 퇴장 조치될 수 있으며, 이로 인한 불이익은 주최 측에서
              책임지지 않습니다.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
