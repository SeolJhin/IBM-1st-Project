import { useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  FlagTriangleRight,
  XCircle,
  Calendar,
  Ticket,
  CreditCard,
  FileText,
  QrCode,
  X,
  MapPin,
  Download,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import PageHeader from "../components/PageHeader";

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

const RECORDS = [
  {
    id: "REG-2026-003847",
    event: "2026 봄 반려동물 페스티벌 - Day 1",
    date: "2026.04.12 (토)",
    time: "10:00~18:00",
    ticket: "일반 입장",
    qty: 2,
    amount: "30,000원",
    status: "confirmed",
    applied: "2026.03.12",
    location: "서울 올림픽공원 체조경기장",
    person: "홍길동",
  },
  {
    id: "REG-2025-009123",
    event: "2025 가을 펫 엑스포",
    date: "2025.09.21 (일)",
    time: "10:00~17:00",
    ticket: "VIP 패키지",
    qty: 1,
    amount: "35,000원",
    status: "done",
    applied: "2025.09.01",
    location: "COEX 홀 A",
    person: "홍길동",
  },
  {
    id: "REG-2025-004210",
    event: "2025 봄 반려동물 페스티벌",
    date: "2025.04.10 (목)",
    time: "10:00~18:00",
    ticket: "가족 패키지",
    qty: 1,
    amount: "45,000원",
    status: "cancelled",
    applied: "2025.03.22",
    location: "서울 올림픽공원 체조경기장",
    person: "홍길동",
  },
];

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

const STATUS_MAP = {
  confirmed: {
    label: "신청 완료",
    bg: "#DCFCE7",
    color: "#15803D",
    dot: "#16A34A",
  },
  done: { label: "행사 종료", bg: "#F3F4F6", color: "#6B7280", dot: "#D1D5DB" },
  cancelled: {
    label: "신청 취소",
    bg: "#FEE2E2",
    color: "#DC2626",
    dot: "#EF4444",
  },
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .hist-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable','Pretendard',-apple-system,sans-serif;
    background: #F5F6FA; min-height: 100vh;
  }
  .hist-root *, .hist-root *::before, .hist-root *::after { box-sizing: border-box; font-family: inherit; }
  .hist-container { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }

  /* Stats */
  .hist-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
  .hist-stat {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    padding: 18px 16px; display: flex; flex-direction: column; gap: 4px;
  }
  .hist-stat-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
  }
  .hist-stat-icon-wrap.blue  { background: #EEF2FF; color: #1B50D9; }
  .hist-stat-icon-wrap.green { background: #DCFCE7; color: #15803D; }
  .hist-stat-icon-wrap.amber { background: #FEF3C7; color: #B45309; }
  .hist-stat-icon-wrap.red   { background: #FEE2E2; color: #DC2626; }
  .hist-stat-value { font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -1px; line-height: 1; }
  .hist-stat-label { font-size: 12px; color: #9CA3AF; font-weight: 500; margin-top: 2px; }

  /* Toolbar */
  .hist-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .hist-title { font-size: 17px; font-weight: 800; color: #111827; letter-spacing: -0.3px; }
  .hist-sub { font-size: 13px; color: #9CA3AF; margin-top: 3px; }

  /* Filter */
  .hist-filter-bar { display: flex; gap: 7px; margin-bottom: 16px; flex-wrap: wrap; }
  .hist-filter-btn {
    padding: 7px 16px; border-radius: 100px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: 1.5px solid #EBEBEB; background: #fff; color: #6B7280;
    font-family: inherit; transition: all 0.15s;
  }
  .hist-filter-btn:hover { border-color: #C7D2FA; color: #1B50D9; }
  .hist-filter-btn.active { background: #EEF2FF; border-color: #1B50D9; color: #1B50D9; }

  /* List */
  .hist-list { display: flex; flex-direction: column; gap: 10px; }

  /* Card */
  .hist-card {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    overflow: hidden; transition: box-shadow 0.2s;
  }
  .hist-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

  .hist-card-top {
    padding: 18px 20px 14px;
    display: flex; gap: 12px; align-items: flex-start;
  }
  .hist-dot {
    width: 9px; height: 9px; border-radius: 50%; margin-top: 6px; flex-shrink: 0;
  }
  .hist-card-main { flex: 1; min-width: 0; }
  .hist-event-name { font-size: 15px; font-weight: 700; color: #111827; line-height: 1.4; }
  .hist-reg-id { font-size: 11.5px; color: #C9CDD4; font-family: 'Courier New', monospace; margin-top: 3px; }
  .hist-status-badge {
    padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700;
    flex-shrink: 0; letter-spacing: 0.02em;
  }

  .hist-card-meta {
    display: flex; flex-wrap: wrap; gap: 16px;
    padding: 13px 20px; background: #FAFAFA; border-top: 1px solid #F3F4F6;
    font-size: 13px; color: #6B7280;
  }
  .hist-meta-item { display: flex; align-items: center; gap: 5px; }

  .hist-card-actions {
    padding: 12px 20px; border-top: 1px solid #F3F4F6;
    display: flex; gap: 8px; align-items: center;
  }
  .hist-btn {
    padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: 10px;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .hist-btn-outline { border: 1.5px solid #EBEBEB; background: #fff; color: #374151; }
  .hist-btn-outline:hover { border-color: #9CA3AF; }
  .hist-btn-primary { border: none; background: #1B50D9; color: #fff; }
  .hist-btn-primary:hover { background: #1640B8; }

  /* Empty */
  .hist-empty { text-align: center; padding: 60px 24px; }
  .hist-empty-icon { display: flex; justify-content: center; margin-bottom: 16px; color: #E5E7EB; }
  .hist-empty-title { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 6px; }
  .hist-empty-desc { font-size: 14px; color: #9CA3AF; }

  /* QR Modal */
  .qr-overlay {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: qr-fade 0.16s ease;
  }
  @keyframes qr-fade { from { opacity: 0; } to { opacity: 1; } }
  .qr-modal {
    background: #fff; border-radius: 24px; width: 100%; max-width: 380px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.22);
    animation: qr-up 0.22s cubic-bezier(0.34,1.4,0.64,1);
    overflow: hidden;
  }
  @keyframes qr-up {
    from { transform: translateY(28px) scale(0.95); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }
  .qr-modal-header {
    padding: 20px 20px 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .qr-modal-title { font-size: 15px; font-weight: 800; color: #111827; }
  .qr-modal-close {
    width: 32px; height: 32px; border-radius: 9px;
    border: 1.5px solid #EBEBEB; background: #F9FAFB;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6B7280; transition: all 0.15s;
  }
  .qr-modal-close:hover { background: #F3F4F6; color: #111827; }
  .qr-modal-body { padding: 20px; text-align: center; }
  .qr-modal-qr-wrap {
    width: 196px; height: 196px; margin: 0 auto 14px;
    background: #fff; border: 1.5px solid #EBEBEB; border-radius: 16px;
    padding: 14px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .qr-modal-code { font-size: 13px; font-weight: 800; color: #1B50D9; font-family: 'Courier New', monospace; letter-spacing: 0.06em; margin-bottom: 3px; }
  .qr-modal-name { font-size: 13px; color: #9CA3AF; margin-bottom: 16px; }
  .qr-modal-info { background: #F5F8FF; border: 1.5px solid #DBEAFE; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; text-align: left; display: flex; flex-direction: column; gap: 8px; }
  .qr-modal-info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; }
  .qr-modal-info-row svg { color: #9CA3AF; flex-shrink: 0; }
  .qr-modal-actions { display: flex; gap: 8px; }
  .qr-modal-btn {
    flex: 1; padding: 10px 0; font-size: 13px; font-weight: 700;
    border-radius: 10px; cursor: pointer; font-family: inherit; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .qr-modal-btn-outline { border: 1.5px solid #EBEBEB; background: #fff; color: #374151; }
  .qr-modal-btn-outline:hover { border-color: #9CA3AF; }
  .qr-modal-btn-primary { border: none; background: #1B50D9; color: #fff; }
  .qr-modal-btn-primary:hover { background: #1640B8; }
  .qr-modal-btn-sms-sent { border: 1.5px solid #16A34A; background: #DCFCE7; color: #15803D; }

  @media (max-width: 640px) {
    .hist-stats { grid-template-columns: repeat(2, 1fr); }
    .hist-container { padding: 20px 16px 64px; }
  }
`;

/* QR Modal */
function QRModal({ record, onClose }) {
  const [smsSent, setSmsSent] = useState(false);

  const handleSendSMS = () => {
    const msg = encodeURIComponent(
      `[${record.event}]\n신청번호: ${record.id}\n행사일: ${record.date} ${record.time}\n장소: ${record.location}\n티켓: ${record.ticket} × ${record.qty}\n\n본 문자를 입구에서 제시해 주세요.`,
    );
    window.location.href = `sms:${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?"}body=${msg}`;
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  return (
    <div
      className="qr-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="qr-modal">
        <div className="qr-modal-header">
          <div className="qr-modal-title">QR 코드</div>
          <button className="qr-modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="qr-modal-body">
          <div className="qr-modal-qr-wrap">
            <svg
              viewBox="0 0 21 21"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", height: "100%" }}
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
          <div className="qr-modal-code">{record.id}</div>
          <div className="qr-modal-name">
            {record.person}님 · {record.ticket}
          </div>
          <div className="qr-modal-info">
            <div className="qr-modal-info-row">
              <Calendar size={13} />
              {record.date} {record.time}
            </div>
            <div className="qr-modal-info-row">
              <MapPin size={13} />
              {record.location}
            </div>
            <div className="qr-modal-info-row">
              <Ticket size={13} />
              {record.ticket} × {record.qty}
            </div>
          </div>
          <div className="qr-modal-actions">
            <button
              className={`qr-modal-btn ${smsSent ? "qr-modal-btn-sms-sent" : "qr-modal-btn-outline"}`}
              onClick={handleSendSMS}
            >
              <MessageSquare size={13} />
              {smsSent ? "발송됨!" : "문자 받기"}
            </button>
            <button className="qr-modal-btn qr-modal-btn-primary">
              <Download size={13} />
              이미지 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Main */
export default function ApplyHistory({ onNavigate, isLoggedIn = false }) {
  const [filter, setFilter] = useState("all");
  const [qrRecord, setQrRecord] = useState(null);
  const currentPath = "/registration/applyhistory";

  const filtered =
    filter === "all" ? RECORDS : RECORDS.filter((r) => r.status === filter);

  const stats = [
    {
      icon: <ClipboardList size={18} />,
      label: "전체 신청",
      value: `${RECORDS.length}건`,
      cls: "blue",
    },
    {
      icon: <CheckCircle2 size={18} />,
      label: "신청 완료",
      value: `${RECORDS.filter((r) => r.status === "confirmed").length}건`,
      cls: "green",
    },
    {
      icon: <FlagTriangleRight size={18} />,
      label: "종료된 행사",
      value: `${RECORDS.filter((r) => r.status === "done").length}건`,
      cls: "amber",
    },
    {
      icon: <XCircle size={18} />,
      label: "취소 내역",
      value: `${RECORDS.filter((r) => r.status === "cancelled").length}건`,
      cls: "red",
    },
  ];

  const FILTERS = [
    { key: "all", label: "전체" },
    { key: "confirmed", label: "신청 완료" },
    { key: "done", label: "행사 종료" },
    { key: "cancelled", label: "취소" },
  ];

  return (
    <div className="hist-root">
      <style>{styles}</style>

      {qrRecord && (
        <QRModal record={qrRecord} onClose={() => setQrRecord(null)} />
      )}

      <PageHeader
        title="신청 내역 조회"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="hist-container">
        {/* Stats */}
        <div className="hist-stats">
          {stats.map((s) => (
            <div key={s.label} className="hist-stat">
              <div className={`hist-stat-icon-wrap ${s.cls}`}>{s.icon}</div>
              <div className="hist-stat-value">{s.value}</div>
              <div className="hist-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar + Filter */}
        <div className="hist-toolbar">
          <div>
            <div className="hist-title">신청 내역</div>
            <div className="hist-sub">총 {filtered.length}건</div>
          </div>
        </div>

        <div className="hist-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`hist-filter-btn${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="hist-list">
          {filtered.length === 0 ? (
            <div className="hist-card">
              <div className="hist-empty">
                <div className="hist-empty-icon">
                  <FileText size={48} />
                </div>
                <div className="hist-empty-title">내역이 없습니다</div>
                <div className="hist-empty-desc">
                  선택하신 조건의 신청 내역이 없어요
                </div>
              </div>
            </div>
          ) : (
            filtered.map((r) => {
              const s = STATUS_MAP[r.status];
              return (
                <div key={r.id} className="hist-card">
                  <div className="hist-card-top">
                    <div className="hist-dot" style={{ background: s.dot }} />
                    <div className="hist-card-main">
                      <div className="hist-event-name">{r.event}</div>
                      <div className="hist-reg-id">{r.id}</div>
                    </div>
                    <span
                      className="hist-status-badge"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>

                  <div className="hist-card-meta">
                    <span className="hist-meta-item">
                      <Calendar size={13} /> {r.date}
                    </span>
                    <span className="hist-meta-item">
                      <Ticket size={13} /> {r.ticket} × {r.qty}
                    </span>
                    <span className="hist-meta-item">
                      <CreditCard size={13} /> {r.amount}
                    </span>
                    <span className="hist-meta-item">
                      <FileText size={13} /> 신청 {r.applied}
                    </span>
                  </div>

                  {r.status === "confirmed" && (
                    <div className="hist-card-actions">
                      <button className="hist-btn hist-btn-outline">
                        <XCircle size={13} /> 취소 신청
                      </button>
                      <button
                        className="hist-btn hist-btn-primary"
                        onClick={() => setQrRecord(r)}
                      >
                        <QrCode size={13} /> QR 코드 보기
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
