/* eslint-disable react-hooks/exhaustive-deps */
// src/features/chat/components/AdminChatBot.jsx
/**
 * 어드민 전용 AI 챗봇
 *
 * [일반 챗봇과의 차이]
 * - API 엔드포인트: /ai/chat/admin-chatbot (ADMIN 전용, 401/403 시 자동 차단)
 * - 모든 DB 테이블 조회 가능 (민원/계약/결제 전체)
 * - 어드민 페이지 라우팅 버튼 지원
 * - 플로팅 버튼 스타일 구분 (보라색)
 * - 사용 위치: AdminShell 또는 어드민 레이아웃에만 마운트
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/api/axiosInstance'; // 기존 axios 인스턴스 (JWT 자동 첨부)
import styles from './AdminChatBot.module.css';

// ── 상수 ─────────────────────────────────────────────────────────────────────

var ADMIN_ENDPOINT = '/ai/chat/admin-chatbot';
var STORAGE_KEY = 'admin_chatbot_history';
var MAX_HISTORY = 10; // 대화 컨텍스트 최대 유지 수

var QUICK_QUESTIONS = [
  '오늘 투어 예약 현황',
  '이번 달 민원 건수',
  '빌딩별 점유율',
  '미처리 민원 목록',
  '이번 달 결제 통계',
];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── 로컬 히스토리 ─────────────────────────────────────────────────────────────

function loadHistory() {
  try {
    var raw = sessionStorage.getItem(STORAGE_KEY); // sessionStorage: 탭 닫으면 자동 삭제
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(msgs.slice(-MAX_HISTORY * 2))
    );
  } catch {}
}

// ── 버튼 컴포넌트 ─────────────────────────────────────────────────────────────

var ADMIN_MODAL_ROUTES = {}; // 어드민은 현재 모달 없음, 필요 시 추가

function AdminActionButtons({ buttons }) {
  var navigate = useNavigate();
  if (!buttons || buttons.length === 0) return null;
  return (
    <div className={styles.actionButtons}>
      {buttons.map(function (btn, i) {
        return (
          <button
            key={i}
            className={styles.actionBtn}
            onClick={function () {
              if (!btn.url) return;
              var url = btn.url.trim().replace(/\/$/, '');
              if (url.startsWith('http')) {
                window.open(url, '_blank');
              } else {
                navigate(url);
              }
            }}
          >
            {btn.icon && (
              <span className={styles.actionBtnIcon}>{btn.icon}</span>
            )}
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}

// ── 메시지 버블 ───────────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  var isUser = msg.role === 'user';
  return (
    <div className={isUser ? styles.rowUser : styles.rowAssistant}>
      {!isUser && <div className={styles.bubbleAvatar}>🛡️</div>}
      <div>
        <div className={isUser ? styles.bubbleUser : styles.bubbleAssistant}>
          {/* 마크다운 테이블 등 포함 가능 — 추후 react-markdown 연동 가능 */}
          <pre className={styles.preWrap}>{msg.content}</pre>
        </div>
        {!isUser && msg.buttons && msg.buttons.length > 0 && (
          <AdminActionButtons buttons={msg.buttons} />
        )}
        <div className={styles.bubbleTime}>{formatTime(msg.ts)}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className={styles.typingRow}>
      <div className={styles.bubbleAvatar}>🛡️</div>
      <div className={styles.typingBubble}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function AdminChatBot({ user }) {
  var [open, setOpen] = useState(false);
  var [messages, setMessages] = useState(loadHistory);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);
  var [hasUnread, setHasUnread] = useState(false);

  var bottomRef = useRef(null);
  var textareaRef = useRef(null);
  var messagesRef = useRef([]);

  // messagesRef 동기화
  useEffect(
    function () {
      messagesRef.current = messages;
    },
    [messages]
  );

  // 히스토리 저장
  useEffect(
    function () {
      saveHistory(messages);
    },
    [messages]
  );

  // 스크롤
  useEffect(
    function () {
      if (bottomRef.current)
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    },
    [messages, loading]
  );

  // 미읽음 뱃지
  useEffect(
    function () {
      if (!open && messages.length > 0) {
        var last = messages[messages.length - 1];
        if (last.role === 'assistant') setHasUnread(true);
      }
    },
    [messages, open]
  );

  function onOpen() {
    setOpen(true);
    setHasUnread(false);
    setTimeout(function () {
      if (textareaRef.current) textareaRef.current.focus();
      if (bottomRef.current)
        bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }, 80);
  }

  var sendMessage = useCallback(
    async function (overrideText) {
      var text = (overrideText || input).trim();
      if (!text || loading) return;

      var userMsg = { role: 'user', content: text, ts: Date.now() };
      var prev = messagesRef.current;
      setMessages(function (m) {
        return [...m, userMsg];
      });
      setInput('');
      setLoading(true);
      setError(null);

      // 히스토리 슬라이싱 (최근 MAX_HISTORY 쌍)
      var history = [...prev, userMsg]
        .slice(-(MAX_HISTORY * 2))
        .map(function (m) {
          return { role: m.role, content: m.content };
        });

      try {
        var res = await api.post(ADMIN_ENDPOINT, {
          prompt: text,
          userId: user ? user.userId || user.id : null,
          history: history,
        });

        var data = res.data;
        var answer = (data.answer || data.message || '').trim();
        var buttons =
          data.metadata && data.metadata.buttons ? data.metadata.buttons : [];

        var botMsg = {
          role: 'assistant',
          content: answer,
          buttons: buttons,
          ts: Date.now(),
        };
        setMessages(function (m) {
          return [...m, botMsg];
        });
      } catch (e) {
        var status = e.response && e.response.status;
        var errMsg =
          status === 403
            ? '⛔ 어드민 권한이 없습니다.'
            : status === 401
              ? '🔒 로그인이 필요합니다.'
              : '⚠️ 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, user]
  );

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clear() {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
    setError(null);
  }

  return (
    <>
      {/* 플로팅 버튼 — 보라색으로 일반 챗봇과 구분 */}
      <button
        className={styles.fab}
        onClick={
          open
            ? function () {
                setOpen(false);
              }
            : onOpen
        }
        aria-label={open ? '관리자 AI 닫기' : '관리자 AI 열기'}
        title="관리자 AI 챗봇"
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
          <span className={styles.fabEmoji}>🛡️</span>
        )}
        {hasUnread && !open && <span className={styles.badge} />}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="관리자 AI 챗봇">
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.headerAvatar}>🛡️</div>
            <div className={styles.headerInfo}>
              <p className={styles.headerTitle}>관리자 AI</p>
              <p className={styles.headerSub}>
                {user
                  ? (user.userName || user.name || '관리자') + '님'
                  : '운영팀 전용'}
                {' · '}탭 닫으면 기록 삭제
              </p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.iconBtn} onClick={clear} title="초기화">
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
                onClick={function () {
                  setOpen(false);
                }}
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
                <span className={styles.welcomeEmoji}>🛡️</span>
                <p className={styles.welcomeTitle}>관리자 AI 어시스턴트</p>
                <p className={styles.welcomeText}>
                  운영 통계, 입주자 현황, 민원 분석 등을{'\n'}자유롭게
                  질문하세요.
                </p>
              </div>
            ) : (
              messages.map(function (msg, i) {
                return <MessageBubble key={msg.ts + '-' + i} msg={msg} />;
              })
            )}
            {loading && <TypingIndicator />}
            {error && <div className={styles.errorMsg}>{error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* 빠른 질문 */}
          {messages.length === 0 && (
            <div className={styles.quickChips}>
              {QUICK_QUESTIONS.map(function (q) {
                return (
                  <button
                    key={q}
                    className={styles.chip}
                    onClick={function () {
                      sendMessage(q);
                    }}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          )}

          {/* 입력 영역 */}
          <div className={styles.footer}>
            <div className={styles.inputRow}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder="운영 데이터를 자유롭게 질문하세요… (Enter 전송)"
                value={input}
                onChange={function (e) {
                  setInput(e.target.value);
                }}
                onKeyDown={onKeyDown}
                rows={1}
                aria-label="메시지 입력"
              />
              <button
                className={styles.sendBtn}
                onClick={function () {
                  sendMessage();
                }}
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
              ⚠️ 어드민 전용 · 민감 데이터 포함 가능
            </p>
          </div>
        </div>
      )}
    </>
  );
}
