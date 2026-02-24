import { useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Receipt,
  ChevronDown,
} from "lucide-react";
export const SERVICE_CATEGORIES = [
  { label: "행사 참가 신청", path: "/registration/apply" },
  { label: "신청 내역 조회", path: "/registration/applyhistory" },
  { label: "결제 내역", path: "/registration/paymenthistory" },
  {
    label: "QR 체크인",
    path: "/registration/qrcheckin",
  },
];

export const SUBTITLE_MAP = {
  "/registration/apply": "행사에 참가 신청하세요",
  "/registration/applyhistory": "나의 행사 참가 신청 이력을 확인하세요",
  "/registration/paymenthistory": "결제 완료된 내역을 확인하세요",
  "/registration/qrcheckin": "내 QR 코드를 확인하세요",
};
/* ─────────────────────────────────────────────
   카드사 / 결제수단 SVG 아이콘 (유지)
───────────────────────────────────────────── */
const KBCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#FFB800" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="11"
      fontWeight="800"
      fill="#3C1A00"
      fontFamily="Arial,sans-serif"
    >
      KB
    </text>
  </svg>
);
const ShinhanCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#0046FF" />
    <path
      d="M9 14.5C9 12 11.5 10 14 10C16.5 10 18 11.5 18 11.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19 13.5C19 16 16.5 18 14 18C11.5 18 10 16.5 10 16.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const SamsungCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#1428A0" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="7.5"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      SAMSUNG
    </text>
  </svg>
);
const HyundaiCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#1A1A1A" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      HYUNDAI
    </text>
  </svg>
);
const LotteCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#ED1C24" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      LOTTE
    </text>
  </svg>
);
const HanaCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#009B77" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      HANA
    </text>
  </svg>
);
const WooriCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#0068B7" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      WOORI
    </text>
  </svg>
);
const NHCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#00843D" />
    <text
      x="14"
      y="17"
      textAnchor="middle"
      fontSize="10"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      NH
    </text>
  </svg>
);
const IBKCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#005BAC" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="10"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      IBK
    </text>
  </svg>
);
const BCCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#EF3E23" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="11"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      BC
    </text>
  </svg>
);
const KakaoPaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#FEE500" />
    <path
      d="M14 7C10.134 7 7 9.686 7 12.994C7 15.073 8.256 16.912 10.196 18.01L9.4 21L12.768 18.818C13.168 18.873 13.58 18.9 14 18.9C17.866 18.9 21 16.214 21 12.906C21 9.598 17.866 7 14 7Z"
      fill="#3A1D1D"
    />
  </svg>
);
const NaverPaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#03C75A" />
    <path d="M9 8H12.2L15.1 13.2V8H19V20H15.8L12.9 14.8V20H9V8Z" fill="white" />
  </svg>
);
const TossPaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#0064FF" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      TOSS
    </text>
  </svg>
);
const PaycoSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#FF0000" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      PAYCO
    </text>
  </svg>
);
const SamsungPaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#1428A0" />
    <text
      x="14"
      y="16"
      textAnchor="middle"
      fontSize="5.5"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      SAMSUNG
    </text>
    <text
      x="14"
      y="22"
      textAnchor="middle"
      fontSize="7"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      Pay
    </text>
  </svg>
);
const ApplePaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#000000" />
    <path
      d="M14.8 8.2C15.3 7.6 15.6 6.8 15.5 6C14.8 6.05 14 6.45 13.5 7.05C13.05 7.6 12.7 8.4 12.85 9.15C13.6 9.2 14.3 8.8 14.8 8.2Z"
      fill="white"
    />
    <path
      d="M17.15 13.75C17.15 11.55 18.85 10.55 18.9 10.5C17.85 8.95 16.2 8.75 15.6 8.7C14.2 8.55 12.9 9.5 12.2 9.5C11.5 9.5 10.4 8.7 9.2 8.75C7.7 8.8 6.3 9.6 5.55 10.9C4 13.5 5.1 17.35 6.6 19.45C7.35 20.5 8.2 21.65 9.4 21.6C10.55 21.55 11 20.85 12.4 20.85C13.8 20.85 14.2 21.6 15.45 21.55C16.65 21.5 17.4 20.5 18.15 19.45C18.65 18.75 18.9 18.05 18.95 18C18.9 17.95 17.15 17.3 17.15 13.75Z"
      fill="white"
    />
  </svg>
);
const BankTransferSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#F3F4F6" />
    <rect x="7" y="12" width="14" height="2" rx="1" fill="#6B7280" />
    <rect x="7" y="16" width="14" height="2" rx="1" fill="#6B7280" />
    <path d="M14 7L9 11H19L14 7Z" fill="#6B7280" />
  </svg>
);

