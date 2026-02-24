import { useState, useEffect } from "react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .mp-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .mp-root *, .mp-root *::before, .mp-root *::after { box-sizing: border-box; font-family: inherit; }
  .mp-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* ── Page Header ── */
  .mp-page-header {
    background: #fff;
    border-bottom: 1px solid #e9ecef;
    padding: 80px 0 0;
  }
  .mp-page-header-inner {
    max-width: 1400px; margin: 0 auto; padding: 0 24px;
  }
  .mp-page-title {
    font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 4px;
  }
  .mp-page-subtitle {
    font-size: 13.5px; color: #6b7280; font-weight: 400; margin: 0 0 20px;
  }
  .mp-page-tabs {
    display: flex; gap: 0; border-bottom: none;
  }
  .mp-page-tab {
    padding: 10px 20px; font-size: 13.5px; font-weight: 600;
    color: #6b7280; background: none; border: none; cursor: pointer;
    border-bottom: 2.5px solid transparent; font-family: inherit;
    transition: all 0.15s;
  }
  .mp-page-tab:hover { color: #1a4fd6; }
  .mp-page-tab.active {
    color: #1a4fd6; border-bottom-color: #1a4fd6;
  }

  /* ── Profile Card ── */
  .mp-profile-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 14px;
    padding: 28px 32px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 24px;
    transition: box-shadow 0.2s;
  }
  .mp-profile-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
  .mp-avatar {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #1a4fd6 0%, #3b82f6 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 800; color: #fff; flex-shrink: 0;
    position: relative;
  }
  .mp-avatar-badge {
    position: absolute; bottom: -2px; right: -2px;
    width: 22px; height: 22px; border-radius: 50%;
    background: #10b981; border: 3px solid #fff;
    display: flex; align-items: center; justify-content: center;
  }
  .mp-profile-info { flex: 1; }
  .mp-profile-name { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 4px; }
  .mp-profile-email { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
  .mp-profile-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .mp-profile-tag {
    font-size: 11px; font-weight: 600; padding: 4px 10px;
    border-radius: 100px; display: inline-flex; align-items: center; gap: 4px;
  }
  .mp-profile-actions { display: flex; gap: 8px; }
  .mp-btn {
    padding: 10px 20px; border-radius: 10px; font-size: 13px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.15s; border: none;
  }
  .mp-btn:active { transform: scale(0.97); }
  .mp-btn-primary {
    background: #1a4fd6; color: #fff;
  }
  .mp-btn-primary:hover { background: #1640b0; }
  .mp-btn-outline {
    background: #fff; color: #374151; border: 1.5px solid #e2e8f0;
  }
  .mp-btn-outline:hover { border-color: #1a4fd6; color: #1a4fd6; background: #f5f8ff; }
  .mp-btn-danger-text {
    background: none; color: #9ca3af; border: none; font-size: 12px;
    cursor: pointer; font-family: inherit; padding: 8px 12px;
  }
  .mp-btn-danger-text:hover { color: #ef4444; }

  /* ── Stat Cards ── */
  .mp-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
  .mp-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 20px 22px; display: flex; align-items: center; gap: 14px;
    transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;
  }
  .mp-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
  .mp-stat-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mp-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 3px; }
  .mp-stat-value { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }

  /* ── Cards ── */
  .mp-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 24px 28px; margin-bottom: 16px;
  }
  .mp-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5;
  }
  .mp-card-title {
    font-size: 15px; font-weight: 700; color: #111827;
    display: flex; align-items: center; gap: 8px; margin: 0;
  }
  .mp-card-title-icon {
    width: 26px; height: 26px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
  }
  .mp-card-tag {
    font-size: 11px; font-weight: 600; color: #6b7280;
    background: #f3f4f6; padding: 4px 10px; border-radius: 100px;
  }
  .mp-card-tag-blue {
    background: #eff4ff; color: #1a4fd6;
  }

  /* ── Two-col ── */
  .mp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* ── Event list ── */
  .mp-event-list { display: flex; flex-direction: column; gap: 10px; }
  .mp-event-item {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 18px; border: 1.5px solid #eceef3; border-radius: 12px;
    transition: all 0.15s;
  }
  .mp-event-item:hover { border-color: #c7d2fe; background: #fafbff; }
  .mp-event-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }
  .mp-event-info { flex: 1; }
  .mp-event-name { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 3px; }
  .mp-event-meta { font-size: 12px; color: #9ca3af; }
  .mp-event-status {
    font-size: 11px; font-weight: 700; padding: 4px 10px;
    border-radius: 100px;
  }
  .mp-status-confirmed { background: #ecfdf5; color: #10b981; }
  .mp-status-pending { background: #fffbeb; color: #f59e0b; }
  .mp-status-cancelled { background: #fef2f2; color: #ef4444; }
  .mp-status-completed { background: #f3f4f6; color: #6b7280; }
  .mp-event-action {
    background: none; border: 1.5px solid #e2e8f0; border-radius: 8px;
    padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .mp-event-action:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

  /* ── QR Code ── */
  .mp-qr-section {
    display: flex; align-items: center; gap: 28px;
  }
  .mp-qr-box {
    width: 140px; height: 140px; border-radius: 14px;
    border: 2px solid #e9ecef; background: #fff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative; overflow: hidden;
  }
  .mp-qr-grid {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
    width: 90px; height: 90px;
  }
  .mp-qr-cell {
    border-radius: 1.5px;
  }
  .mp-qr-info { flex: 1; }
  .mp-qr-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 6px; }
  .mp-qr-desc { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 14px; }
  .mp-qr-actions { display: flex; gap: 8px; }

  /* ── Notification list ── */
  .mp-notif-list { display: flex; flex-direction: column; gap: 0; }
  .mp-notif-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 0; border-bottom: 1px solid #f3f4f6;
  }
  .mp-notif-item:last-child { border-bottom: none; }
  .mp-notif-icon {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    margin-top: 2px;
  }
  .mp-notif-content { flex: 1; }
  .mp-notif-text { font-size: 13px; color: #374151; line-height: 1.5; margin-bottom: 3px; }
  .mp-notif-time { font-size: 11.5px; color: #9ca3af; }
  .mp-notif-unread { position: relative; }
  .mp-notif-unread::after {
    content: ''; position: absolute; top: 16px; right: 0;
    width: 7px; height: 7px; border-radius: 50%; background: #1a4fd6;
  }

  /* ── Inquiry list ── */
  .mp-inquiry-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 0; border-bottom: 1px solid #f3f4f6;
  }
  .mp-inquiry-item:last-child { border-bottom: none; }
  .mp-inquiry-q {
    font-size: 11px; font-weight: 800; color: #1a4fd6;
    background: #eff4ff; width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mp-inquiry-info { flex: 1; }
  .mp-inquiry-title { font-size: 13.5px; font-weight: 600; color: #111827; margin-bottom: 3px; }
  .mp-inquiry-date { font-size: 11.5px; color: #9ca3af; }
  .mp-inquiry-status {
    font-size: 11px; font-weight: 700; padding: 4px 10px;
    border-radius: 100px;
  }
  .mp-inquiry-answered { background: #ecfdf5; color: #10b981; }
  .mp-inquiry-waiting { background: #fffbeb; color: #f59e0b; }

  /* ── Settings row ── */
  .mp-settings-list { display: flex; flex-direction: column; gap: 0; }
  .mp-setting-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0; border-bottom: 1px solid #f3f4f6;
  }
  .mp-setting-item:last-child { border-bottom: none; }
  .mp-setting-left { display: flex; align-items: center; gap: 12px; }
  .mp-setting-icon {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .mp-setting-label { font-size: 13.5px; font-weight: 600; color: #374151; }
  .mp-setting-desc { font-size: 11.5px; color: #9ca3af; margin-top: 2px; }
  .mp-toggle {
    width: 44px; height: 24px; border-radius: 100px;
    border: none; cursor: pointer; position: relative;
    transition: background 0.2s;
  }
  .mp-toggle.on { background: #1a4fd6; }
  .mp-toggle.off { background: #d1d5db; }
  .mp-toggle-knob {
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff; position: absolute; top: 3px;
    transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .mp-toggle.on .mp-toggle-knob { left: 23px; }
  .mp-toggle.off .mp-toggle-knob { left: 3px; }

  /* ── Animations ── */
  .mp-fade-in {
    opacity: 0; transform: translateY(12px);
    animation: mp-fade-up 0.5s ease forwards;
  }
  @keyframes mp-fade-up {
    to { opacity: 1; transform: translateY(0); }
  }
  .mp-pop {
    opacity: 0; transform: scale(0.95);
    animation: mp-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  @keyframes mp-pop-in {
    to { opacity: 1; transform: scale(1); }
  }

  /* ── Empty state ── */
  .mp-empty {
    text-align: center; padding: 32px 0; color: #9ca3af; font-size: 13px;
  }
  .mp-empty-icon {
    font-size: 32px; margin-bottom: 8px; opacity: 0.4;
  }

  @media (max-width: 900px) {
    .mp-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .mp-two-col { grid-template-columns: 1fr; }
    .mp-profile-card { flex-direction: column; text-align: center; }
    .mp-profile-tags { justify-content: center; }
    .mp-profile-actions { justify-content: center; }
    .mp-qr-section { flex-direction: column; text-align: center; }
    .mp-qr-actions { justify-content: center; }
  }
  @media (max-width: 640px) {
    .mp-container { padding: 20px 16px 48px; }
    .mp-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .mp-profile-card { padding: 24px 20px; }
  }
`;

/* ── Mock Data ── */
const USER_DATA = {
  name: "김민수",
  email: "minsu.kim@email.com",
  phone: "010-1234-5678",
  joinDate: "2024.03.15",
  initial: "김",
};

const MY_EVENTS = [
  {
    id: 1,
    name: "2025 서울 펫 페스티벌",
    date: "2025.03.15 (토)",
    location: "COEX 전시홀 A",
    status: "confirmed",
    color: "#10b981",
  },
  {
    id: 2,
    name: "반려동물 건강 세미나",
    date: "2025.03.22 (토)",
    location: "삼성동 컨벤션센터",
    status: "pending",
    color: "#f59e0b",
  },
  {
    id: 3,
    name: "2024 부산 펫쇼",
    date: "2024.11.10 (일)",
    location: "BEXCO 제1전시장",
    status: "completed",
    color: "#6b7280",
  },
];

const PAST_EVENTS = [
  {
    id: 4,
    name: "2024 서울 펫 페스티벌",
    date: "2024.03.16 (토)",
    location: "COEX 전시홀 B",
    status: "completed",
    color: "#6b7280",
  },
  {
    id: 5,
    name: "펫 용품 박람회 2024",
    date: "2024.06.01 (토)",
    location: "킨텍스 제2전시장",
    status: "completed",
    color: "#6b7280",
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    text: "2025 서울 펫 페스티벌 참가 신청이 확정되었습니다.",
    time: "1시간 전",
    icon: "✓",
    iconBg: "#ecfdf5",
    iconColor: "#10b981",
    unread: true,
  },
  {
    id: 2,
    text: "반려동물 건강 세미나 일정이 변경되었습니다. 확인해주세요.",
    time: "3시간 전",
    icon: "!",
    iconBg: "#fffbeb",
    iconColor: "#f59e0b",
    unread: true,
  },
  {
    id: 3,
    text: "베스트 드레서 콘테스트 투표가 시작되었습니다.",
    time: "1일 전",
    icon: "★",
    iconBg: "#f5f3ff",
    iconColor: "#8b5cf6",
    unread: false,
  },
  {
    id: 4,
    text: "문의하신 내용에 대한 답변이 등록되었습니다.",
    time: "2일 전",
    icon: "↩",
    iconBg: "#eff4ff",
    iconColor: "#1a4fd6",
    unread: false,
  },
  {
    id: 5,
    text: "2024 부산 펫쇼 참여 후기를 작성해주세요.",
    time: "3일 전",
    icon: "✎",
    iconBg: "#f3f4f6",
    iconColor: "#6b7280",
    unread: false,
  },
];

const INQUIRIES = [
  {
    id: 1,
    title: "체험존 사전 예약 관련 문의드립니다",
    date: "2025.02.20",
    status: "answered",
  },
  {
    id: 2,
    title: "주차 할인 적용 방법이 궁금합니다",
    date: "2025.02.18",
    status: "waiting",
  },
  {
    id: 3,
    title: "반려동물 동반 입장 규정 확인",
    date: "2025.01.15",
    status: "answered",
  },
];

const STATUS_MAP = {
  confirmed: { label: "확정", className: "mp-status-confirmed" },
  pending: { label: "승인대기", className: "mp-status-pending" },
  cancelled: { label: "취소", className: "mp-status-cancelled" },
  completed: { label: "완료", className: "mp-status-completed" },
};

/* ── QR Pattern Generator ── */
const QR_PATTERN = [
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [0, 1, 0, 1, 0, 1, 0],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
];

/* ── SVG Icons (inline to avoid lucide dependency issues) ── */
const Icon = ({ d, size = 16, color = "currentColor", strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const Icons = {
  user: (props) => (
    <Icon
      {...props}
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
    />
  ),
  calendar: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  clock: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  qr: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <rect x="19" y="14" width="2" height="2" />
      <rect x="14" y="19" width="2" height="2" />
      <rect x="19" y="19" width="2" height="2" />
    </svg>
  ),
  bell: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  mail: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  check: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  settings: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  edit: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  chevronRight: (props) => <Icon {...props} d="M9 18l6-6-6-6" />,
  download: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  history: (props) => (
    <svg
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    </svg>
  ),
};

/* ── Toggle Component ── */
function Toggle({ value, onChange }) {
  return (
    <button
      className={`mp-toggle ${value ? "on" : "off"}`}
      onClick={() => onChange(!value)}
    >
      <div className="mp-toggle-knob" />
    </button>
  );
}

/* ── CountUp Hook (matching existing pattern) ── */
function useCountUp(target, duration = 800, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return val;
}

/* ── Tab Sections ── */
const TABS = [
  { key: "overview", label: "내 정보" },
  { key: "events", label: "신청 행사" },
  { key: "history", label: "참여 이력" },
  { key: "qr", label: "내 QR코드" },
  { key: "notifications", label: "알림" },
  { key: "inquiries", label: "문의 내역" },
  { key: "settings", label: "설정" },
];

/* ── Main MyPage Component ── */
export default function MyPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [eventReminder, setEventReminder] = useState(true);

  const statEventCount = useCountUp(3, 800, 200);
  const statParticipated = useCountUp(5, 800, 350);
  const statReviews = useCountUp(2, 800, 500);
  const statQrUsed = useCountUp(12, 800, 650);

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="mp-root">
      <style>{styles}</style>

      {/* ── Page Header ── */}
      <div className="mp-page-header">
        <div className="mp-page-header-inner">
          <h1 className="mp-page-title">마이페이지</h1>
          <p className="mp-page-subtitle">
            내 정보와 참여 이력을 한눈에 관리합니다
          </p>
          <div className="mp-page-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`mp-page-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.key === "notifications" && unreadCount > 0 && (
                  <span
                    style={{
                      display: "inline-block",
                      marginLeft: 6,
                      padding: "1px 7px",
                      borderRadius: 100,
                      fontSize: 10,
                      fontWeight: 700,
                      background:
                        activeTab === "notifications" ? "#1a4fd6" : "#ef4444",
                      color: "#fff",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="mp-container">
        {/* ── Profile Card (always visible on overview) ── */}
        {activeTab === "overview" && (
          <div className="mp-fade-in">
            <div className="mp-profile-card">
              <div className="mp-avatar">
                {USER_DATA.initial}
                <div className="mp-avatar-badge">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <div className="mp-profile-info">
                <div className="mp-profile-name">{USER_DATA.name}</div>
                <div className="mp-profile-email">{USER_DATA.email}</div>
                <div className="mp-profile-tags">
                  <span
                    className="mp-profile-tag"
                    style={{ background: "#eff4ff", color: "#1a4fd6" }}
                  >
                    일반 회원
                  </span>
                  <span
                    className="mp-profile-tag"
                    style={{ background: "#ecfdf5", color: "#10b981" }}
                  >
                    가입일 {USER_DATA.joinDate}
                  </span>
                </div>
              </div>
              <div className="mp-profile-actions">
                <button
                  className="mp-btn mp-btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icons.edit size={14} color="#fff" />내 정보 수정
                </button>
                <button
                  className="mp-btn mp-btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icons.qr size={14} />
                  QR코드
                </button>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="mp-stat-grid">
              {[
                {
                  label: "신청 행사",
                  value: statEventCount,
                  suffix: "건",
                  iconBg: "#eff4ff",
                  iconColor: "#1a4fd6",
                  iconEl: <Icons.calendar size={20} color="#1a4fd6" />,
                },
                {
                  label: "참여 완료",
                  value: statParticipated,
                  suffix: "건",
                  iconBg: "#ecfdf5",
                  iconColor: "#10b981",
                  iconEl: <Icons.check size={20} color="#10b981" />,
                },
                {
                  label: "작성 후기",
                  value: statReviews,
                  suffix: "건",
                  iconBg: "#f5f3ff",
                  iconColor: "#8b5cf6",
                  iconEl: <Icons.edit size={20} color="#8b5cf6" />,
                },
                {
                  label: "QR 사용",
                  value: statQrUsed,
                  suffix: "회",
                  iconBg: "#fffbeb",
                  iconColor: "#f59e0b",
                  iconEl: <Icons.qr size={20} color="#f59e0b" />,
                },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="mp-stat-card mp-pop"
                  style={{ animationDelay: `${i * 80 + 100}ms` }}
                >
                  <div
                    className="mp-stat-icon"
                    style={{ background: s.iconBg }}
                  >
                    {s.iconEl}
                  </div>
                  <div>
                    <div className="mp-stat-label">{s.label}</div>
                    <div className="mp-stat-value">
                      {s.value}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#6b7280",
                          marginLeft: 2,
                        }}
                      >
                        {s.suffix}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mp-two-col">
              {/* 최근 신청 */}
              <div className="mp-card">
                <div className="mp-card-header">
                  <div className="mp-card-title">
                    <div
                      className="mp-card-title-icon"
                      style={{ background: "#eff4ff" }}
                    >
                      <Icons.calendar size={14} color="#1a4fd6" />
                    </div>
                    최근 신청 행사
                  </div>
                  <span className="mp-card-tag mp-card-tag-blue">
                    {MY_EVENTS.length}건
                  </span>
                </div>
                <div className="mp-event-list">
                  {MY_EVENTS.slice(0, 3).map((evt) => {
                    const st = STATUS_MAP[evt.status];
                    return (
                      <div key={evt.id} className="mp-event-item">
                        <div
                          className="mp-event-dot"
                          style={{ background: evt.color }}
                        />
                        <div className="mp-event-info">
                          <div className="mp-event-name">{evt.name}</div>
                          <div className="mp-event-meta">
                            {evt.date} · {evt.location}
                          </div>
                        </div>
                        <span className={`mp-event-status ${st.className}`}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 최근 알림 */}
              <div className="mp-card">
                <div className="mp-card-header">
                  <div className="mp-card-title">
                    <div
                      className="mp-card-title-icon"
                      style={{ background: "#fffbeb" }}
                    >
                      <Icons.bell size={14} color="#f59e0b" />
                    </div>
                    최근 알림
                  </div>
                  <span className="mp-card-tag">{unreadCount}건 안읽음</span>
                </div>
                <div className="mp-notif-list">
                  {NOTIFICATIONS.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      className={`mp-notif-item${n.unread ? " mp-notif-unread" : ""}`}
                    >
                      <div
                        className="mp-notif-icon"
                        style={{
                          background: n.iconBg,
                          color: n.iconColor,
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {n.icon}
                      </div>
                      <div className="mp-notif-content">
                        <div className="mp-notif-text">{n.text}</div>
                        <div className="mp-notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 신청 행사 Tab ── */}
        {activeTab === "events" && (
          <div className="mp-fade-in">
            <div className="mp-card">
              <div className="mp-card-header">
                <div className="mp-card-title">
                  <div
                    className="mp-card-title-icon"
                    style={{ background: "#eff4ff" }}
                  >
                    <Icons.calendar size={14} color="#1a4fd6" />
                  </div>
                  신청 행사 목록
                </div>
                <span className="mp-card-tag mp-card-tag-blue">
                  {MY_EVENTS.length}건
                </span>
              </div>
              <div className="mp-event-list">
                {MY_EVENTS.map((evt) => {
                  const st = STATUS_MAP[evt.status];
                  return (
                    <div key={evt.id} className="mp-event-item">
                      <div
                        className="mp-event-dot"
                        style={{ background: evt.color }}
                      />
                      <div className="mp-event-info">
                        <div className="mp-event-name">{evt.name}</div>
                        <div className="mp-event-meta">
                          {evt.date} · {evt.location}
                        </div>
                      </div>
                      <span className={`mp-event-status ${st.className}`}>
                        {st.label}
                      </span>
                      {(evt.status === "confirmed" ||
                        evt.status === "pending") && (
                        <button className="mp-event-action">취소</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 참여 이력 Tab ── */}
        {activeTab === "history" && (
          <div className="mp-fade-in">
            <div className="mp-card">
              <div className="mp-card-header">
                <div className="mp-card-title">
                  <div
                    className="mp-card-title-icon"
                    style={{ background: "#ecfdf5" }}
                  >
                    <Icons.history size={14} color="#10b981" />
                  </div>
                  참여 이력
                </div>
                <span className="mp-card-tag">
                  {PAST_EVENTS.length +
                    MY_EVENTS.filter((e) => e.status === "completed").length}
                  건 완료
                </span>
              </div>
              <div className="mp-event-list">
                {[
                  ...MY_EVENTS.filter((e) => e.status === "completed"),
                  ...PAST_EVENTS,
                ].map((evt) => (
                  <div key={evt.id} className="mp-event-item">
                    <div
                      className="mp-event-dot"
                      style={{ background: evt.color }}
                    />
                    <div className="mp-event-info">
                      <div className="mp-event-name">{evt.name}</div>
                      <div className="mp-event-meta">
                        {evt.date} · {evt.location}
                      </div>
                    </div>
                    <span className="mp-event-status mp-status-completed">
                      완료
                    </span>
                    <button
                      className="mp-btn mp-btn-outline"
                      style={{ padding: "6px 14px", fontSize: 11 }}
                    >
                      후기 작성
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── QR코드 Tab ── */}
        {activeTab === "qr" && (
          <div className="mp-fade-in">
            <div className="mp-card">
              <div className="mp-card-header">
                <div className="mp-card-title">
                  <div
                    className="mp-card-title-icon"
                    style={{ background: "#eff4ff" }}
                  >
                    <Icons.qr size={14} color="#1a4fd6" />
                  </div>
                  내 QR코드
                </div>
                <span className="mp-card-tag mp-card-tag-blue">활성</span>
              </div>
              <div className="mp-qr-section">
                <div
                  className="mp-qr-box mp-pop"
                  style={{ animationDelay: "150ms" }}
                >
                  <div className="mp-qr-grid">
                    {QR_PATTERN.flat().map((cell, i) => (
                      <div
                        key={i}
                        className="mp-qr-cell"
                        style={{
                          background: cell ? "#1a4fd6" : "#f1f3f5",
                          borderRadius: cell ? 2 : 1,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mp-qr-info">
                  <div className="mp-qr-title">행사 입장용 QR코드</div>
                  <div className="mp-qr-desc">
                    행사 현장에서 이 QR코드를 제시하면 빠르게 체크인할 수
                    있습니다.
                    <br />
                    QR코드는 신청 행사별로 자동 발급됩니다.
                  </div>
                  <div className="mp-qr-actions">
                    <button
                      className="mp-btn mp-btn-primary"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Icons.download size={14} color="#fff" />
                      QR코드 저장
                    </button>
                    <button className="mp-btn mp-btn-outline">
                      QR코드 재발급
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 알림 Tab ── */}
        {activeTab === "notifications" && (
          <div className="mp-fade-in">
            <div className="mp-card">
              <div className="mp-card-header">
                <div className="mp-card-title">
                  <div
                    className="mp-card-title-icon"
                    style={{ background: "#fffbeb" }}
                  >
                    <Icons.bell size={14} color="#f59e0b" />
                  </div>
                  전체 알림
                </div>
                <span className="mp-card-tag">{NOTIFICATIONS.length}건</span>
              </div>
              <div className="mp-notif-list">
                {NOTIFICATIONS.map((n, i) => (
                  <div
                    key={n.id}
                    className={`mp-notif-item${n.unread ? " mp-notif-unread" : ""}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div
                      className="mp-notif-icon"
                      style={{
                        background: n.iconBg,
                        color: n.iconColor,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {n.icon}
                    </div>
                    <div className="mp-notif-content">
                      <div className="mp-notif-text">{n.text}</div>
                      <div className="mp-notif-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 문의 내역 Tab ── */}
        {activeTab === "inquiries" && (
          <div className="mp-fade-in">
            <div className="mp-card">
              <div className="mp-card-header">
                <div className="mp-card-title">
                  <div
                    className="mp-card-title-icon"
                    style={{ background: "#eff4ff" }}
                  >
                    <Icons.mail size={14} color="#1a4fd6" />
                  </div>
                  내 문의 내역
                </div>
                <button
                  className="mp-btn mp-btn-primary"
                  style={{ padding: "8px 16px", fontSize: 12 }}
                >
                  + 새 문의
                </button>
              </div>
              <div>
                {INQUIRIES.map((inq) => (
                  <div key={inq.id} className="mp-inquiry-item">
                    <div className="mp-inquiry-q">Q</div>
                    <div className="mp-inquiry-info">
                      <div className="mp-inquiry-title">{inq.title}</div>
                      <div className="mp-inquiry-date">{inq.date}</div>
                    </div>
                    <span
                      className={`mp-inquiry-status ${inq.status === "answered" ? "mp-inquiry-answered" : "mp-inquiry-waiting"}`}
                    >
                      {inq.status === "answered" ? "답변완료" : "대기중"}
                    </span>
                    <Icons.chevronRight size={16} color="#9ca3af" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 설정 Tab ── */}
        {activeTab === "settings" && (
          <div className="mp-fade-in">
            <div className="mp-two-col">
              <div className="mp-card">
                <div className="mp-card-header">
                  <div className="mp-card-title">
                    <div
                      className="mp-card-title-icon"
                      style={{ background: "#eff4ff" }}
                    >
                      <Icons.bell size={14} color="#1a4fd6" />
                    </div>
                    알림 설정
                  </div>
                </div>
                <div className="mp-settings-list">
                  <div className="mp-setting-item">
                    <div className="mp-setting-left">
                      <div
                        className="mp-setting-icon"
                        style={{ background: "#eff4ff" }}
                      >
                        <Icons.bell size={16} color="#1a4fd6" />
                      </div>
                      <div>
                        <div className="mp-setting-label">푸시 알림</div>
                        <div className="mp-setting-desc">
                          행사 관련 알림을 받습니다
                        </div>
                      </div>
                    </div>
                    <Toggle value={pushNotif} onChange={setPushNotif} />
                  </div>
                  <div className="mp-setting-item">
                    <div className="mp-setting-left">
                      <div
                        className="mp-setting-icon"
                        style={{ background: "#f5f3ff" }}
                      >
                        <Icons.mail size={16} color="#8b5cf6" />
                      </div>
                      <div>
                        <div className="mp-setting-label">이메일 알림</div>
                        <div className="mp-setting-desc">
                          이메일로 소식을 받습니다
                        </div>
                      </div>
                    </div>
                    <Toggle value={emailNotif} onChange={setEmailNotif} />
                  </div>
                  <div className="mp-setting-item">
                    <div className="mp-setting-left">
                      <div
                        className="mp-setting-icon"
                        style={{ background: "#ecfdf5" }}
                      >
                        <Icons.clock size={16} color="#10b981" />
                      </div>
                      <div>
                        <div className="mp-setting-label">행사 리마인더</div>
                        <div className="mp-setting-desc">
                          행사 1일 전 알림을 받습니다
                        </div>
                      </div>
                    </div>
                    <Toggle value={eventReminder} onChange={setEventReminder} />
                  </div>
                </div>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div className="mp-card">
                  <div className="mp-card-header">
                    <div className="mp-card-title">
                      <div
                        className="mp-card-title-icon"
                        style={{ background: "#f3f4f6" }}
                      >
                        <Icons.user size={14} color="#6b7280" />
                      </div>
                      계정 관리
                    </div>
                  </div>
                  <div className="mp-settings-list">
                    <div
                      className="mp-setting-item"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="mp-setting-left">
                        <div
                          className="mp-setting-icon"
                          style={{ background: "#eff4ff" }}
                        >
                          <Icons.edit size={16} color="#1a4fd6" />
                        </div>
                        <div>
                          <div className="mp-setting-label">내 정보 수정</div>
                          <div className="mp-setting-desc">
                            이름, 이메일, 연락처 변경
                          </div>
                        </div>
                      </div>
                      <Icons.chevronRight size={16} color="#9ca3af" />
                    </div>
                    <div
                      className="mp-setting-item"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="mp-setting-left">
                        <div
                          className="mp-setting-icon"
                          style={{ background: "#f3f4f6" }}
                        >
                          <Icons.settings size={16} color="#6b7280" />
                        </div>
                        <div>
                          <div className="mp-setting-label">비밀번호 변경</div>
                          <div className="mp-setting-desc">
                            계정 비밀번호를 변경합니다
                          </div>
                        </div>
                      </div>
                      <Icons.chevronRight size={16} color="#9ca3af" />
                    </div>
                  </div>
                </div>

                <div className="mp-card" style={{ borderColor: "#fecaca" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#ef4444",
                          marginBottom: 4,
                        }}
                      >
                        회원 탈퇴
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        탈퇴 시 모든 데이터가 삭제됩니다
                      </div>
                    </div>
                    <button
                      className="mp-btn-danger-text"
                      style={{ fontSize: 13, fontWeight: 600 }}
                    >
                      탈퇴하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
