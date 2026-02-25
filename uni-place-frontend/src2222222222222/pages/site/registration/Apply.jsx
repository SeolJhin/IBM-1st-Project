import { useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  CalendarDays,
  Ticket,
  User,
  PawPrint,
  ClipboardList,
  CreditCard,
  CheckCircle2,
  Minus,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  ArrowLeft,
  Bus,
  Car,
  Train,
  Navigation,
  Info,
  Mic,
  Coffee,
  Drumstick,
  Star,
  Music,
  Camera,
  Heart,
} from "lucide-react";

/* ─────────────────────────────────────────────
   EXPORTED CONSTANTS
───────────────────────────────────────────── */
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
   DATA
───────────────────────────────────────────── */
export const EVENTS = [
  {
    id: 1,
    name: "2026 봄 반려동물 페스티벌 - Day 1",
    shortName: "Day 1",
    date: "2026.04.12 (토)",
    time: "10:00~18:00",
    location: "서울 올림픽공원 체조경기장",
    status: "available",
    timetable: [
      {
        time: "10:00",
        title: "개막식 및 환영사",
        type: "main",
        icon: "mic",
        desc: "행사 오프닝 세레모니",
      },
      {
        time: "10:30",
        title: "반려견 퍼레이드",
        type: "event",
        icon: "heart",
        desc: "다양한 품종의 반려견 퍼레이드",
      },
      {
        time: "11:30",
        title: "펫 패션쇼",
        type: "event",
        icon: "star",
        desc: "반려동물과 함께하는 패션 런웨이",
      },
      {
        time: "12:00",
        title: "점심 휴식",
        type: "break",
        icon: "coffee",
        desc: "푸드트럭 및 부스 운영",
      },
      {
        time: "13:30",
        title: "훈련사 시연",
        type: "event",
        icon: "star",
        desc: "프로 훈련사의 특별 시연",
      },
      {
        time: "15:00",
        title: "반려동물 사진 콘테스트",
        type: "event",
        icon: "camera",
        desc: "현장 투표 진행",
      },
      {
        time: "16:30",
        title: "입양 캠페인",
        type: "main",
        icon: "heart",
        desc: "유기동물 입양 소개 행사",
      },
      {
        time: "17:30",
        title: "경품 추첨 및 폐막",
        type: "main",
        icon: "music",
        desc: "행사 종료 및 경품 추첨",
      },
    ],
    locationInfo: {
      address: "서울특별시 송파구 올림픽로 424 올림픽공원 체조경기장",
      mapNote: "올림픽공원 동측 입구 이용",
      transit: [
        {
          icon: "train",
          label: "지하철",
          lines: [
            "5호선 올림픽공원역 3번 출구 → 도보 5분",
            "8호선 몽촌토성역 1번 출구 → 도보 10분",
          ],
        },
        {
          icon: "bus",
          label: "버스",
          lines: [
            "340, 340-1번 '올림픽공원' 하차",
            "3313, 3413번 '올림픽공원역' 하차",
          ],
        },
        {
          icon: "car",
          label: "자가용",
          lines: [
            "올림픽공원 동문 주차장 이용 (유료)",
            "네비게이션: '올림픽공원 체조경기장' 검색",
          ],
        },
      ],
      notice: "주차 공간이 협소하므로 대중교통 이용을 권장합니다.",
    },
  },
  {
    id: 2,
    name: "2026 봄 반려동물 페스티벌 - Day 2",
    shortName: "Day 2",
    date: "2026.04.13 (일)",
    time: "10:00~17:00",
    location: "서울 올림픽공원 체조경기장",
    remaining: 23,
    status: "almost",
    timetable: [
      {
        time: "10:00",
        title: "오프닝 퍼포먼스",
        type: "main",
        icon: "music",
        desc: "특별 공연 및 행사 시작",
      },
      {
        time: "11:00",
        title: "수의사 건강 상담",
        type: "event",
        icon: "heart",
        desc: "전문 수의사의 반려동물 건강 체크",
      },
      {
        time: "12:00",
        title: "점심 휴식",
        type: "break",
        icon: "coffee",
        desc: "푸드트럭 및 부스 운영",
      },
      {
        time: "13:30",
        title: "고양이 특집 쇼",
        type: "event",
        icon: "star",
        desc: "다양한 고양이 품종 전시",
      },
      {
        time: "15:00",
        title: "반려동물 운동회",
        type: "event",
        icon: "star",
        desc: "민첩성 테스트 및 게임",
      },
      {
        time: "16:00",
        title: "폐막식 및 시상",
        type: "main",
        icon: "mic",
        desc: "이틀간의 행사 마무리 및 시상식",
      },
    ],
    locationInfo: {
      address: "서울특별시 송파구 올림픽로 424 올림픽공원 체조경기장",
      mapNote: "올림픽공원 동측 입구 이용",
      transit: [
        {
          icon: "train",
          label: "지하철",
          lines: [
            "5호선 올림픽공원역 3번 출구 → 도보 5분",
            "8호선 몽촌토성역 1번 출구 → 도보 10분",
          ],
        },
        {
          icon: "bus",
          label: "버스",
          lines: ["340, 340-1번 '올림픽공원' 하차"],
        },
        {
          icon: "car",
          label: "자가용",
          lines: ["올림픽공원 동문 주차장 이용 (유료)"],
        },
      ],
      notice: "주차 공간이 협소하므로 대중교통 이용을 권장합니다.",
    },
  },
];

