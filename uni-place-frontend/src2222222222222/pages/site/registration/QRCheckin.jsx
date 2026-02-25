import { useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  Smartphone,
  Hash,
  Calendar,
  MapPin,
  Ticket,
  ShieldCheck,
  MessageSquare,
  Download,
  CheckCircle2,
  QrCode,
  Info,
  Clock,
} from "lucide-react";
/* ─────────────────────────────────────────────
   QR 패턴 (장식용)
───────────────────────────────────────────── */
const QR_MATRIX = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0],
  [1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1],
  [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1],
];
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
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .qr-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA; min-height: 100vh;
  }
  .qr-root *, .qr-root *::before, .qr-root *::after { box-sizing: border-box; font-family: inherit; }
  .qr-container { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }

  .qr-page-title { font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 4px; letter-spacing: -0.3px; }
  .qr-page-sub { font-size: 13px; color: #9CA3AF; margin-bottom: 20px; }

  .qr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .qr-card {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px; padding: 24px;
  }
  .qr-card-title {
    font-size: 14px; font-weight: 800; color: #111827;
    margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #F3F4F6;
    display: flex; align-items: center; gap: 9px;
  }
  .qr-card-title-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: #EEF2FF; display: flex; align-items: center; justify-content: center; color: #1B50D9;
  }

  /* QR Display */
  .qr-display-wrap { text-align: center; }
  .qr-box {
    width: 176px; height: 176px; margin: 0 auto 14px;
    background: #fff; border: 1.5px solid #EBEBEB; border-radius: 16px;
    padding: 14px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  }
  .qr-svg { width: 100%; height: 100%; }
  .qr-code-num {
    font-size: 13px; font-weight: 800; color: #1B50D9;
    font-family: 'Courier New', monospace; letter-spacing: 0.06em; margin-bottom: 3px;
  }
  .qr-event-name { font-size: 12.5px; color: #6B7280; }
  .qr-person-name { font-size: 12px; color: #C9CDD4; margin-bottom: 18px; margin-top: 2px; }

  /* Ticket info */
  .qr-ticket-info {
    background: #F5F8FF; border: 1.5px solid #DBEAFE; border-radius: 12px;
    padding: 14px 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;
  }
  .qr-ticket-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
  .qr-ticket-label { display: flex; align-items: center; gap: 6px; color: #9CA3AF; }
  .qr-ticket-val { font-weight: 700; color: #111827; }
  .qr-status-ok { display: flex; align-items: center; gap: 5px; color: #15803D; font-weight: 700; font-size: 13px; }

  /* Buttons */
  .qr-btn-row { display: flex; gap: 8px; }
  .qr-btn {
    flex: 1; padding: 10px 0; font-size: 13px; font-weight: 700;
    border-radius: 10px; cursor: pointer; font-family: inherit; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .qr-btn-outline { border: 1.5px solid #EBEBEB; background: #fff; color: #374151; }
  .qr-btn-outline:hover { border-color: #9CA3AF; }
  .qr-btn-primary { border: none; background: #1B50D9; color: #fff; }
  .qr-btn-primary:hover { background: #1640B8; }
  .qr-btn-sent { border: 1.5px solid #16A34A; background: #DCFCE7; color: #15803D; }

  /* Input section */
  .qr-input-desc { font-size: 13px; color: #6B7280; margin-bottom: 18px; line-height: 1.6; }
  .qr-label { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 7px; display: block; letter-spacing: 0.01em; }
  .qr-input {
    width: 100%; height: 42px; padding: 0 14px;
    border: 1.5px solid #EBEBEB; border-radius: 10px;
    font-size: 14px; color: #111827; outline: none;
    font-family: 'Courier New', monospace; background: #fff;
    letter-spacing: 0.05em; transition: border-color 0.15s;
    margin-bottom: 10px;
  }
  .qr-input:focus { border-color: #1B50D9; box-shadow: 0 0 0 3px rgba(27,80,217,0.1); }
  .qr-input::placeholder { font-family: 'Pretendard Variable', sans-serif; letter-spacing: 0; color: #C9CDD4; }

  .qr-submit-btn {
    width: 100%; padding: 12px 0; font-size: 14px; font-weight: 700;
    background: #1B50D9; color: #fff; border: none; border-radius: 10px;
    cursor: pointer; font-family: inherit; transition: background 0.15s; margin-bottom: 16px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .qr-submit-btn:hover { background: #1640B8; }
  .qr-submit-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Result */
  .qr-result-ok {
    padding: 14px 16px; background: #DCFCE7; border: 1.5px solid #86EFAC; border-radius: 12px;
  }
  .qr-result-title { font-size: 14px; font-weight: 800; color: #15803D; margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
  .qr-result-body { font-size: 13px; color: #166534; line-height: 1.6; }
  .qr-result-time { font-size: 11.5px; color: #15803D; margin-top: 6px; display: block; opacity: 0.8; }

  /* Notice */
  .qr-notice { margin-top: 22px; padding-top: 18px; border-top: 1px solid #F3F4F6; }
  .qr-notice-title { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
  .qr-notice-item { font-size: 12.5px; color: #9CA3AF; line-height: 2; display: flex; align-items: flex-start; gap: 6px; }
  .qr-notice-dot { width: 3px; height: 3px; border-radius: 50%; background: #D1D5DB; flex-shrink: 0; margin-top: 9px; }

  @media (max-width: 680px) {
    .qr-grid { grid-template-columns: 1fr; }
    .qr-container { padding: 20px 16px 64px; }
  }
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function QRCheckin({ onNavigate }) {
  const currentPath = "/registration/qrcheckin";
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleCheckin = () => {
    if (code.trim()) setChecked(true);
  };

  const handleSendSMS = () => {
    const phoneNumber = "01012345678";
    const message = encodeURIComponent(
      "[2026 봄 반려동물 페스티벌]\n신청번호: REG-2026-003847\n행사일: 2026.04.12 (토) 10:00~18:00\n장소: 서울 올림픽공원 체조경기장\n티켓: 일반 입장 × 2\n\n본 문자를 행사 당일 입구에서 제시해 주세요.",
    );
    const smsUrl = `sms:${phoneNumber}${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?"}body=${message}`;
    window.location.href = smsUrl;
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  const NOTICES = [
    "QR 코드는 행사 시작 1시간 전부터 유효합니다",
    "1회 스캔 후 재사용이 불가합니다",
    "본인 확인을 위해 신분증을 지참해 주세요",
    "문의: 02-1234-5678 (평일 09:00~18:00)",
  ];

  return (
    <div className="qr-root">
      <style>{styles}</style>

      <PageHeader
        title="QR 체크인"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="qr-container">
        <div className="qr-page-title">QR 체크인</div>
        <div className="qr-page-sub">
          행사 당일 QR 코드를 제시하거나 신청번호를 직접 입력하세요
        </div>

        <div className="qr-grid">
          {/* 왼쪽: 나의 QR 코드 */}
          <div className="qr-card">
            <div className="qr-card-title">
              <div className="qr-card-title-icon">
                <Smartphone size={14} />
              </div>
              나의 QR 코드
            </div>

            <div className="qr-display-wrap">
              <div className="qr-box">
                <svg
                  className="qr-svg"
                  viewBox="0 0 21 21"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {QR_MATRIX.map((row, ri) =>
                    row.map((cell, ci) =>
                      cell === 1 ? (
                        <rect
                          key={`${ri}-${ci}`}
                          x={ci}
                          y={ri}
                          width="1"
                          height="1"
                          fill="#111827"
                          rx="0.08"
                        />
                      ) : null,
                    ),
                  )}
                </svg>
              </div>
              <div className="qr-code-num">REG-2026-003847</div>
              <div className="qr-event-name">
                2026 봄 반려동물 페스티벌 - Day 1
              </div>
              <div className="qr-person-name">홍길동 · 일반 입장</div>
            </div>

            <div className="qr-ticket-info">
              <div className="qr-ticket-row">
                <span className="qr-ticket-label">
                  <Calendar size={13} /> 행사일
                </span>
                <span className="qr-ticket-val">
                  2026.04.12 (토) 10:00~18:00
                </span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-label">
                  <MapPin size={13} /> 장소
                </span>
                <span className="qr-ticket-val">서울 올림픽공원</span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-label">
                  <Ticket size={13} /> 티켓
                </span>
                <span className="qr-ticket-val">일반 입장 × 2</span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-label">
                  <ShieldCheck size={13} /> 상태
                </span>
                <span className="qr-status-ok">
                  <CheckCircle2 size={13} /> 입장 가능
                </span>
              </div>
            </div>

            <div className="qr-btn-row">
              <button
                className={`qr-btn ${smsSent ? "qr-btn-sent" : "qr-btn-outline"}`}
                onClick={handleSendSMS}
              >
                <MessageSquare size={13} />
                {smsSent ? "발송됨!" : "문자 받기"}
              </button>
              <button className="qr-btn qr-btn-primary">
                <Download size={13} />
                이미지 저장
              </button>
            </div>
          </div>

          {/* 오른쪽: 신청번호 체크인 */}
          <div className="qr-card">
            <div className="qr-card-title">
              <div className="qr-card-title-icon">
                <Hash size={14} />
              </div>
              신청번호 체크인
            </div>

            <div className="qr-input-desc">
              신청 확인 이메일에 포함된 신청번호를 입력하시면 바로 체크인됩니다.
            </div>

            <label className="qr-label">신청번호</label>
            <input
              className="qr-input"
              placeholder="REG-XXXX-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckin()}
            />

            <button
              className="qr-submit-btn"
              disabled={!code.trim()}
              onClick={handleCheckin}
            >
              <QrCode size={15} />
              체크인 확인
            </button>

            {checked && (
              <div className="qr-result-ok">
                <div className="qr-result-title">
                  <CheckCircle2 size={16} />
                  체크인이 완료되었습니다!
                </div>
                <div className="qr-result-body">
                  2026 봄 반려동물 페스티벌 - Day 1<br />
                  홍길동님 · 일반 입장 × 2
                  <span className="qr-result-time">
                    <Clock
                      size={11}
                      style={{ display: "inline", marginRight: 4 }}
                    />
                    입장 처리 시각: {new Date().toLocaleTimeString("ko-KR")}
                  </span>
                </div>
              </div>
            )}

            <div className="qr-notice">
              <div className="qr-notice-title">
                <Info size={13} color="#9CA3AF" />
                안내사항
              </div>
              {NOTICES.map((n, i) => (
                <div key={i} className="qr-notice-item">
                  <div className="qr-notice-dot" />
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
