/* eslint-disable react-hooks/exhaustive-deps */
// src/features/chat/components/AdminChatBot.jsx
/**
 * 어드민 전용 AI 챗봇 플로팅 버튼.
 *
 * - 어드민 페이지 전용 (App.js에서 isAdmin일 때만 렌더링)
 * - 엔드포인트: /ai/chat/admin-chatbot  (Spring @PreAuthorize ROLE_ADMIN)
 * - 웹검색(Tavily), RAG(ChromaDB), admin_stats, query_database 지원
 * - 일반 챗봇과 히스토리 분리 (ADMIN_CHAT_HISTORY_KEY)
 * - 플로팅 버튼 위치: 오른쪽 하단 (일반 챗봇 fab 위)
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../app/http/axiosInstance';
import styles from './AdminChatBot.module.css';
import { QUICK_QUESTIONS } from '../config/chatConfig';

// ── 어드민 전용 localStorage 키 ─────────────────────────────────────────────
const ADMIN_HISTORY_KEY = 'uniplace_admin_chat_history';
const HISTORY_WINDOW = 8; // 어드민은 더 긴 맥락 유지
const RETENTION_DAYS = 365;

// ── 히스토리 유틸 ────────────────────────────────────────────────────────────
function loadAdminHistory(adminId) {
  try {
    const raw = localStorage.getItem(ADMIN_HISTORY_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    const records = Array.isArray(all[adminId]) ? all[adminId] : [];
    const limit = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return records.filter((m) => Date.now() - m.ts < limit);
  } catch {
    return [];
  }
}

function saveAdminHistory(adminId, messages) {
  try {
    const raw = localStorage.getItem(ADMIN_HISTORY_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[adminId] = messages;
    localStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(all));
  } catch {}
}

function clearAdminHistory(adminId) {
  try {
    const raw = localStorage.getItem(ADMIN_HISTORY_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    delete all[adminId];
    localStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(all));
  } catch {}
}

// ── 시간 포맷 ────────────────────────────────────────────────────────────────
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── 어드민 챗봇 API 호출 ─────────────────────────────────────────────────────
async function sendToAdminChatbot(prompt, adminId, history) {
  const recentHistory = Array.isArray(history)
    ? history
        .slice(-HISTORY_WINDOW)
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  const res = await api.post('/ai/chat/admin-chatbot', {
    intent: 'ADMIN_CHATBOT',
    prompt,
    userId: adminId,
    userSegment: 'ADMIN',
    slots: { history: recentHistory },
  });

  const data = res?.data?.data ?? {};
  const metadata = data.metadata ?? {};
  const buttons = Array.isArray(metadata.action_buttons)
    ? metadata.action_buttons
    : Array.isArray(metadata.buttons)
      ? metadata.buttons
      : [];

  return {
    answer: data.answer || '응답을 받지 못했습니다.',
    metadata,
    buttons,
  };
}

// ── 버튼 컴포넌트 ────────────────────────────────────────────────────────────
function AdminActionButtons({ buttons }) {
  const navigate = useNavigate();
  if (!buttons || buttons.length === 0) return null;
  return (
    <div className={styles.actionButtons}>
      {buttons.map((btn, i) => (
        <button
          key={i}
          className={styles.actionBtn}
          onClick={() => {
            if (!btn.url) return;
            if (btn.url.startsWith('http')) {
              window.open(btn.url, '_blank');
            } else {
              navigate(btn.url);
            }
          }}
        >
          {btn.icon && <span className={styles.actionBtnIcon}>{btn.icon}</span>}
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ── 메시지 버블 ──────────────────────────────────────────────────────────────
function AdminMessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={isUser ? styles.rowUser : styles.rowAssistant}>
      {!isUser && <div className={styles.bubbleAvatar}>⚙️</div>}
      <div>
        <div className={isUser ? styles.bubbleUser : styles.bubbleAssistant}>
          {/* 마크다운 테이블 등 줄바꿈 처리 */}
          {msg.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < msg.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        {!isUser && msg.buttons && msg.buttons.length > 0 && (
          <AdminActionButtons buttons={msg.buttons} />
        )}
        <div className={styles.bubbleTime}>{formatTime(msg.ts)}</div>
      </div>
    </div>
  );
}