const TICKETS = [
  {
    id: "general",
    name: "일반 입장",
    price: "15,000원",
    raw: 15000,
    desc: "기본 행사 입장",
  },
  {
    id: "vip",
    name: "VIP 패키지",
    price: "35,000원",
    raw: 35000,
    desc: "굿즈 + 우선 입장",
  },
  {
    id: "family",
    name: "가족 패키지",
    price: "45,000원",
    raw: 45000,
    desc: "성인2 + 아동1",
  },
];

const STEPS = ["행사 선택", "정보 입력", "약관 동의", "결제 완료"];

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .reg-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA;
    min-height: 100vh;
  }
  .reg-root *, .reg-root *::before, .reg-root *::after { box-sizing: border-box; font-family: inherit; }
  .reg-container { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }

  /* ── Step indicator ── */
  .reg-steps {
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 28px;
  }
  .reg-step { display: flex; flex-direction: column; align-items: center; gap: 7px; }
  .reg-step-circle {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    background: #E8E9EF; color: #9CA3AF; transition: all 0.2s;
  }
  .reg-step.active .reg-step-circle { background: #1B50D9; color: #fff; box-shadow: 0 4px 12px rgba(27,80,217,0.28); }
  .reg-step.done .reg-step-circle { background: #00C48C; color: #fff; }
  .reg-step-label { font-size: 12px; color: #9CA3AF; font-weight: 500; }
  .reg-step.active .reg-step-label { color: #1B50D9; font-weight: 700; }
  .reg-step.done .reg-step-label { color: #00C48C; }
  .reg-step-line { width: 60px; height: 1.5px; background: #E8E9EF; margin: 0 6px; margin-bottom: 24px; flex-shrink: 0; }
  .reg-step-line.done { background: #00C48C; }

  /* ── Cards ── */
  .reg-card {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    padding: 24px; margin-bottom: 12px;
  }
  .reg-card-title {
    font-size: 15px; font-weight: 700; color: #111827;
    margin: 0 0 20px; padding-bottom: 16px;
    border-bottom: 1px solid #F3F4F6;
    display: flex; align-items: center; gap: 9px;
  }
  .reg-card-title-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: #EEF2FF; display: flex; align-items: center; justify-content: center; color: #1B50D9;
  }

  /* ── Event list ── */
  .reg-event-list { display: flex; flex-direction: column; gap: 10px; }
  .reg-event-item {
    border: 1.5px solid #EBEBEB; border-radius: 12px; padding: 16px;
    cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 14px;
  }
  .reg-event-item.selected { border-color: #1B50D9; background: #F5F8FF; }
  .reg-event-item:hover:not(.selected) { border-color: #C7D2FA; }
  .reg-event-radio {
    width: 20px; height: 20px; border-radius: 50%; border: 2px solid #D1D5DB;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .reg-event-item.selected .reg-event-radio { border-color: #1B50D9; }
  .reg-event-radio-dot { width: 10px; height: 10px; border-radius: 50%; background: #1B50D9; opacity: 0; transition: opacity 0.15s; }
  .reg-event-item.selected .reg-event-radio-dot { opacity: 1; }
  .reg-event-info { flex: 1; }
  .reg-event-name { font-size: 14px; font-weight: 700; color: #111827; }
  .reg-event-meta { font-size: 12.5px; color: #6B7280; margin-top: 4px; display: flex; align-items: center; gap: 5px; }
  .reg-event-badge {
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700;
    background: #D1FAE5; color: #065F46; flex-shrink: 0;
  }
  .reg-event-badge.almost { background: #FEF3C7; color: #92400E; }

  /* ── Ticket ── */
  .reg-ticket-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .reg-ticket {
    border: 1.5px solid #EBEBEB; border-radius: 12px; padding: 16px;
    cursor: pointer; transition: all 0.15s; text-align: center;
  }
  .reg-ticket.selected { border-color: #1B50D9; background: #F5F8FF; }
  .reg-ticket:hover:not(.selected) { border-color: #C7D2FA; }
  .reg-ticket-name { font-size: 13px; font-weight: 600; color: #374151; }
  .reg-ticket-price { font-size: 18px; font-weight: 800; color: #1B50D9; margin-top: 6px; letter-spacing: -0.5px; }
  .reg-ticket-desc { font-size: 11px; color: #9CA3AF; margin-top: 4px; }

  /* ── Counter ── */
  .reg-counter { display: flex; align-items: center; gap: 14px; }
  .reg-counter-btn {
    width: 34px; height: 34px; border-radius: 10px; border: 1.5px solid #EBEBEB; background: #fff;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #374151; transition: all 0.15s; font-family: inherit;
  }
  .reg-counter-btn:hover { border-color: #1B50D9; color: #1B50D9; }
  .reg-counter-num { font-size: 17px; font-weight: 700; color: #111827; min-width: 28px; text-align: center; }

  /* ── Form ── */
  .reg-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .reg-form-group { display: flex; flex-direction: column; gap: 7px; }
  .reg-form-group.full { grid-column: 1 / -1; }
  .reg-label { font-size: 12px; font-weight: 700; color: #374151; letter-spacing: 0.01em; }
  .reg-label span { color: #EF4444; margin-left: 2px; }
  .reg-input {
    height: 42px; padding: 0 14px; border: 1.5px solid #EBEBEB; border-radius: 10px;
    font-size: 13.5px; color: #111827; outline: none; transition: border-color 0.15s;
    font-family: inherit; background: #fff;
  }
  .reg-input:focus { border-color: #1B50D9; box-shadow: 0 0 0 3px rgba(27,80,217,0.1); }
  .reg-input::placeholder { color: #C9CDD4; }
  .reg-select {
    height: 42px; padding: 0 14px; border: 1.5px solid #EBEBEB; border-radius: 10px;
    font-size: 13.5px; color: #111827; outline: none; font-family: inherit; background: #fff;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
  }
  .reg-select:focus { border-color: #1B50D9; }

  /* ── Agree ── */
  .reg-agree-list { display: flex; flex-direction: column; gap: 10px; }
  .reg-agree-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 16px; border: 1.5px solid #EBEBEB; border-radius: 12px;
    cursor: pointer; transition: border-color 0.15s;
  }
  .reg-agree-item:hover { border-color: #C7D2FA; }
  .reg-checkbox {
    width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid #D1D5DB;
    flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; background: #fff;
  }
  .reg-checkbox.checked { background: #1B50D9; border-color: #1B50D9; }
  .reg-agree-text { font-size: 13px; color: #374151; line-height: 1.6; }
  .reg-agree-required { font-size: 11px; color: #EF4444; font-weight: 700; margin-right: 5px; }

  /* ── Summary ── */
  .reg-summary { background: #F5F8FF; border: 1.5px solid #DBEAFE; border-radius: 12px; padding: 18px; }
  .reg-summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #6B7280; padding: 5px 0; }
  .reg-summary-row span:last-child { color: #374151; font-weight: 500; }
  .reg-summary-total {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 15px; font-weight: 700; color: #111827;
    padding-top: 14px; margin-top: 10px; border-top: 1.5px solid #DBEAFE;
  }
  .reg-summary-price { color: #1B50D9; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }

  /* ── Buttons ── */
  .reg-btn-row { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  .reg-btn {
    padding: 11px 24px; border-radius: 10px; font-size: 14px; font-weight: 700;
    cursor: pointer; border: none; transition: all 0.15s; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
  }
  .reg-btn-ghost { background: #fff; border: 1.5px solid #EBEBEB; color: #6B7280; }
  .reg-btn-ghost:hover { border-color: #9CA3AF; color: #374151; }
  .reg-btn-primary { background: #1B50D9; color: #fff; }
  .reg-btn-primary:hover { background: #1640B8; }
  .reg-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Success ── */
  .reg-success { text-align: center; padding: 48px 24px; }
  .reg-success-icon {
    width: 72px; height: 72px; border-radius: 50%; background: #D1FAE5;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; color: #059669;
  }
  .reg-success-title { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 10px; letter-spacing: -0.5px; }
  .reg-success-desc { font-size: 14px; color: #6B7280; line-height: 1.7; }
  .reg-success-num {
    display: inline-block; margin-top: 20px; background: #F5F8FF;
    border: 1.5px solid #DBEAFE; border-radius: 10px;
    padding: 12px 28px; font-size: 17px; font-weight: 800; color: #1B50D9;
    letter-spacing: 0.08em; font-family: 'Courier New', monospace;
  }

  /* ── Timetable page ── */
  .tt-event-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .tt-event-card {
    background: #fff; border: 1.5px solid #EBEBEB; border-radius: 16px;
    padding: 20px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: space-between;
  }
  .tt-event-card:hover { border-color: #1B50D9; box-shadow: 0 4px 16px rgba(27,80,217,0.1); }
  .tt-event-card-left { display: flex; align-items: center; gap: 14px; }
  .tt-event-num {
    width: 44px; height: 44px; border-radius: 12px; background: #EEF2FF;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: #1B50D9; flex-shrink: 0;
  }
  .tt-event-name { font-size: 15px; font-weight: 700; color: #111827; }
  .tt-event-date { font-size: 13px; color: #6B7280; margin-top: 3px; display: flex; align-items: center; gap: 5px; }

  .tt-back-btn {
    display: flex; align-items: center; gap: 7px; margin-bottom: 20px;
    font-size: 14px; font-weight: 600; color: #6B7280; cursor: pointer;
    background: none; border: none; font-family: inherit; padding: 0;
    transition: color 0.15s;
  }
  .tt-back-btn:hover { color: #1B50D9; }

  .tt-detail-header {
    background: #fff; border: 1.5px solid #EBEBEB; border-radius: 16px;
    padding: 20px; margin-bottom: 12px;
  }
  .tt-detail-title { font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 6px; letter-spacing: -0.3px; }
  .tt-detail-meta { font-size: 13px; color: #6B7280; display: flex; align-items: center; gap: 6px; }

  .tt-timeline { display: flex; flex-direction: column; gap: 0; }
  .tt-slot {
    display: flex; gap: 16px; position: relative;
    padding-bottom: 0;
  }
  .tt-slot-left {
    width: 56px; flex-shrink: 0; text-align: right; padding-top: 2px;
  }
  .tt-slot-time { font-size: 12px; font-weight: 700; color: #9CA3AF; font-family: 'Courier New', monospace; }
  .tt-slot-center { display: flex; flex-direction: column; align-items: center; }
  .tt-slot-dot {
    width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
    margin-top: 4px;
  }
  .tt-slot-dot.main { background: #1B50D9; box-shadow: 0 0 0 3px rgba(27,80,217,0.15); }
  .tt-slot-dot.event { background: #00C48C; box-shadow: 0 0 0 3px rgba(0,196,140,0.15); }
  .tt-slot-dot.break { background: #F59E0B; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
  .tt-slot-line { width: 1.5px; flex: 1; background: #E8E9EF; min-height: 32px; }
  .tt-slot-content {
    flex: 1; padding-bottom: 24px;
  }
  .tt-slot:last-child .tt-slot-line { display: none; }
  .tt-slot:last-child .tt-slot-content { padding-bottom: 8px; }
  .tt-slot-card {
    background: #fff; border: 1.5px solid #EBEBEB; border-radius: 12px; padding: 14px 16px;
    transition: all 0.15s;
  }
  .tt-slot-card:hover { border-color: #C7D2FA; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .tt-slot-card.main { border-left: 3px solid #1B50D9; }
  .tt-slot-card.event { border-left: 3px solid #00C48C; }
  .tt-slot-card.break { border-left: 3px solid #F59E0B; }
  .tt-slot-card-title { font-size: 14px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 6px; }
  .tt-slot-card-desc { font-size: 12.5px; color: #9CA3AF; margin-top: 4px; }

  /* ── Location page ── */
  .loc-detail-card {
    background: #fff; border: 1.5px solid #EBEBEB; border-radius: 16px; overflow: hidden; margin-bottom: 12px;
  }
  .loc-map-placeholder {
    width: 100%; height: 220px; background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
    display: flex; align-items: center; justify-content: center; flex-direction: column;
    gap: 10px; position: relative; overflow: hidden;
  }
  .loc-map-placeholder::before {
    content: ''; position: absolute; inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(255,255,255,0.3) 32px, rgba(255,255,255,0.3) 33px),
                repeating-linear-gradient(90deg, transparent, transparent 32px, rgba(255,255,255,0.3) 32px, rgba(255,255,255,0.3) 33px);
  }
  .loc-map-pin {
    width: 48px; height: 48px; border-radius: 50%; background: #1B50D9;
    display: flex; align-items: center; justify-content: center; color: #fff;
    box-shadow: 0 6px 20px rgba(27,80,217,0.35), 0 0 0 8px rgba(27,80,217,0.15);
    position: relative; z-index: 1;
  }
  .loc-map-label {
    font-size: 13px; font-weight: 700; color: #1B50D9; background: #fff;
    padding: 6px 14px; border-radius: 100px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: relative; z-index: 1;
  }
  .loc-address-box { padding: 18px 20px; }
  .loc-address-label { font-size: 11px; font-weight: 700; color: #9CA3AF; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; }
  .loc-address-text { font-size: 15px; font-weight: 700; color: #111827; line-height: 1.5; }
  .loc-address-note { font-size: 12.5px; color: #6B7280; margin-top: 5px; display: flex; align-items: center; gap: 5px; }

  .loc-transit-card { background: #fff; border: 1.5px solid #EBEBEB; border-radius: 16px; padding: 20px; margin-bottom: 12px; }
  .loc-transit-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 16px; }
  .loc-transit-section { margin-bottom: 16px; }
  .loc-transit-section:last-child { margin-bottom: 0; }
  .loc-transit-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
    font-size: 13px; font-weight: 700; color: #374151;
  }
  .loc-transit-icon {
    width: 28px; height: 28px; border-radius: 8px; background: #EEF2FF;
    display: flex; align-items: center; justify-content: center; color: #1B50D9; flex-shrink: 0;
  }
  .loc-transit-line {
    font-size: 13px; color: #4B5563; padding: 8px 12px;
    background: #F9FAFB; border-radius: 8px; margin-bottom: 6px;
    display: flex; align-items: flex-start; gap: 7px;
  }
  .loc-transit-line::before { content: '·'; color: #9CA3AF; flex-shrink: 0; margin-top: 0.5px; }

  .loc-notice {
    background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 12px;
    padding: 14px 16px; display: flex; align-items: flex-start; gap: 9px;
    font-size: 13px; color: #92400E; line-height: 1.6;
  }

  @media (max-width: 640px) {
    .reg-form-grid { grid-template-columns: 1fr; }
    .reg-ticket-grid { grid-template-columns: 1fr; }
    .reg-container { padding: 20px 16px 64px; }
  }
`;

/* ─────────────────────────────────────────────
   TIMETABLE PAGE
───────────────────────────────────────────── */
const SLOT_ICONS = {
  mic: <Mic size={13} />,
  coffee: <Coffee size={13} />,
  star: <Star size={13} />,
  music: <Music size={13} />,
  camera: <Camera size={13} />,
  heart: <Heart size={13} />,
};

function TimetablePage() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (selectedEvent) {
    return (
      <>
        <button className="tt-back-btn" onClick={() => setSelectedEvent(null)}>
          <ArrowLeft size={16} /> 행사 목록으로
        </button>
        <div className="tt-detail-header">
          <div className="tt-detail-title">{selectedEvent.name}</div>
          <div className="tt-detail-meta">
            <CalendarDays size={13} /> {selectedEvent.date} &nbsp;·&nbsp;
            <Clock size={13} /> {selectedEvent.time}
          </div>
        </div>
        <div className="reg-card" style={{ padding: "24px" }}>
          <div className="tt-timeline">
            {selectedEvent.timetable.map((slot, i) => (
              <div key={i} className="tt-slot">
                <div className="tt-slot-left">
                  <div className="tt-slot-time">{slot.time}</div>
                </div>
                <div className="tt-slot-center">
                  <div className={`tt-slot-dot ${slot.type}`} />
                  <div className="tt-slot-line" />
                </div>
                <div className="tt-slot-content">
                  <div className={`tt-slot-card ${slot.type}`}>
                    <div className="tt-slot-card-title">
                      {SLOT_ICONS[slot.icon]}
                      {slot.title}
                    </div>
                    <div className="tt-slot-card-desc">{slot.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          타임테이블
        </div>
        <div style={{ fontSize: 13, color: "#9CA3AF" }}>
          행사를 선택하면 세부 타임테이블을 확인할 수 있습니다
        </div>
      </div>
      <div className="tt-event-list">
        {EVENTS.map((ev, i) => (
          <div
            key={ev.id}
            className="tt-event-card"
            onClick={() => setSelectedEvent(ev)}
          >
            <div className="tt-event-card-left">
              <div className="tt-event-num">D{i + 1}</div>
              <div>
                <div className="tt-event-name">{ev.name}</div>
                <div className="tt-event-date">
                  <CalendarDays size={12} /> {ev.date} &nbsp;{" "}
                  <Clock size={12} /> {ev.time}
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="#C9CDD4" />
          </div>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   LOCATION PAGE
───────────────────────────────────────────── */
const TRANSIT_ICONS = {
  train: <Train size={14} />,
  bus: <Bus size={14} />,
  car: <Car size={14} />,
};

function LocationPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (selectedEvent) {
    const loc = selectedEvent.locationInfo;
    return (
      <>
        <button className="tt-back-btn" onClick={() => setSelectedEvent(null)}>
          <ArrowLeft size={16} /> 행사 목록으로
        </button>

        <div className="loc-detail-card">
          <div className="loc-map-placeholder">
            <div className="loc-map-pin">
              <MapPin size={22} />
            </div>
            <div className="loc-map-label">{selectedEvent.location}</div>
          </div>
          <div className="loc-address-box">
            <div className="loc-address-label">주소</div>
            <div className="loc-address-text">{loc.address}</div>
            <div className="loc-address-note">
              <Info size={12} /> {loc.mapNote}
            </div>
          </div>
        </div>

        <div className="loc-transit-card">
          <div className="loc-transit-title">오시는 길</div>
          {loc.transit.map((t, i) => (
            <div key={i} className="loc-transit-section">
              <div className="loc-transit-header">
                <div className="loc-transit-icon">{TRANSIT_ICONS[t.icon]}</div>
                {t.label}
              </div>
              {t.lines.map((line, j) => (
                <div key={j} className="loc-transit-line">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="loc-notice">
          <Info
            size={16}
            color="#D97706"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          {loc.notice}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button className="reg-btn reg-btn-ghost" style={{ flex: 1 }}>
            <Navigation size={14} /> 네이버 지도
          </button>
          <button className="reg-btn reg-btn-ghost" style={{ flex: 1 }}>
            <MapPin size={14} /> 카카오맵
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          오시는 길
        </div>
        <div style={{ fontSize: 13, color: "#9CA3AF" }}>
          행사를 선택하면 상세 오시는 길을 확인할 수 있습니다
        </div>
      </div>
      <div className="tt-event-list">
        {EVENTS.map((ev, i) => (
          <div
            key={ev.id}
            className="tt-event-card"
            onClick={() => setSelectedEvent(ev)}
          >
            <div className="tt-event-card-left">
              <div className="tt-event-num">D{i + 1}</div>
              <div>
                <div className="tt-event-name">{ev.name}</div>
                <div className="tt-event-date">
                  <MapPin size={12} /> {ev.locationInfo.address.slice(0, 22)}…
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="#C9CDD4" />
          </div>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   APPLY FORM
───────────────────────────────────────────── */
function ApplyForm() {
  const [step, setStep] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState("general");
  const [count, setCount] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    pet: "",
    breed: "",
    birthYear: "",
  });
  const [agrees, setAgrees] = useState([false, false, false]);

  const ticket = TICKETS.find((t) => t.id === selectedTicket);
  const total = ((ticket?.raw ?? 0) * count).toLocaleString();
  const toggleAgree = (i) => {
    const n = [...agrees];
    n[i] = !n[i];
    setAgrees(n);
  };

  return (
    <>
      {/* Step indicator */}
      <div className="reg-steps">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "contents" }}>
            <div
              className={`reg-step${step === i ? " active" : ""}${step > i ? " done" : ""}`}
            >
              <div className="reg-step-circle">
                {step > i ? <Check size={15} /> : i + 1}
              </div>
              <div className="reg-step-label">{s}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`reg-step-line${step > i ? " done" : ""}`} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 0 */}
      {step === 0 && (
        <>
          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <CalendarDays size={15} />
              </div>
              참가할 행사를 선택하세요
            </div>
            <div className="reg-event-list">
              {EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className={`reg-event-item${selectedEvent === ev.id ? " selected" : ""}`}
                  onClick={() => setSelectedEvent(ev.id)}
                >
                  <div className="reg-event-radio">
                    <div className="reg-event-radio-dot" />
                  </div>
                  <div className="reg-event-info">
                    <div className="reg-event-name">{ev.name}</div>
                    <div className="reg-event-meta">
                      <CalendarDays size={12} /> {ev.date} &nbsp;{" "}
                      <MapPin size={12} /> {ev.location}
                    </div>
                  </div>
                  <span
                    className={`reg-event-badge${ev.status === "almost" ? " almost" : ""}`}
                  >
                    {ev.status === "almost"
                      ? `잔여 ${ev.remaining}석`
                      : "참가 가능"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <Ticket size={15} />
              </div>
              티켓 종류
            </div>
            <div className="reg-ticket-grid">
              {TICKETS.map((t) => (
                <div
                  key={t.id}
                  className={`reg-ticket${selectedTicket === t.id ? " selected" : ""}`}
                  onClick={() => setSelectedTicket(t.id)}
                >
                  <div className="reg-ticket-name">{t.name}</div>
                  <div className="reg-ticket-price">{t.price}</div>
                  <div className="reg-ticket-desc">{t.desc}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                참가 인원
              </span>
              <div className="reg-counter">
                <button
                  className="reg-counter-btn"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                >
                  <Minus size={14} />
                </button>
                <span className="reg-counter-num">{count}</span>
                <button
                  className="reg-counter-btn"
                  onClick={() => setCount((c) => Math.min(10, c + 1))}
                >
                  <Plus size={14} />
                </button>
              </div>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>최대 10매</span>
            </div>
          </div>

          <div className="reg-btn-row">
            <button
              className="reg-btn reg-btn-primary"
              style={{ opacity: selectedEvent ? 1 : 0.4 }}
              onClick={() => selectedEvent && setStep(1)}
            >
              다음 단계 <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <User size={15} />
              </div>
              신청자 정보
            </div>
            <div className="reg-form-grid">
              <div className="reg-form-group">
                <label className="reg-label">
                  이름 <span>*</span>
                </label>
                <input
                  className="reg-input"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-label">
                  연락처 <span>*</span>
                </label>
                <input
                  className="reg-input"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="reg-form-group full">
                <label className="reg-label">
                  이메일 <span>*</span>
                </label>
                <input
                  className="reg-input"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <PawPrint size={15} />
              </div>
              반려동물 정보{" "}
              <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>
                (선택)
              </span>
            </div>
            <div className="reg-form-grid">
              <div className="reg-form-group">
                <label className="reg-label">반려동물 이름</label>
                <input
                  className="reg-input"
                  placeholder="예) 코코"
                  value={form.pet}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pet: e.target.value }))
                  }
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-label">견종 / 품종</label>
                <input
                  className="reg-input"
                  placeholder="예) 골든 리트리버"
                  value={form.breed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, breed: e.target.value }))
                  }
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-label">출생 연도</label>
                <select
                  className="reg-select"
                  value={form.birthYear}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, birthYear: e.target.value }))
                  }
                >
                  <option value="">선택</option>
                  {Array.from({ length: 15 }, (_, i) => 2025 - i).map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="reg-btn-row">
            <button
              className="reg-btn reg-btn-ghost"
              onClick={() => setStep(0)}
            >
              <ChevronLeft size={16} /> 이전
            </button>
            <button
              className="reg-btn reg-btn-primary"
              onClick={() => setStep(2)}
            >
              다음 단계 <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <ClipboardList size={15} />
              </div>
              약관 동의
            </div>
            <div className="reg-agree-list">
              {[
                {
                  text: "개인정보 수집 및 이용에 동의합니다. 수집 항목: 이름, 연락처, 이메일 / 이용목적: 행사 참가 신청 및 안내",
                  required: true,
                },
                {
                  text: "행사 참가 시 촬영된 사진 및 영상이 홍보 자료로 활용될 수 있음에 동의합니다.",
                  required: true,
                },
                {
                  text: "행사 관련 마케팅 및 이벤트 정보 수신에 동의합니다. (선택)",
                  required: false,
                },
              ].map((a, i) => (
                <div
                  key={i}
                  className="reg-agree-item"
                  onClick={() => toggleAgree(i)}
                >
                  <div className={`reg-checkbox${agrees[i] ? " checked" : ""}`}>
                    {agrees[i] && <Check size={12} color="#fff" />}
                  </div>
                  <div className="reg-agree-text">
                    <span
                      className={a.required ? "reg-agree-required" : ""}
                      style={
                        !a.required
                          ? { fontSize: 11, color: "#9CA3AF", marginRight: 5 }
                          : {}
                      }
                    >
                      {a.required ? "[필수]" : "[선택]"}
                    </span>
                    {a.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <CreditCard size={15} />
              </div>
              결제 내역 확인
            </div>
            <div className="reg-summary">
              <div className="reg-summary-row">
                <span>행사명</span>
                <span>{EVENTS.find((e) => e.id === selectedEvent)?.name}</span>
              </div>
              <div className="reg-summary-row">
                <span>티켓 종류</span>
                <span>{ticket?.name}</span>
              </div>
              <div className="reg-summary-row">
                <span>수량</span>
                <span>{count}매</span>
              </div>
              <div className="reg-summary-row">
                <span>단가</span>
                <span>{ticket?.price}</span>
              </div>
              <div className="reg-summary-total">
                <span>최종 결제 금액</span>
                <span className="reg-summary-price">₩ {total}</span>
              </div>
            </div>
          </div>
          <div className="reg-btn-row">
            <button
              className="reg-btn reg-btn-ghost"
              onClick={() => setStep(1)}
            >
              <ChevronLeft size={16} /> 이전
            </button>
            <button
              className="reg-btn reg-btn-primary"
              style={{ opacity: agrees[0] && agrees[1] ? 1 : 0.4 }}
              onClick={() => {
                if (agrees[0] && agrees[1]) setStep(3);
              }}
            >
              결제하기 <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="reg-card">
          <div className="reg-success">
            <div className="reg-success-icon">
              <CheckCircle2 size={36} />
            </div>
            <div className="reg-success-title">신청이 완료되었습니다!</div>
            <div className="reg-success-desc">
              입력하신 이메일로 신청 확인서가 발송되었습니다.
              <br />
              행사 당일 QR 코드를 지참하여 입장하세요.
            </div>
            <div className="reg-success-num">REG-2026-003847</div>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <button
                className="reg-btn reg-btn-ghost"
                onClick={() => setStep(0)}
              >
                추가 신청
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function EventRegistration({ onNavigate }) {
  const [currentPath, setCurrentPath] = useState("/registration/apply");

  const handleNavigate = (path) => {
    setCurrentPath(path);
    if (onNavigate) onNavigate(path);
  };

  const renderContent = () => {
    switch (currentPath) {
      case "/registration/apply":
        return <ApplyForm />;
      case "/registration/timetable":
        return <TimetablePage />;
      case "/registration/location":
        return <LocationPage />;
      default:
        return <ApplyForm />;
    }
  };

  return (
    <div className="reg-root">
      <style>{styles}</style>
      <PageHeader
        title="행사 참가 신청"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
      <main className="reg-container">{renderContent()}</main>
    </div>
  );
}