const METHOD_ICON = {
  kb: <KBCardSVG />,
  shinhan: <ShinhanCardSVG />,
  samsung_card: <SamsungCardSVG />,
  hyundai: <HyundaiCardSVG />,
  lotte: <LotteCardSVG />,
  hana: <HanaCardSVG />,
  woori: <WooriCardSVG />,
  nh: <NHCardSVG />,
  ibk: <IBKCardSVG />,
  bc: <BCCardSVG />,
  kakao: <KakaoPaySVG />,
  naver: <NaverPaySVG />,
  toss: <TossPaySVG />,
  payco: <PaycoSVG />,
  samsung_pay: <SamsungPaySVG />,
  apple_pay: <ApplePaySVG />,
  bank: <BankTransferSVG />,
};

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const PAYMENTS = [
  {
    id: "PAY-20260312-001",
    event: "2026 봄 반려동물 페스티벌 - Day 1",
    method: "KB국민카드 ****1234",
    methodType: "kb",
    amount: 30000,
    date: "2026.03.12",
    time: "14:23",
    status: "완료",
  },
  {
    id: "PAY-20250901-007",
    event: "2025 가을 펫 엑스포",
    method: "카카오페이",
    methodType: "kakao",
    amount: 35000,
    date: "2025.09.01",
    time: "09:11",
    status: "완료",
  },
  {
    id: "PAY-20250322-003",
    event: "2025 봄 반려동물 페스티벌",
    method: "네이버페이",
    methodType: "naver",
    amount: 45000,
    date: "2025.03.22",
    time: "11:45",
    status: "완료",
  },
];

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .pay-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA; min-height: 100vh;
  }
  .pay-root *, .pay-root *::before, .pay-root *::after { box-sizing: border-box; font-family: inherit; }
  .pay-container { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }

  /* Stats */
  .pay-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
  .pay-stat {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    padding: 20px 18px; display: flex; flex-direction: column; gap: 4px;
  }
  .pay-stat-icon-wrap {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
  }
  .pay-stat-icon-wrap.blue  { background: #EEF2FF; color: #1B50D9; }
  .pay-stat-icon-wrap.green { background: #DCFCE7; color: #15803D; }
  .pay-stat-icon-wrap.amber { background: #FEF3C7; color: #B45309; }
  .pay-stat-value { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.8px; line-height: 1; }
  .pay-stat-label { font-size: 12px; color: #9CA3AF; font-weight: 500; margin-top: 3px; }

  /* Toolbar */
  .pay-toolbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
  .pay-title { font-size: 17px; font-weight: 800; color: #111827; letter-spacing: -0.3px; }
  .pay-sub { font-size: 13px; color: #9CA3AF; margin-top: 3px; }

  /* List */
  .pay-list { display: flex; flex-direction: column; gap: 10px; }

  /* Card */
  .pay-card {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    overflow: hidden; transition: box-shadow 0.2s;
  }
  .pay-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .pay-card-body { padding: 18px 20px; display: flex; align-items: center; gap: 16px; }
  .pay-card-method { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pay-card-method-name { font-size: 13.5px; color: #374151; font-weight: 500; white-space: nowrap; }
  .pay-card-info { flex: 1; min-width: 0; }
  .pay-card-event { font-size: 14px; font-weight: 700; color: #111827; line-height: 1.4; }
  .pay-card-id { font-size: 11px; color: #C9CDD4; font-family: 'Courier New', monospace; margin-top: 3px; }
  .pay-card-right { text-align: right; flex-shrink: 0; }
  .pay-card-amount { font-size: 17px; font-weight: 800; color: #1B50D9; letter-spacing: -0.5px; }
  .pay-card-date { font-size: 12px; color: #9CA3AF; margin-top: 3px; }

  .pay-card-footer {
    padding: 12px 20px; background: #FAFAFA; border-top: 1px solid #F3F4F6;
    display: flex; align-items: center; justify-content: space-between;
  }
  .pay-status-badge {
    padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700;
    background: #DCFCE7; color: #15803D;
    display: inline-flex; align-items: center; gap: 5px;
  }
  .pay-receipt-btn {
    padding: 6px 14px; font-size: 12px; font-weight: 600;
    border: 1.5px solid #EBEBEB; border-radius: 8px; background: #fff;
    color: #6B7280; cursor: pointer; font-family: inherit; transition: all 0.15s;
    display: flex; align-items: center; gap: 5px;
  }
  .pay-receipt-btn:hover { border-color: #9CA3AF; color: #374151; }

  /* Total row */
  .pay-total-card {
    background: #EEF2FF; border: 1.5px solid #C7D2FA; border-radius: 16px;
    padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;
    margin-top: 16px;
  }
  .pay-total-label { font-size: 14px; font-weight: 700; color: #374151; }
  .pay-total-amount { font-size: 22px; font-weight: 800; color: #1B50D9; letter-spacing: -0.8px; }

  @media (max-width: 640px) {
    .pay-stats { grid-template-columns: 1fr; }
    .pay-container { padding: 20px 16px 64px; }
  }
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function PaymentHistory({ onNavigate }) {
  const currentPath = "/registration/paymenthistory";
  const totalAmount = PAYMENTS.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="pay-root">
      <style>{styles}</style>

      <PageHeader
        title="결제 내역"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="pay-container">
        {/* Stats */}
        <div className="pay-stats">
          {[
            {
              icon: <CreditCard size={18} />,
              label: "총 결제 횟수",
              value: `${PAYMENTS.length}회`,
              cls: "blue",
            },
            {
              icon: <Banknote size={18} />,
              label: "누적 결제 금액",
              value: `${totalAmount.toLocaleString()}원`,
              cls: "green",
            },
            {
              icon: <CheckCircle2 size={18} />,
              label: "결제 완료",
              value: `${PAYMENTS.length}건`,
              cls: "amber",
            },
          ].map((s) => (
            <div key={s.label} className="pay-stat">
              <div className={`pay-stat-icon-wrap ${s.cls}`}>{s.icon}</div>
              <div className="pay-stat-value">{s.value}</div>
              <div className="pay-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="pay-toolbar">
          <div>
            <div className="pay-title">결제 내역</div>
            <div className="pay-sub">
              총 {PAYMENTS.length}건 · ₩{totalAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="pay-list">
          {PAYMENTS.map((p) => (
            <div key={p.id} className="pay-card">
              <div className="pay-card-body">
                <div className="pay-card-method">
                  {METHOD_ICON[p.methodType] || <BankTransferSVG />}
                  <span className="pay-card-method-name">{p.method}</span>
                </div>
                <div className="pay-card-info">
                  <div className="pay-card-event">{p.event}</div>
                  <div className="pay-card-id">{p.id}</div>
                </div>
                <div className="pay-card-right">
                  <div className="pay-card-amount">
                    ₩{p.amount.toLocaleString()}
                  </div>
                  <div className="pay-card-date">
                    {p.date} {p.time}
                  </div>
                </div>
              </div>
              <div className="pay-card-footer">
                <span className="pay-status-badge">
                  <CheckCircle2 size={11} /> 결제 완료
                </span>
                <button className="pay-receipt-btn">
                  <Receipt size={12} /> 영수증
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pay-total-card">
          <div className="pay-total-label">총 결제 금액</div>
          <div className="pay-total-amount">
            ₩ {totalAmount.toLocaleString()}
          </div>
        </div>
      </main>
    </div>
  );
}