// ── 타이핑 인디케이터 ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={styles.typingRow}>
      <div className={styles.bubbleAvatar}>⚙️</div>
      <div className={styles.typingBubble}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function AdminChatBot({ user }) {
  const adminId = user?.userId || user?.id || 'admin';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadAdminHistory(adminId));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const isSendingRef = useRef(false);

  // messagesRef 동기화
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 히스토리 저장
  useEffect(() => {
    if (messages.length > 0) saveAdminHistory(adminId, messages);
  }, [messages, adminId]);

  // 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 미읽음 뱃지
  useEffect(() => {
    if (!open && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') setHasUnread(true);
    }
  }, [messages, open]);

  function onOpen() {
    setOpen(true);
    setHasUnread(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 80);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const sendMessage = useCallback(
    async function (text) {
      const trimmed = (text != null ? text : input).trim();
      if (!trimmed || isSendingRef.current) return;
      isSendingRef.current = true;
      setInput('');
      setError(null);

      const userMsg = { role: 'user', content: trimmed, ts: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const result = await sendToAdminChatbot(
          trimmed,
          adminId,
          messagesRef.current
        );
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.answer,
            buttons: result.buttons,
            ts: Date.now(),
            metadata: result.metadata,
          },
        ]);
      } catch (e) {
        setError(e?.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
        isSendingRef.current = false;
      }
    },
    [input, adminId]
  );

  const clear = useCallback(() => {
    clearAdminHistory(adminId);
    setMessages([]);
    setError(null);
  }, [adminId]);

  const adminQuickQuestions = QUICK_QUESTIONS.admin || [
    '미납 현황 요약해줘',
    '이번 달 민원 처리 현황',
    '전체 점유율 확인',
    '계약 이상 감지 결과',
    '이번 달 결제 요약',
    '서울 평균 월세 검색해줘',
  ];

  return (
    <>
      {/* ── 플로팅 버튼 ── */}
      <button
        className={styles.fab}
        onClick={open ? () => setOpen(false) : onOpen}
        aria-label={open ? '관리자 AI 닫기' : '관리자 AI 열기'}
        title="관리자 AI 어시스턴트"
      >
        {open ? (
          <svg
            className={styles.fabIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          /* 어드민 AI 아이콘 — 톱니바퀴 + 스파크 */
          <svg
            className={styles.fabIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M12 2l1.5 3.5L17 4l-1 3.5 3.5 1-2.5 2.5 1.5 3.5-3.5-1L12 17l-3 -3.5-3.5 1 1.5-3.5L4.5 8.5l3.5-1L7 4l3.5 1.5z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        )}
        {hasUnread && !open && <span className={styles.badge} />}
        {/* ADMIN 레이블 */}
        {!open && <span className={styles.fabLabel}>AI</span>}
      </button>

      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label="관리자 AI 어시스턴트"
        >
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.headerAvatar}>⚙️</div>
            <div className={styles.headerInfo}>
              <p className={styles.headerTitle}>관리자 AI 어시스턴트</p>
              <p className={styles.headerSub}>
                {user?.userName || user?.name || '관리자'}님
                <span className={styles.featureBadge}>웹검색</span>
                <span className={styles.featureBadge}>DB조회</span>
                <span className={styles.featureBadge}>통계</span>
              </p>
            </div>
            <div className={styles.statusDot} />
            <div className={styles.headerActions}>
              <button
                className={styles.iconBtn}
                onClick={clear}
                title="대화 초기화"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                </svg>
              </button>
              <button
                className={styles.iconBtn}
                onClick={() => setOpen(false)}
                title="닫기"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className={styles.body}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                <span className={styles.welcomeEmoji}>⚙️</span>
                <p className={styles.welcomeTitle}>관리자 AI 어시스턴트</p>
                <p className={styles.welcomeText}>
                  DB 조회, 운영 통계, 웹 검색까지
                  <br />
                  무엇이든 물어보세요.
                </p>
                <div className={styles.featureList}>
                  <span>🔍 웹 검색 (Tavily)</span>
                  <span>🗄️ 전체 DB 조회</span>
                  <span>📊 운영 통계</span>
                  <span>📁 문서 검색 (RAG)</span>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <AdminMessageBubble key={msg.ts + '-' + i} msg={msg} />
              ))
            )}
            {loading && <TypingIndicator />}
            {error && <div className={styles.errorMsg}>⚠️ {error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* 빠른 질문 */}
          {messages.length === 0 && (
            <div className={styles.quickChips}>
              {adminQuickQuestions.map((q) => (
                <button
                  key={q}
                  className={styles.chip}
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 입력 */}
          <div className={styles.footer}>
            <div className={styles.inputRow}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder="DB 조회, 통계, 웹 검색 등 무엇이든…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
              />
              <button
                className={styles.sendBtn}
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                aria-label="전송"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className={styles.footerNote}>
              🔒 관리자 전용 · DB 전체 접근 · 웹검색 가능
            </p>
          </div>
        </div>
      )}
    </>
  );
}
