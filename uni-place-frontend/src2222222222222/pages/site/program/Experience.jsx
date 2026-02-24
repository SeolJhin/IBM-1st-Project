import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EventSelectPage from "../components/EventSelectPage";
import {
  SERVICE_CATEGORIES,
  SUBTITLE_MAP,
  SAMPLE_EVENTS,
} from "../constants/programConstants";
import {
  Palette,
  Users,
  Clock,
  Star,
  Heart,
  CheckCircle2,
  ChevronRight,
  Ticket,
  Sparkles,
  Timer,
  MapPin,
  CalendarDays,
} from "lucide-react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ex-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .ex-root *, .ex-root *::before, .ex-root *::after { box-sizing: border-box; font-family: inherit; }
  .ex-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .ex-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .ex-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: ex-pulse 1.4s ease-in-out infinite;
  }
  @keyframes ex-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .ex-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .ex-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px;
    display: flex; align-items: center; gap: 14px;
  }
  .ex-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ex-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .ex-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .ex-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .ex-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .ex-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .ex-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .ex-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  .ex-program-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .ex-program-card {
    border: 1px solid #e9ecef; border-radius: 12px; padding: 20px;
    background: #fff; transition: all 0.15s; position: relative; overflow: hidden;
  }
  .ex-program-card:hover { border-color: #c7d2fe; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .ex-program-card.featured { border-color: #f59e0b; }
  .ex-program-card.featured::before {
    content: '인기'; position: absolute; top: 12px; right: 12px;
    background: #fef3c7; color: #d97706; font-size: 10px; font-weight: 700;
    padding: 2px 8px; border-radius: 100px;
  }
  .ex-program-card.registered { border-color: #1a4fd6; background: #fafbff; }
  .ex-program-card.registered::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #1a4fd6, #6366f1);
  }
  .ex-program-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .ex-program-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ex-program-name { font-size: 15px; font-weight: 700; color: #111827; }
  .ex-program-category { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .ex-program-desc { font-size: 12.5px; color: #6b7280; line-height: 1.5; margin-bottom: 14px; }
  .ex-program-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #9ca3af; }
  .ex-program-meta-item { display: flex; align-items: center; gap: 4px; }
  .ex-program-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f3f5; }
  .ex-program-capacity { font-size: 12px; color: #6b7280; }
  .ex-program-capacity strong { color: #111827; font-weight: 700; }
  .ex-cap-bar { width: 80px; height: 5px; background: #f1f3f5; border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .ex-cap-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
  .ex-program-badge {
    padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600;
  }
  .ex-program-badge.open { background: #ecfdf5; color: #059669; }
  .ex-program-badge.full { background: #fff0f0; color: #ef4444; }
  .ex-program-badge.soon { background: #eff4ff; color: #1a4fd6; }

  /* Action buttons */
  .ex-action-area { margin-top: 14px; display: flex; gap: 8px; }
  .ex-btn {
    flex: 1; padding: 10px 0; border-radius: 8px; font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; transition: all 0.15s; display: flex;
    align-items: center; justify-content: center; gap: 6px;
  }
  .ex-btn:active { transform: scale(0.97); }
  .ex-btn-register {
    background: #1a4fd6; color: #fff;
  }
  .ex-btn-register:hover { background: #1640b0; }
  .ex-btn-register:disabled {
    background: #d1d5db; color: #9ca3af; cursor: not-allowed;
  }
  .ex-btn-register:disabled:active { transform: none; }
  .ex-btn-cancel {
    background: #fff; color: #ef4444; border: 1px solid #fecaca;
  }
  .ex-btn-cancel:hover { background: #fff5f5; }
  .ex-btn-registered {
    background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;
    cursor: default; flex: 1;
  }
  .ex-btn-cancel-small {
    background: #fff; color: #ef4444; border: 1px solid #fecaca;
    width: auto; flex: none; padding: 10px 16px;
  }
  .ex-btn-cancel-small:hover { background: #fff5f5; }

  /* Modal */
  .ex-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; animation: ex-fade-in 0.15s ease;
    backdrop-filter: blur(4px);
  }
  @keyframes ex-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .ex-modal {
    background: #fff; border-radius: 16px; padding: 32px; width: 400px;
    max-width: calc(100vw - 32px); box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    animation: ex-modal-slide 0.2s ease;
  }
  @keyframes ex-modal-slide {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ex-modal-icon {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .ex-modal-title { font-size: 18px; font-weight: 800; color: #111827; text-align: center; margin-bottom: 6px; }
  .ex-modal-sub { font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5; margin-bottom: 24px; }
  .ex-modal-info {
    background: #f8f9fc; border-radius: 10px; padding: 16px; margin-bottom: 24px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .ex-modal-info-row {
    display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151;
  }
  .ex-modal-info-row svg { color: #9ca3af; flex-shrink: 0; }
  .ex-modal-info-label { color: #9ca3af; width: 52px; flex-shrink: 0; font-size: 12px; }
  .ex-modal-btns { display: flex; gap: 10px; }
  .ex-modal-btn {
    flex: 1; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700;
    border: none; cursor: pointer; transition: all 0.15s;
  }
  .ex-modal-btn:active { transform: scale(0.97); }
  .ex-modal-btn-secondary { background: #f3f4f6; color: #374151; }
  .ex-modal-btn-secondary:hover { background: #e5e7eb; }
  .ex-modal-btn-primary { background: #1a4fd6; color: #fff; }
  .ex-modal-btn-primary:hover { background: #1640b0; }
  .ex-modal-btn-danger { background: #ef4444; color: #fff; }
  .ex-modal-btn-danger:hover { background: #dc2626; }

  /* Toast */
  .ex-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #111827; color: #fff; padding: 14px 24px; border-radius: 12px;
    font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2); z-index: 1100;
    animation: ex-toast-in 0.3s ease;
  }
  @keyframes ex-toast-in {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  .ex-toast.out { animation: ex-toast-out 0.3s ease forwards; }
  @keyframes ex-toast-out {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to { opacity: 0; transform: translateX(-50%) translateY(16px); }
  }

  /* My registrations card */
  .ex-my-card { background: linear-gradient(135deg, #1a4fd6 0%, #4f46e5 100%); border: none; color: #fff; margin-bottom: 16px; }
  .ex-my-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .ex-my-title { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .ex-my-count { font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 100px; }
  .ex-my-list { display: flex; flex-direction: column; gap: 8px; }
  .ex-my-item {
    background: rgba(255,255,255,0.12); border-radius: 10px; padding: 14px 16px;
    display: flex; align-items: center; justify-content: space-between;
    backdrop-filter: blur(8px);
  }
  .ex-my-item-left { display: flex; align-items: center; gap: 12px; }
  .ex-my-item-icon {
    width: 34px; height: 34px; border-radius: 8px; background: rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
  }
  .ex-my-item-name { font-size: 14px; font-weight: 700; }
  .ex-my-item-meta { font-size: 11px; opacity: 0.7; margin-top: 2px; }
  .ex-my-cancel-btn {
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
    color: #fff; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
  }
  .ex-my-cancel-btn:hover { background: rgba(239,68,68,0.3); border-color: rgba(239,68,68,0.5); }
  .ex-my-empty { text-align: center; padding: 20px; opacity: 0.7; font-size: 13px; }

  /* Timeline */
  .ex-timeline { display: flex; flex-direction: column; gap: 0; }
  .ex-timeline-item { display: flex; gap: 14px; padding: 14px 0; }
  .ex-timeline-line { display: flex; flex-direction: column; align-items: center; width: 20px; }
  .ex-timeline-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .ex-timeline-dot.active { background: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.15); }
  .ex-timeline-dot.done { background: #10b981; }
  .ex-timeline-dot.upcoming { background: #d1d5db; }
  .ex-timeline-connector { width: 2px; flex: 1; background: #e9ecef; margin-top: 4px; }
  .ex-timeline-content { flex: 1; padding-bottom: 8px; }
  .ex-timeline-time { font-size: 11px; font-weight: 700; color: #1a4fd6; margin-bottom: 2px; }
  .ex-timeline-time.done { color: #10b981; }
  .ex-timeline-time.upcoming { color: #9ca3af; }
  .ex-timeline-name { font-size: 14px; font-weight: 700; color: #111827; }
  .ex-timeline-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }

  @media (max-width: 900px) {
    .ex-program-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .ex-container { padding: 20px 16px 48px; }
    .ex-stat-grid { grid-template-columns: 1fr 1fr; }
    .ex-modal { padding: 24px; }
  }
`;

const INITIAL_PROGRAMS = [
  {
    id: 1,
    name: "반려견 아지리티 체험",
    category: "스포츠",
    desc: "장애물 코스를 함께 달리며 반려견과의 유대감을 높이는 체험",
    time: "10:00~18:00",
    zone: "야외 운동장",
    current: 18,
    max: 20,
    status: "open",
    featured: true,
    bg: "#eff4ff",
    color: "#1a4fd6",
  },
  {
    id: 2,
    name: "펫 쿠킹 클래스",
    category: "요리",
    desc: "수의영양사와 함께 건강한 수제 간식을 직접 만들어보는 체험",
    time: "11:00~12:00",
    zone: "B동 2층",
    current: 15,
    max: 15,
    status: "full",
    featured: true,
    bg: "#fef3c7",
    color: "#d97706",
  },
  {
    id: 3,
    name: "반려동물 마사지 교실",
    category: "힐링",
    desc: "전문가에게 배우는 올바른 반려동물 마사지 기법",
    time: "13:00~14:00",
    zone: "힐링센터",
    current: 8,
    max: 12,
    status: "open",
    featured: false,
    bg: "#fce7f3",
    color: "#ec4899",
  },
  {
    id: 4,
    name: "펫 포토 스냅 촬영",
    category: "사진",
    desc: "전문 포토그래퍼와 함께하는 반려동물 프로필 사진 촬영",
    time: "14:30~16:00",
    zone: "A동 포토존",
    current: 0,
    max: 10,
    status: "soon",
    featured: false,
    bg: "#f5f3ff",
    color: "#8b5cf6",
  },
  {
    id: 5,
    name: "강아지 수영 체험",
    category: "스포츠",
    desc: "안전한 환경에서 반려견 수영을 체험할 수 있는 프로그램",
    time: "15:00~17:00",
    zone: "야외 수영장",
    current: 12,
    max: 16,
    status: "open",
    featured: true,
    bg: "#ecfdf5",
    color: "#10b981",
  },
  {
    id: 6,
    name: "핸드메이드 목걸이 만들기",
    category: "공예",
    desc: "세상에 하나뿐인 반려동물 이름 목걸이를 직접 제작",
    time: "16:00~17:30",
    zone: "공예 체험관",
    current: 0,
    max: 20,
    status: "soon",
    featured: false,
    bg: "#fff7ed",
    color: "#f59e0b",
  },
];

const TIMELINE = [
  {
    time: "10:00",
    name: "반려견 아지리티 체험",
    zone: "야외 운동장",
    status: "active",
  },
  { time: "11:00", name: "펫 쿠킹 클래스", zone: "B동 2층", status: "done" },
  {
    time: "13:00",
    name: "반려동물 마사지 교실",
    zone: "힐링센터",
    status: "active",
  },
  {
    time: "14:30",
    name: "펫 포토 스냅 촬영",
    zone: "A동 포토존",
    status: "upcoming",
  },
  {
    time: "15:00",
    name: "강아지 수영 체험",
    zone: "야외 수영장",
    status: "upcoming",
  },
  {
    time: "16:00",
    name: "핸드메이드 목걸이 만들기",
    zone: "공예 체험관",
    status: "upcoming",
  },
];

const STATUS_LABEL = { open: "참여 가능", full: "마감", soon: "예정" };

const ClockIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const MapPinIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const UsersIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const PaletteIcon = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="13.5" cy="6.5" r="0.5" fill={color} />
    <circle cx="17.5" cy="10.5" r="0.5" fill={color} />
    <circle cx="8.5" cy="7.5" r="0.5" fill={color} />
    <circle cx="6.5" cy="12.5" r="0.5" fill={color} />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);
const TicketIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 17v2" />
    <path d="M13 11v2" />
  </svg>
);
const StarIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const SparklesIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
const CalendarIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
const CheckIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const XIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
const UserPlusIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);

function ExperienceDetail() {
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS);
  const [registered, setRegistered] = useState(new Set());
  const [modal, setModal] = useState(null); // { type: 'register' | 'cancel', program }
  const [toast, setToast] = useState(null);
  const [toastOut, setToastOut] = useState(false);
  const navigate = useNavigate();
  const currentPath = "/program/experience";

  const showToast = (msg, icon) => {
    setToastOut(false);
    setToast({ msg, icon });
    setTimeout(() => setToastOut(true), 2200);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRegister = (program) => {
    setModal({ type: "register", program });
  };

  const handleCancel = (program) => {
    setModal({ type: "cancel", program });
  };

  const confirmRegister = () => {
    const p = modal.program;
    setRegistered((prev) => new Set([...prev, p.id]));
    setPrograms((prev) =>
      prev.map((prog) => {
        if (prog.id !== p.id) return prog;
        const newCurrent = prog.current + 1;
        return {
          ...prog,
          current: newCurrent,
          status: newCurrent >= prog.max ? "full" : prog.status,
        };
      }),
    );
    setModal(null);
    showToast(`'${p.name}' 참가 신청이 완료되었습니다!`, "check");
  };

  const confirmCancel = () => {
    const p = modal.program;
    setRegistered((prev) => {
      const next = new Set(prev);
      next.delete(p.id);
      return next;
    });
    setPrograms((prev) =>
      prev.map((prog) => {
        if (prog.id !== p.id) return prog;
        const newCurrent = prog.current - 1;
        return {
          ...prog,
          current: newCurrent,
          status: newCurrent < prog.max ? "open" : prog.status,
        };
      }),
    );
    setModal(null);
    showToast(`'${p.name}' 참가가 취소되었습니다.`, "x");
  };

  const registeredPrograms = programs.filter((p) => registered.has(p.id));
  const openCount = programs.filter((p) => p.status === "open").length;
  const totalParticipants = programs.reduce((sum, p) => sum + p.current, 0);

  return (
    <div className="ex-root">
      <style>{styles}</style>
      <PageHeader
        title="체험존 안내"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
      />
      <main className="ex-container">
        <div className="ex-live-badge">
          <div className="ex-live-dot" />
          LIVE
        </div>

        {/* Stats */}
        <div className="ex-stat-grid">
          {[
            {
              label: "전체 프로그램",
              value: `${programs.length}개`,
              icon: <PaletteIcon size={20} color="#8b5cf6" />,
              bg: "#f5f3ff",
            },
            {
              label: "참여 가능",
              value: `${openCount}개`,
              icon: <TicketIcon size={20} />,
              bg: "#ecfdf5",
              iconColor: "#10b981",
            },
            {
              label: "오늘 참여자",
              value: `${totalParticipants}명`,
              icon: <UsersIcon size={20} />,
              bg: "#eff4ff",
              iconColor: "#1a4fd6",
            },
            {
              label: "평균 만족도",
              value: "4.8",
              icon: <StarIcon size={20} />,
              bg: "#fffbeb",
              iconColor: "#f59e0b",
            },
          ].map((s) => (
            <div key={s.label} className="ex-stat-card">
              <div
                className="ex-stat-icon"
                style={{ background: s.bg, color: s.iconColor }}
              >
                {s.icon}
              </div>
              <div>
                <div className="ex-stat-label">{s.label}</div>
                <div className="ex-stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* My Registrations */}
        {registeredPrograms.length > 0 && (
          <div className="ex-card ex-my-card">
            <div className="ex-my-header">
              <div className="ex-my-title">
                <CheckIcon size={16} /> 나의 참가 신청
              </div>
              <span className="ex-my-count">{registeredPrograms.length}건</span>
            </div>
            <div className="ex-my-list">
              {registeredPrograms.map((p) => (
                <div key={p.id} className="ex-my-item">
                  <div className="ex-my-item-left">
                    <div className="ex-my-item-icon">
                      <PaletteIcon size={16} color="#fff" />
                    </div>
                    <div>
                      <div className="ex-my-item-name">{p.name}</div>
                      <div className="ex-my-item-meta">
                        {p.time} · {p.zone}
                      </div>
                    </div>
                  </div>
                  <button
                    className="ex-my-cancel-btn"
                    onClick={() => handleCancel(p)}
                  >
                    취소
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Program Grid */}
        <div className="ex-card">
          <div className="ex-card-header">
            <div className="ex-card-title">
              <div className="ex-card-title-icon">
                <SparklesIcon size={14} />
              </div>
              체험 프로그램
            </div>
            <span className="ex-card-tag">총 {programs.length}개</span>
          </div>
          <div className="ex-program-grid">
            {programs.map((p) => {
              const isRegistered = registered.has(p.id);
              const canRegister = p.status === "open" && !isRegistered;
              const isFull = p.status === "full" && !isRegistered;
              const isSoon = p.status === "soon";

              return (
                <div
                  key={p.id}
                  className={`ex-program-card${p.featured && !isRegistered ? " featured" : ""}${isRegistered ? " registered" : ""}`}
                >
                  <div className="ex-program-top">
                    <div
                      className="ex-program-icon"
                      style={{ background: p.bg }}
                    >
                      <PaletteIcon size={18} color={p.color} />
                    </div>
                    <div>
                      <div className="ex-program-name">{p.name}</div>
                      <div className="ex-program-category">{p.category}</div>
                    </div>
                  </div>
                  <div className="ex-program-desc">{p.desc}</div>
                  <div className="ex-program-meta">
                    <span className="ex-program-meta-item">
                      <ClockIcon size={11} /> {p.time}
                    </span>
                    <span className="ex-program-meta-item">
                      <MapPinIcon size={11} /> {p.zone}
                    </span>
                  </div>
                  <div className="ex-program-footer">
                    <div className="ex-program-capacity">
                      <strong>{p.current}</strong> / {p.max}명
                      <div className="ex-cap-bar">
                        <div
                          className="ex-cap-fill"
                          style={{
                            width: `${(p.current / p.max) * 100}%`,
                            background:
                              p.current >= p.max ? "#ef4444" : "#1a4fd6",
                          }}
                        />
                      </div>
                    </div>
                    <span className={`ex-program-badge ${p.status}`}>
                      {isRegistered ? "신청 완료" : STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  {/* Action Buttons */}
                  <div className="ex-action-area">
                    {isRegistered ? (
                      <>
                        <div className="ex-btn ex-btn-registered">
                          <CheckIcon size={14} /> 참가 신청 완료
                        </div>
                        <button
                          className="ex-btn ex-btn-cancel-small"
                          onClick={() => handleCancel(p)}
                        >
                          <XIcon size={13} /> 취소
                        </button>
                      </>
                    ) : canRegister ? (
                      <button
                        className="ex-btn ex-btn-register"
                        onClick={() => handleRegister(p)}
                      >
                        <UserPlusIcon size={14} /> 참가 신청
                      </button>
                    ) : isFull ? (
                      <button className="ex-btn ex-btn-register" disabled>
                        마감되었습니다
                      </button>
                    ) : isSoon ? (
                      <button className="ex-btn ex-btn-register" disabled>
                        오픈 예정
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="ex-card">
          <div className="ex-card-header">
            <div className="ex-card-title">
              <div className="ex-card-title-icon">
                <CalendarIcon size={14} />
              </div>
              오늘 체험 타임라인
            </div>
            <span className="ex-card-tag">6개 프로그램</span>
          </div>
          <div className="ex-timeline">
            {TIMELINE.map((t, i) => (
              <div key={t.time + t.name} className="ex-timeline-item">
                <div className="ex-timeline-line">
                  <div className={`ex-timeline-dot ${t.status}`} />
                  {i < TIMELINE.length - 1 && (
                    <div className="ex-timeline-connector" />
                  )}
                </div>
                <div className="ex-timeline-content">
                  <div className={`ex-timeline-time ${t.status}`}>{t.time}</div>
                  <div className="ex-timeline-name">{t.name}</div>
                  <div className="ex-timeline-sub">{t.zone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Register Modal */}
      {modal && modal.type === "register" && (
        <div className="ex-modal-overlay" onClick={() => setModal(null)}>
          <div className="ex-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="ex-modal-icon"
              style={{ background: modal.program.bg }}
            >
              <UserPlusIcon size={24} />
            </div>
            <div className="ex-modal-title">참가 신청</div>
            <div className="ex-modal-sub">
              아래 프로그램에 참가 신청하시겠습니까?
            </div>
            <div className="ex-modal-info">
              <div className="ex-modal-info-row">
                <PaletteIcon size={14} color="#9ca3af" />
                <span className="ex-modal-info-label">프로그램</span>
                <strong>{modal.program.name}</strong>
              </div>
              <div className="ex-modal-info-row">
                <ClockIcon size={14} />
                <span className="ex-modal-info-label">시간</span>
                {modal.program.time}
              </div>
              <div className="ex-modal-info-row">
                <MapPinIcon size={14} />
                <span className="ex-modal-info-label">장소</span>
                {modal.program.zone}
              </div>
              <div className="ex-modal-info-row">
                <UsersIcon size={14} />
                <span className="ex-modal-info-label">잔여</span>
                {modal.program.max - modal.program.current}명 남음
              </div>
            </div>
            <div className="ex-modal-btns">
              <button
                className="ex-modal-btn ex-modal-btn-secondary"
                onClick={() => setModal(null)}
              >
                돌아가기
              </button>
              <button
                className="ex-modal-btn ex-modal-btn-primary"
                onClick={confirmRegister}
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {modal && modal.type === "cancel" && (
        <div className="ex-modal-overlay" onClick={() => setModal(null)}>
          <div className="ex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ex-modal-icon" style={{ background: "#fff0f0" }}>
              <XIcon size={24} />
            </div>
            <div className="ex-modal-title">참가 취소</div>
            <div className="ex-modal-sub">
              정말 참가를 취소하시겠습니까?
              <br />
              취소 후 다시 신청할 수 있습니다.
            </div>
            <div className="ex-modal-info">
              <div className="ex-modal-info-row">
                <PaletteIcon size={14} color="#9ca3af" />
                <span className="ex-modal-info-label">프로그램</span>
                <strong>{modal.program.name}</strong>
              </div>
              <div className="ex-modal-info-row">
                <ClockIcon size={14} />
                <span className="ex-modal-info-label">시간</span>
                {modal.program.time}
              </div>
              <div className="ex-modal-info-row">
                <MapPinIcon size={14} />
                <span className="ex-modal-info-label">장소</span>
                {modal.program.zone}
              </div>
            </div>
            <div className="ex-modal-btns">
              <button
                className="ex-modal-btn ex-modal-btn-secondary"
                onClick={() => setModal(null)}
              >
                돌아가기
              </button>
              <button
                className="ex-modal-btn ex-modal-btn-danger"
                onClick={confirmCancel}
              >
                참가 취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`ex-toast${toastOut ? " out" : ""}`}>
          {toast.icon === "check" ? (
            <CheckIcon size={16} />
          ) : (
            <XIcon size={16} />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Export — eventId 여부에 따라 행사 선택 / 상세 분기
───────────────────────────────────────── */
export default function Experience() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const currentPath = "/program/experience";

  if (!eventId) {
    return (
      <div className="ex-root">
        <style>{styles}</style>
        <PageHeader
          title="체험존 안내"
          subtitle="행사를 선택해 체험 프로그램을 확인하세요"
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
        />
        <EventSelectPage
          events={SAMPLE_EVENTS}
          basePath="/program/experience"
          sectionIcon={<Palette size={22} color="#ec4899" />}
          sectionColor="#ec4899"
          sectionTitle="체험 프로그램"
          sectionDesc="행사를 선택하면 체험 부스 목록과 참가 신청을 할 수 있어요"
        />
      </div>
    );
  }

  return <ExperienceDetail />;
}
