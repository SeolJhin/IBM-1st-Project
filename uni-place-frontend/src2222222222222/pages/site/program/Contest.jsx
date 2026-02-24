import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EventSelectPage from "../components/EventSelectPage";
import {
  SERVICE_CATEGORIES,
  SUBTITLE_MAP,
  SAMPLE_EVENTS,
} from "../constants/programConstants";
import {
  Trophy,
  Users,
  Award,
  Clock,
  Crown,
  ChevronRight,
  Heart,
  CheckCircle2,
  Timer,
  Sparkles,
  Check,
  X,
  Shirt,
  Drama,
  Cat,
  Flag,
  AlertCircle,
  Vote,
  TrendingUp,
  Medal,
  CircleDot,
  Info,
} from "lucide-react";

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ct-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f6f7fb;
    min-height: 100vh;
  }
  .ct-root *, .ct-root *::before, .ct-root *::after { box-sizing: border-box; font-family: inherit; }
  .ct-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 80px; }

  /* ── Live badge ── */
  .ct-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    letter-spacing: 0.5px;
  }
  .ct-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: ct-pulse 1.4s ease-in-out infinite;
  }
  @keyframes ct-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* ── Stat cards ── */
  .ct-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .ct-stat-card {
    background: #fff; border: 1px solid #eceef3; border-radius: 14px; padding: 20px;
    display: flex; align-items: center; gap: 14px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .ct-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
  .ct-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ct-stat-label { font-size: 12px; color: #868e9c; font-weight: 500; margin-bottom: 2px; }
  .ct-stat-value { font-size: 22px; font-weight: 800; color: #1a1d24; letter-spacing: -0.5px; }

  /* ── Current contest highlight ── */
  .ct-highlight {
    background: linear-gradient(135deg, #6d28d9 0%, #a855f7 50%, #c084fc 100%);
    border-radius: 16px; padding: 28px 28px 24px; color: #fff; margin-bottom: 24px;
    position: relative; overflow: hidden;
  }
  .ct-highlight::before {
    content: ''; position: absolute; top: -60px; right: -40px;
    width: 200px; height: 200px; background: rgba(255,255,255,0.06); border-radius: 50%;
  }
  .ct-highlight::after {
    content: ''; position: absolute; bottom: -80px; left: 30%;
    width: 250px; height: 250px; background: rgba(255,255,255,0.04); border-radius: 50%;
  }
  .ct-highlight-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; position: relative; z-index: 1; }
  .ct-highlight-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px; background: rgba(255,255,255,0.18); backdrop-filter: blur(4px);
    border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
  }
  .ct-highlight-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #fbbf24; animation: ct-pulse 1.4s ease-in-out infinite; }
  .ct-highlight-name { font-size: 26px; font-weight: 900; margin-bottom: 14px; position: relative; z-index: 1; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; }
  .ct-highlight-info { display: flex; gap: 20px; margin-bottom: 18px; position: relative; z-index: 1; }
  .ct-highlight-item { display: flex; align-items: center; gap: 6px; font-size: 13px; opacity: 0.85; font-weight: 500; }
  .ct-highlight-progress-wrap { position: relative; z-index: 1; }
  .ct-highlight-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .ct-highlight-progress-text { font-size: 13px; font-weight: 600; }
  .ct-progress-bar { height: 6px; background: rgba(255,255,255,0.18); border-radius: 100px; overflow: hidden; }
  .ct-progress-fill { height: 100%; background: #fbbf24; border-radius: 100px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }

  /* ── Main layout ── */
  .ct-main-grid { display: grid; grid-template-columns: 1fr 360px; gap: 16px; }

  /* ── Card base ── */
  .ct-card {
    background: #fff; border: 1px solid #eceef3; border-radius: 14px;
    padding: 22px 24px; margin-bottom: 0;
  }
  .ct-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f6;
  }
  .ct-card-title { font-size: 15px; font-weight: 700; color: #1a1d24; display: flex; align-items: center; gap: 8px; margin: 0; }
  .ct-card-title-icon { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
  .ct-card-tag { font-size: 11px; font-weight: 600; color: #868e9c; background: #f3f4f7; padding: 4px 10px; border-radius: 100px; }

  /* ── Contest list ── */
  .ct-contest-list { display: flex; flex-direction: column; gap: 8px; }
  .ct-contest-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border: 1.5px solid #eceef3; border-radius: 12px;
    background: #fff; transition: all 0.18s; cursor: pointer;
  }
  .ct-contest-item:hover { border-color: #c4b5fd; background: #faf8ff; }
  .ct-contest-item.active { border-color: #8b5cf6; background: #f5f0ff; box-shadow: 0 0 0 3px rgba(139,92,246,0.08); }
  .ct-contest-icon {
    width: 42px; height: 42px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ct-contest-info { flex: 1; min-width: 0; }
  .ct-contest-name { font-size: 14px; font-weight: 700; color: #1a1d24; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ct-contest-sub { font-size: 12px; color: #a0a7b5; margin-top: 3px; display: flex; align-items: center; gap: 10px; }
  .ct-contest-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; flex-shrink: 0;
  }
  .ct-contest-badge.live { background: #fef3c7; color: #d97706; }
  .ct-contest-badge.upcoming { background: #eef2ff; color: #4f46e5; }
  .ct-contest-badge.ended { background: #f3f4f6; color: #9ca3af; }

  /* ── Candidate voting cards ── */
  .ct-vote-area { margin-bottom: 0; }
  .ct-candidates-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .ct-candidate-card {
    background: #fff; border: 1.5px solid #eceef3; border-radius: 16px;
    padding: 0; overflow: hidden; transition: all 0.22s; cursor: pointer;
    position: relative;
  }
  .ct-candidate-card:hover { border-color: #c4b5fd; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
  .ct-candidate-card.voted { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
  .ct-candidate-card.voted .ct-candidate-voted-check { display: flex; }

  /* Image area */
  .ct-candidate-img-wrap {
    width: 100%; aspect-ratio: 4/3; position: relative; overflow: hidden;
    background: #f1f3f6;
  }
  .ct-candidate-img-wrap img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.3s;
  }
  .ct-candidate-card:hover .ct-candidate-img-wrap img { transform: scale(1.05); }
  .ct-candidate-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.35) 100%);
    pointer-events: none;
  }
  .ct-candidate-rank-badge {
    position: absolute; top: 10px; left: 10px;
    width: 30px; height: 30px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #fff;
    backdrop-filter: blur(8px); z-index: 2;
  }
  .ct-candidate-rank-badge.r1 { background: linear-gradient(135deg, #f59e0b, #f97316); }
  .ct-candidate-rank-badge.r2 { background: linear-gradient(135deg, #94a3b8, #64748b); }
  .ct-candidate-rank-badge.r3 { background: linear-gradient(135deg, #d97706, #b45309); }
  .ct-candidate-rank-badge.r-default { background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); }

  .ct-candidate-voted-check {
    display: none; position: absolute; top: 10px; right: 10px;
    width: 30px; height: 30px; border-radius: 50%;
    background: #7c3aed; align-items: center; justify-content: center;
    z-index: 2; animation: ct-check-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes ct-check-pop {
    from { transform: scale(0); } to { transform: scale(1); }
  }

  .ct-candidate-img-votes {
    position: absolute; bottom: 10px; left: 12px; z-index: 2;
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 100px;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
    font-size: 12px; font-weight: 700; color: #fff;
  }

  /* Body area */
  .ct-candidate-body { padding: 14px 16px 16px; }
  .ct-candidate-name-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .ct-candidate-name { font-size: 16px; font-weight: 800; color: #1a1d24; }
  .ct-candidate-pct { font-size: 14px; font-weight: 800; color: #6d28d9; }
  .ct-candidate-breed { font-size: 13px; color: #868e9c; font-weight: 500; margin-bottom: 12px; }

  /* Vote bar inside card */
  .ct-candidate-bar-track { height: 6px; background: #f1f3f6; border-radius: 100px; overflow: hidden; margin-bottom: 14px; }
  .ct-candidate-bar-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }

  /* Vote button */
  .ct-vote-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    width: 100%; padding: 11px 0; border-radius: 10px; border: none;
    font-family: inherit; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: #fff; box-shadow: 0 2px 10px rgba(124,58,237,0.25);
  }
  .ct-vote-btn:hover { box-shadow: 0 4px 20px rgba(124,58,237,0.35); transform: translateY(-1px); }
  .ct-vote-btn:active { transform: translateY(0); }
  .ct-vote-btn.voted {
    background: linear-gradient(135deg, #ede9fe 0%, #f3f0ff 100%);
    color: #7c3aed; box-shadow: none; cursor: default;
    border: 1.5px solid #ddd6fe;
  }
  .ct-vote-btn.voted:hover { transform: none; box-shadow: none; }
  .ct-vote-btn.disabled {
    background: #f3f4f6; color: #b0b5c0;
    box-shadow: none; cursor: not-allowed; border: 1px solid #eceef3;
  }
  .ct-vote-btn.disabled:hover { transform: none; }
  .ct-vote-btn.ended-btn {
    background: #f9fafb; color: #9ca3af; box-shadow: none;
    cursor: default; border: 1px solid #eceef3;
  }

  /* ── My vote confirmation toast ── */
  .ct-my-vote {
    display: flex; align-items: center; gap: 12px;
    background: linear-gradient(135deg, #f5f0ff 0%, #ede9fe 100%);
    border: 1.5px solid #ddd6fe; border-radius: 12px;
    padding: 14px 18px; margin-bottom: 16px;
    animation: ct-slide-down 0.35s ease-out;
  }
  .ct-my-vote-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ct-my-vote-text { font-size: 14px; color: #4c1d95; font-weight: 600; line-height: 1.5; }
  .ct-my-vote-name { font-weight: 800; color: #6d28d9; }
  @keyframes ct-slide-down {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Modal overlay ── */
  .ct-modal-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: ct-modal-bg-in 0.2s ease-out;
    padding: 20px;
  }
  @keyframes ct-modal-bg-in {
    from { opacity: 0; } to { opacity: 1; }
  }
  .ct-modal {
    background: #fff; border-radius: 20px; width: 100%; max-width: 400px;
    overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: ct-modal-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes ct-modal-in {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .ct-modal-img { width: 100%; height: 200px; object-fit: cover; }
  .ct-modal-body { padding: 24px 24px 20px; text-align: center; }
  .ct-modal-title { font-size: 20px; font-weight: 800; color: #1a1d24; margin-bottom: 4px; }
  .ct-modal-breed { font-size: 14px; color: #868e9c; font-weight: 500; margin-bottom: 16px; }
  .ct-modal-warning {
    display: flex; align-items: center; gap: 8px; justify-content: center;
    padding: 10px 16px; background: #fffbeb; border: 1px solid #fef3c7;
    border-radius: 10px; margin-bottom: 20px;
    font-size: 13px; color: #92400e; font-weight: 600;
  }
  .ct-modal-question { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 20px; }
  .ct-modal-btns { display: flex; gap: 10px; }
  .ct-modal-btn {
    flex: 1; padding: 13px 0; border-radius: 12px; border: none;
    font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
    transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .ct-modal-btn.cancel { background: #f3f4f6; color: #6b7280; }
  .ct-modal-btn.cancel:hover { background: #e5e7eb; }
  .ct-modal-btn.confirm {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: #fff; box-shadow: 0 2px 12px rgba(124,58,237,0.3);
  }
  .ct-modal-btn.confirm:hover { box-shadow: 0 4px 20px rgba(124,58,237,0.4); transform: translateY(-1px); }
  .ct-modal-close {
    position: absolute; top: 12px; right: 12px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #fff; transition: background 0.15s; z-index: 2;
  }
  .ct-modal-close:hover { background: rgba(0,0,0,0.6); }
  .ct-modal-img-wrap { position: relative; }

  /* ── Ranking sidebar ── */
  .ct-ranking-list { display: flex; flex-direction: column; gap: 6px; }
  .ct-ranking-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 10px; background: #fafbfc;
    transition: background 0.15s;
  }
  .ct-ranking-item:hover { background: #f3f0ff; }
  .ct-ranking-item.top { background: #faf8ff; }
  .ct-ranking-rank {
    width: 26px; height: 26px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; flex-shrink: 0;
  }
  .ct-ranking-rank.gold { background: #fef3c7; color: #d97706; }
  .ct-ranking-rank.silver { background: #f1f5f9; color: #64748b; }
  .ct-ranking-rank.bronze { background: #fff7ed; color: #c2410c; }
  .ct-ranking-rank.default { background: #f3f4f6; color: #9ca3af; }
  .ct-ranking-avatar {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    overflow: hidden; border: 2px solid #eceef3;
  }
  .ct-ranking-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ct-ranking-info { flex: 1; min-width: 0; }
  .ct-ranking-name { font-size: 13px; font-weight: 700; color: #1a1d24; }
  .ct-ranking-breed { font-size: 11px; color: #a0a7b5; }
  .ct-ranking-bar-wrap { margin-top: 5px; }
  .ct-ranking-bar { height: 4px; background: #f1f3f6; border-radius: 100px; overflow: hidden; }
  .ct-ranking-bar-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
  .ct-ranking-score-col { text-align: right; }
  .ct-ranking-score { font-size: 14px; font-weight: 800; color: #6d28d9; }
  .ct-ranking-score-label { font-size: 10px; color: #a0a7b5; font-weight: 500; }

  /* ── Upcoming / Ended state ── */
  .ct-state-overlay {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 48px 20px; text-align: center;
  }
  .ct-state-icon {
    width: 60px; height: 60px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  }
  .ct-state-title { font-size: 17px; font-weight: 700; color: #374151; margin-bottom: 6px; }
  .ct-state-desc { font-size: 13px; color: #9ca3af; line-height: 1.6; }

  /* ── Card entrance ── */
  .ct-fade-in { animation: ct-fade-in 0.35s ease-out both; }
  @keyframes ct-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Responsive ── */
  @media (max-width: 1100px) { .ct-main-grid { grid-template-columns: 1fr; } }
  @media (max-width: 700px) {
    .ct-container { padding: 20px 16px 60px; }
    .ct-stat-grid { grid-template-columns: 1fr 1fr; }
    .ct-candidates-grid { grid-template-columns: 1fr; }
    .ct-highlight-name { font-size: 20px; }
    .ct-highlight-info { flex-wrap: wrap; gap: 10px; }
    .ct-modal { max-width: 100%; }
  }
`;

/* ─────────────────────────────────────────
   Contest icon map (lucide-react)
───────────────────────────────────────── */
const CONTEST_ICONS = {
  "best-dress": { Icon: Shirt, color: "#d97706" },
  trick: { Icon: Drama, color: "#4f46e5" },
  cute: { Icon: Cat, color: "#ec4899" },
  obstacle: { Icon: Flag, color: "#059669" },
};

/* ─────────────────────────────────────────
   Data — with unsplash image URLs
───────────────────────────────────────── */
const CONTESTS = [
  {
    id: "best-dress",
    name: "베스트 드레서 콘테스트",
    participants: 32,
    totalVotes: 512,
    time: "14:00 ~ 15:30",
    status: "live",
    statusLabel: "투표 진행 중",
    bg: "#fef3c7",
    progress: 62,
    candidates: [
      {
        id: 1,
        name: "별이",
        breed: "포메라니안",
        votes: 184,
        color: "#8b5cf6",
        image:
          "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
      },
      {
        id: 2,
        name: "보리",
        breed: "시바견",
        votes: 147,
        color: "#a78bfa",
        image:
          "https://images.unsplash.com/photo-1583337130417-13571f57e3d9?w=400&h=300&fit=crop",
      },
      {
        id: 3,
        name: "하루",
        breed: "말티즈",
        votes: 98,
        color: "#c4b5fd",
        image:
          "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=300&fit=crop",
      },
      {
        id: 4,
        name: "코코",
        breed: "푸들",
        votes: 53,
        color: "#7c3aed",
        image:
          "https://images.unsplash.com/photo-1616567214565-ef020940b8e8?w=400&h=300&fit=crop",
      },
      {
        id: 5,
        name: "두부",
        breed: "비숑 프리제",
        votes: 30,
        color: "#6d28d9",
        image:
          "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=400&h=300&fit=crop",
      },
    ],
  },
  {
    id: "trick",
    name: "묘기 자랑 대회",
    participants: 18,
    totalVotes: 0,
    time: "16:00 ~ 17:00",
    status: "upcoming",
    statusLabel: "투표 예정",
    bg: "#eef2ff",
    progress: 0,
    candidates: [
      {
        id: 1,
        name: "초코",
        breed: "보더콜리",
        votes: 0,
        color: "#4f46e5",
        image:
          "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=400&h=300&fit=crop",
      },
      {
        id: 2,
        name: "콩이",
        breed: "웰시코기",
        votes: 0,
        color: "#6366f1",
        image:
          "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=400&h=300&fit=crop",
      },
      {
        id: 3,
        name: "망고",
        breed: "래브라도",
        votes: 0,
        color: "#818cf8",
        image:
          "https://images.unsplash.com/photo-1579213838058-11e1a3de0441?w=400&h=300&fit=crop",
      },
    ],
  },
  {
    id: "cute",
    name: "귀여움 대결",
    participants: 45,
    totalVotes: 389,
    time: "10:00 ~ 12:00",
    status: "ended",
    statusLabel: "투표 종료",
    bg: "#fdf2f8",
    progress: 100,
    candidates: [
      {
        id: 1,
        name: "뽀삐",
        breed: "치와와",
        votes: 156,
        color: "#ec4899",
        image:
          "https://images.unsplash.com/photo-1605897472068-3e0f2332be03?w=400&h=300&fit=crop",
      },
      {
        id: 2,
        name: "몽이",
        breed: "닥스훈트",
        votes: 132,
        color: "#f472b6",
        image:
          "https://images.unsplash.com/photo-1615233500064-caa995e2f9dd?w=400&h=300&fit=crop",
      },
      {
        id: 3,
        name: "밤이",
        breed: "프렌치불독",
        votes: 101,
        color: "#f9a8d4",
        image:
          "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop",
      },
    ],
  },
  {
    id: "obstacle",
    name: "장애물 경주",
    participants: 24,
    totalVotes: 0,
    time: "17:30 ~ 18:30",
    status: "upcoming",
    statusLabel: "투표 예정",
    bg: "#ecfdf5",
    progress: 0,
    candidates: [],
  },
];

const STAT_CARDS = [
  {
    label: "진행 중",
    value: "1개",
    icon: <Trophy size={20} color="#d97706" />,
    bg: "#fffbeb",
  },
  {
    label: "총 참가자",
    value: "119명",
    icon: <Users size={20} color="#4f46e5" />,
    bg: "#eef2ff",
  },
  {
    label: "총 투표수",
    value: "901표",
    icon: <Heart size={20} color="#ec4899" />,
    bg: "#fdf2f8",
  },
  {
    label: "남은 대회",
    value: "2개",
    icon: <Timer size={20} color="#059669" />,
    bg: "#ecfdf5",
  },
];

/* ─────────────────────────────────────────
   Vote Confirm Modal
───────────────────────────────────────── */
function VoteConfirmModal({ candidate, onConfirm, onCancel }) {
  if (!candidate) return null;
  return (
    <div className="ct-modal-overlay" onClick={onCancel}>
      <div className="ct-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-img-wrap">
          <img
            className="ct-modal-img"
            src={candidate.image}
            alt={candidate.name}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <button className="ct-modal-close" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
        <div className="ct-modal-body">
          <div className="ct-modal-title">{candidate.name}</div>
          <div className="ct-modal-breed">{candidate.breed}</div>
          <div className="ct-modal-warning">
            <AlertCircle size={16} />
            투표 후에는 변경할 수 없습니다
          </div>
          <div className="ct-modal-question">
            <strong>{candidate.name}</strong>에게 투표하시겠습니까?
          </div>
          <div className="ct-modal-btns">
            <button className="ct-modal-btn cancel" onClick={onCancel}>
              <X size={16} /> 취소
            </button>
            <button className="ct-modal-btn confirm" onClick={onConfirm}>
              <Heart size={16} /> 투표하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Candidate Card
───────────────────────────────────────── */
function CandidateCard({
  candidate,
  rank,
  contestStatus,
  isVoted,
  isMyVote,
  onVoteClick,
  totalVotes,
}) {
  const pct =
    totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
  const barPct = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
  const rankClass =
    rank === 1 ? "r1" : rank === 2 ? "r2" : rank === 3 ? "r3" : "r-default";
  const canVote = contestStatus === "live" && !isVoted;

  return (
    <div
      className={`ct-candidate-card ct-fade-in${isMyVote ? " voted" : ""}`}
      style={{ animationDelay: `${(rank - 1) * 0.07}s` }}
    >
      <div className="ct-candidate-img-wrap">
        <img
          src={candidate.image}
          alt={candidate.name}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.style.background = `linear-gradient(135deg, ${candidate.color}20, ${candidate.color}08)`;
          }}
        />
        <div className="ct-candidate-img-overlay" />
        <div className={`ct-candidate-rank-badge ${rankClass}`}>{rank}</div>
        {isMyVote && (
          <div className="ct-candidate-voted-check">
            <Check size={16} color="#fff" />
          </div>
        )}
        <div className="ct-candidate-img-votes">
          <Heart size={11} fill="#fff" /> {candidate.votes.toLocaleString()}표
        </div>
      </div>
      <div className="ct-candidate-body">
        <div className="ct-candidate-name-row">
          <span className="ct-candidate-name">{candidate.name}</span>
          {totalVotes > 0 && <span className="ct-candidate-pct">{pct}%</span>}
        </div>
        <div className="ct-candidate-breed">{candidate.breed}</div>
        {totalVotes > 0 && (
          <div className="ct-candidate-bar-track">
            <div
              className="ct-candidate-bar-fill"
              style={{ width: `${barPct}%`, background: candidate.color }}
            />
          </div>
        )}
        {contestStatus === "live" && (
          <button
            className={`ct-vote-btn${isMyVote ? " voted" : ""}${!canVote && !isMyVote ? " disabled" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (canVote) onVoteClick(candidate);
            }}
            disabled={isMyVote || (!canVote && !isMyVote)}
          >
            {isMyVote ? (
              <>
                <CheckCircle2 size={16} /> 투표 완료
              </>
            ) : isVoted ? (
              <>
                <Heart size={16} /> 이미 투표함
              </>
            ) : (
              <>
                <Heart size={16} /> 투표하기
              </>
            )}
          </button>
        )}
        {contestStatus === "ended" && (
          <button className="ct-vote-btn ended-btn" disabled>
            <Trophy size={15} /> {rank === 1 ? "우승" : `${rank}위`}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Ranking Sidebar Item
───────────────────────────────────────── */
function RankingItem({ candidate, rank, maxVotes }) {
  const barPct = maxVotes > 0 ? (candidate.votes / maxVotes) * 100 : 0;
  const rankClass =
    rank === 1
      ? "gold"
      : rank === 2
        ? "silver"
        : rank === 3
          ? "bronze"
          : "default";
  return (
    <div className={`ct-ranking-item${rank <= 3 ? " top" : ""}`}>
      <div className={`ct-ranking-rank ${rankClass}`}>{rank}</div>
      <div className="ct-ranking-avatar">
        <img
          src={candidate.image}
          alt={candidate.name}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
      <div className="ct-ranking-info">
        <div className="ct-ranking-name">{candidate.name}</div>
        <div className="ct-ranking-breed">{candidate.breed}</div>
        <div className="ct-ranking-bar-wrap">
          <div className="ct-ranking-bar">
            <div
              className="ct-ranking-bar-fill"
              style={{ width: `${barPct}%`, background: candidate.color }}
            />
          </div>
        </div>
      </div>
      <div className="ct-ranking-score-col">
        <div className="ct-ranking-score">
          {candidate.votes.toLocaleString()}
        </div>
        <div className="ct-ranking-score-label">표</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Content
───────────────────────────────────────── */
function ContestContent() {
  const [selectedContestId, setSelectedContestId] = useState("best-dress");
  const [myVotes, setMyVotes] = useState({});
  const [modalCandidate, setModalCandidate] = useState(null);

  const selectedContest = CONTESTS.find((c) => c.id === selectedContestId);
  const liveContest = CONTESTS.find((c) => c.status === "live");
  const sortedCandidates = [...(selectedContest?.candidates || [])].sort(
    (a, b) => b.votes - a.votes,
  );
  const maxVotes = sortedCandidates.length > 0 ? sortedCandidates[0].votes : 0;
  const myVoteForContest = myVotes[selectedContestId];
  const votedCandidateName = selectedContest?.candidates.find(
    (c) => c.id === myVoteForContest,
  )?.name;

  const handleVoteClick = useCallback((candidate) => {
    setModalCandidate(candidate);
  }, []);

  const handleConfirmVote = useCallback(() => {
    if (modalCandidate) {
      setMyVotes((prev) => ({
        ...prev,
        [selectedContestId]: modalCandidate.id,
      }));
      setModalCandidate(null);
    }
  }, [modalCandidate, selectedContestId]);

  const handleCancelVote = useCallback(() => {
    setModalCandidate(null);
  }, []);

  return (
    <>
      <VoteConfirmModal
        candidate={modalCandidate}
        onConfirm={handleConfirmVote}
        onCancel={handleCancelVote}
      />

      {liveContest && (
        <div style={{ marginBottom: 20 }}>
          <div className="ct-live-badge">
            <div className="ct-live-dot" /> LIVE 투표 진행 중
          </div>
        </div>
      )}

      <div className="ct-stat-grid">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="ct-stat-card">
            <div className="ct-stat-icon" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="ct-stat-label">{s.label}</div>
              <div className="ct-stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {liveContest && (
        <div className="ct-highlight">
          <div className="ct-highlight-top">
            <div className="ct-highlight-badge">
              <div className="ct-highlight-badge-dot" />
              {liveContest.statusLabel}
            </div>
            <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>
              {liveContest.totalVotes.toLocaleString()}표 참여
            </span>
          </div>
          <div className="ct-highlight-name">
            <Trophy size={24} />
            {liveContest.name}
          </div>
          <div className="ct-highlight-info">
            <div className="ct-highlight-item">
              <Users size={14} /> 참가 {liveContest.participants}팀
            </div>
            <div className="ct-highlight-item">
              <Clock size={14} /> {liveContest.time}
            </div>
            <div className="ct-highlight-item">
              <TrendingUp size={14} /> 진행률 {liveContest.progress}%
            </div>
          </div>
          <div className="ct-highlight-progress-wrap">
            <div className="ct-highlight-progress-header">
              <span className="ct-highlight-progress-text">투표 진행률</span>
              <span className="ct-highlight-progress-text">
                {liveContest.progress}%
              </span>
            </div>
            <div className="ct-progress-bar">
              <div
                className="ct-progress-fill"
                style={{ width: `${liveContest.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="ct-main-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Contest list */}
          <div className="ct-card">
            <div className="ct-card-header">
              <div className="ct-card-title">
                <div
                  className="ct-card-title-icon"
                  style={{ background: "#fffbeb" }}
                >
                  <Trophy size={14} color="#f59e0b" />
                </div>
                콘테스트 목록
              </div>
              <span className="ct-card-tag">총 {CONTESTS.length}개</span>
            </div>
            <div className="ct-contest-list">
              {CONTESTS.map((c) => {
                const ci = CONTEST_ICONS[c.id] || {
                  Icon: Trophy,
                  color: "#6b7280",
                };
                return (
                  <div
                    key={c.id}
                    className={`ct-contest-item${selectedContestId === c.id ? " active" : ""}`}
                    onClick={() => setSelectedContestId(c.id)}
                  >
                    <div
                      className="ct-contest-icon"
                      style={{ background: c.bg }}
                    >
                      <ci.Icon size={20} color={ci.color} />
                    </div>
                    <div className="ct-contest-info">
                      <div className="ct-contest-name">{c.name}</div>
                      <div className="ct-contest-sub">
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Users size={11} /> {c.participants}팀
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Clock size={11} /> {c.time}
                        </span>
                      </div>
                    </div>
                    <span className={`ct-contest-badge ${c.status}`}>
                      {c.status === "live" && <CircleDot size={10} />}
                      {c.statusLabel}
                    </span>
                    <ChevronRight size={16} style={{ color: "#d1d5db" }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voting area */}
          <div className="ct-card ct-vote-area">
            <div className="ct-card-header">
              <div className="ct-card-title">
                <div
                  className="ct-card-title-icon"
                  style={{ background: "#f5f0ff" }}
                >
                  <Vote size={14} color="#7c3aed" />
                </div>
                {selectedContest?.name}
                {selectedContest?.status === "live" && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#7c3aed",
                      background: "#f5f0ff",
                      padding: "2px 8px",
                      borderRadius: 100,
                    }}
                  >
                    투표 가능
                  </span>
                )}
              </div>
              <span className="ct-card-tag">
                {selectedContest?.status === "live"
                  ? `${selectedContest.totalVotes.toLocaleString()}표`
                  : selectedContest?.status === "ended"
                    ? "종료"
                    : "준비 중"}
              </span>
            </div>

            {myVoteForContest && (
              <div className="ct-my-vote">
                <div className="ct-my-vote-icon">
                  <CheckCircle2 size={18} color="#fff" />
                </div>
                <div className="ct-my-vote-text">
                  <span className="ct-my-vote-name">{votedCandidateName}</span>
                  에게 투표 완료!
                  <br />
                  <span style={{ fontSize: 12, opacity: 0.7 }}>
                    소중한 한 표 감사합니다
                  </span>
                </div>
              </div>
            )}

            {selectedContest?.status === "live" &&
              sortedCandidates.length > 0 && (
                <div className="ct-candidates-grid" key={selectedContestId}>
                  {sortedCandidates.map((c, i) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      rank={i + 1}
                      contestStatus="live"
                      isVoted={!!myVoteForContest}
                      isMyVote={myVoteForContest === c.id}
                      onVoteClick={handleVoteClick}
                      totalVotes={selectedContest.totalVotes}
                    />
                  ))}
                </div>
              )}

            {selectedContest?.status === "ended" &&
              sortedCandidates.length > 0 && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 14,
                      padding: "10px 14px",
                      background: "#fffbeb",
                      borderRadius: 10,
                      border: "1px solid #fef3c7",
                    }}
                  >
                    <Medal size={18} color="#d97706" />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#92400e",
                      }}
                    >
                      최종 결과
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#b45309",
                        marginLeft: "auto",
                        fontWeight: 600,
                      }}
                    >
                      총 {selectedContest.totalVotes.toLocaleString()}표
                    </span>
                  </div>
                  <div className="ct-candidates-grid" key={selectedContestId}>
                    {sortedCandidates.map((c, i) => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        rank={i + 1}
                        contestStatus="ended"
                        isVoted={false}
                        isMyVote={false}
                        onVoteClick={() => {}}
                        totalVotes={selectedContest.totalVotes}
                      />
                    ))}
                  </div>
                </>
              )}

            {selectedContest?.status === "upcoming" && (
              <div className="ct-state-overlay">
                <div
                  className="ct-state-icon"
                  style={{
                    background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
                  }}
                >
                  <Clock size={26} color="#4f46e5" />
                </div>
                <div className="ct-state-title">투표가 곧 시작됩니다</div>
                <div className="ct-state-desc">
                  {selectedContest.time}에 투표가 시작됩니다.
                  <br />
                  잠시만 기다려 주세요!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="ct-card">
            <div className="ct-card-header">
              <div className="ct-card-title">
                <div
                  className="ct-card-title-icon"
                  style={{ background: "#fffbeb" }}
                >
                  <Crown size={14} color="#f59e0b" />
                </div>
                실시간 순위
              </div>
              <span className="ct-card-tag">{selectedContest?.name}</span>
            </div>
            {sortedCandidates.length > 0 ? (
              <div className="ct-ranking-list">
                {sortedCandidates.map((c, i) => (
                  <RankingItem
                    key={c.id}
                    candidate={c}
                    rank={i + 1}
                    maxVotes={maxVotes}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 0",
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
                아직 후보가 등록되지 않았습니다
              </div>
            )}
          </div>

          <div
            className="ct-card"
            style={{
              background: "linear-gradient(135deg, #faf8ff 0%, #f5f0ff 100%)",
              borderColor: "#ede9fe",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#4c1d95",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Info size={16} color="#7c3aed" /> 투표 안내
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  icon: <Heart size={13} color="#7c3aed" />,
                  text: "콘테스트별 1회 투표 가능",
                },
                {
                  icon: <AlertCircle size={13} color="#7c3aed" />,
                  text: "투표 후 변경 불가",
                },
                {
                  icon: <Sparkles size={13} color="#7c3aed" />,
                  text: "결과는 실시간 반영",
                },
                {
                  icon: <TrendingUp size={13} color="#7c3aed" />,
                  text: "전체 현황은 실시간 현황 > 투표 현황",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#5b21b6",
                    fontWeight: 500,
                  }}
                >
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   Export
───────────────────────────────────────── */
export default function Contest() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const currentPath = "/program/contest";

  if (!eventId) {
    return (
      <div className="ct-root">
        <style>{styles}</style>
        <PageHeader
          title="콘테스트 · 투표"
          subtitle="행사를 선택해 콘테스트에 참여해보세요"
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
        />
        <EventSelectPage events={SAMPLE_EVENTS} basePath="/program/contest" />
      </div>
    );
  }

  return (
    <div className="ct-root">
      <style>{styles}</style>
      <PageHeader
        title="콘테스트 · 투표"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
      />
      <main className="ct-container">
        <ContestContent />
      </main>
    </div>
  );
}
