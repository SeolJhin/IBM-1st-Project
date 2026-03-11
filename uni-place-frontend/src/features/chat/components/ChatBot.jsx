/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
// src/features/chat/components/ChatBot.jsx
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';
import Modal from '../../../shared/components/Modal/Modal';
import styles from './ChatBot.module.css';
import { useChat, speakText } from '../hooks/useChat';
import {
  SERVICE_NAME,
  BOT_AVATAR,
  WELCOME_TITLE,
  WELCOME_TEXT,
  FOOTER_NOTE,
  QUICK_QUESTIONS,
  RETENTION_LABEL,
} from '../config/chatConfig';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 챗봇 내 모달로 열어야 하는 URL 목록
var MODAL_ROUTES = {
  '/reservations/tour/create': 'tour_create',
  '/reservations/tour/list': 'tour_list',
};

function ActionButtons({ buttons, onModalRoute }) {
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
              var normalizedUrl = btn.url.trim().replace(/\/$/, '');
              // ?query 제거한 경로만으로 모달 여부 판단
              var pathOnly = normalizedUrl.split('?')[0];
              if (normalizedUrl.startsWith('http')) {
                window.open(normalizedUrl, '_blank');
              } else if (MODAL_ROUTES[pathOnly] && onModalRoute) {
                // 챗봇 내 모달로 처리할 라우트
                onModalRoute(MODAL_ROUTES[pathOnly]);
              } else if (pathOnly === '/spaces') {
                // 공용시설 목록 → /rooms 페이지의 공용공간 탭으로 이동
                navigate('/rooms', { state: { tab: 'spaces' } });
              } else {
                navigate(normalizedUrl);
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

function MessageBubble({ msg, onSpeak, onModalRoute }) {
  var isUser = msg.role === 'user';
  return (
    <div className={isUser ? styles.rowUser : styles.rowAssistant}>
      {!isUser && <div className={styles.bubbleAvatar}>🤖</div>}
      <div>
        <div className={isUser ? styles.bubbleUser : styles.bubbleAssistant}>
          {msg.content}
        </div>
        {!isUser && msg.buttons && msg.buttons.length > 0 && (
          <ActionButtons buttons={msg.buttons} onModalRoute={onModalRoute} />
        )}
        <div className={styles.bubbleTime}>
          {formatTime(msg.ts)}
          {!isUser && onSpeak && (
            <button
              className={styles.speakBtn}
              onClick={function () {
                onSpeak(msg.content);
              }}
              title="이 메시지 읽기"
            >
              🔊
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className={styles.typingRow}>
      <div className={styles.bubbleAvatar}>🤖</div>
      <div className={styles.typingBubble}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}

// 모드 배너
function ModeBanner({ mode, listening, onExit }) {
  if (!mode) return null;
  var isBlind = mode === 'blind';
  return (
    <div className={isBlind ? styles.blindBanner : styles.voiceBanner}>
      <span className={listening ? styles.voiceDotActive : styles.voiceDot} />
      <span>
        {isBlind
          ? listening
            ? '👁️ 듣고 있어요… 말씀해주세요'
            : '👁️ 시각장애인 모드 · 답변 후 자동 재생'
          : listening
            ? '🎤 듣고 있어요… 말씀해주세요'
            : '🎤 음성 모드 · 연속 대화 중'}
      </span>
      <button className={styles.voiceBannerClose} onClick={onExit}>
        ✕
      </button>
    </div>
  );
}

export default function ChatBot({ user, geminiApiKey, useBackend }) {
  var openState = React.useState(false);
  var open = openState[0];
  var setOpen = openState[1];
  var tourModalState = React.useState(false);
  var tourModalOpen = tourModalState[0];
  var setTourModalOpen = tourModalState[1];
  var tourListModalState = React.useState(false);
  var tourListModalOpen = tourListModalState[0];
  var setTourListModalOpen = tourListModalState[1];
  var unreadState = React.useState(false);
  var hasUnread = unreadState[0];
  var setHasUnread = unreadState[1];
  var textareaRef = useRef(null);

  var chat = useChat({
    user: user,
    geminiApiKey: geminiApiKey,
    useBackend: useBackend || false,
  });
  var messages = chat.messages;
  var input = chat.input;
  var setInput = chat.setInput;
  var loading = chat.loading;
  var error = chat.error;
  var sendMessage = chat.sendMessage;
  var clear = chat.clear;
  var bottomRef = chat.bottomRef;
  var userRole = chat.userRole;
  var mode = chat.mode;
  var listening = chat.listening;
  var setVoiceMode = chat.setVoiceMode;
  var exitMode = chat.exitMode;
  var speakMessage = chat.speakMessage;

  React.useEffect(
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
      // 열릴 때 최하단으로 스크롤
      if (bottomRef.current)
        bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }, 80);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  var retentionLabel = RETENTION_LABEL[userRole] || RETENTION_LABEL.guest;
  var isVoice = mode === 'voice';
  var isBlind = mode === 'blind';

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        className={styles.fab}
        onClick={
          open
            ? function () {
                setOpen(false);
              }
            : onOpen
        }
        aria-label={open ? '챗봇 닫기' : 'AI 챗봇 열기'}
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
          <svg
            className={styles.fabIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {hasUnread && !open && <span className={styles.badge} />}
      </button>

      {open && (
        <div
          className={isBlind ? styles.panelBlind : styles.panel}
          role="dialog"
          aria-label={`${SERVICE_NAME} AI 챗봇`}
        >
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.headerAvatar}>{BOT_AVATAR}</div>
            <div className={styles.headerInfo}>
              <p className={styles.headerTitle}>{SERVICE_NAME} AI</p>
              <p className={styles.headerSub}>
                {user
                  ? (user.userName || user.name || '회원') + '님'
                  : '서비스 안내 도우미'}
                {' · '}기록 {retentionLabel}
              </p>
            </div>
            <div className={styles.statusDot} />
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

          {/* 모드 배너 */}
          <ModeBanner mode={mode} listening={listening} onExit={exitMode} />

          {/* 메시지 */}
          <div className={styles.body}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                <span className={styles.welcomeEmoji}>👋</span>
                <p className={styles.welcomeTitle}>{WELCOME_TITLE}</p>
                <p className={styles.welcomeText}>
                  {WELCOME_TEXT.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i === 0 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            ) : (
              messages.map(function (msg, i) {
                return (
                  <MessageBubble
                    key={msg.ts + '-' + i}
                    msg={msg}
                    onSpeak={!isBlind ? speakMessage : null}
                    onModalRoute={function (routeKey) {
                      if (routeKey === 'tour_create') setTourModalOpen(true);
                      else if (routeKey === 'tour_list')
                        setTourListModalOpen(true);
                    }}
                  />
                );
              })
            )}
            {loading && <TypingIndicator />}
            {error && <div className={styles.errorMsg}>⚠️ {error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* 빠른 질문 */}
          {messages.length === 0 &&
            !mode &&
            (() => {
              const roleQuestions =
                QUICK_QUESTIONS[userRole] || QUICK_QUESTIONS.guest;
              return (
                <div className={styles.quickChips}>
                  {roleQuestions.map(function (q) {
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
              );
            })()}

          {/* 입력 영역 */}
          <div className={styles.footer}>
            {/* 음성 모드 중 마이크 시각화 */}
            {(isVoice || isBlind) && (
              <div className={styles.voiceCenter}>
                <div className={listening ? styles.micPulse : styles.micIdle}>
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
                <p className={styles.voiceHint}>
                  {listening
                    ? '말씀해주세요…'
                    : loading
                      ? 'AI 생각 중…'
                      : '잠시 후 자동으로 듣습니다'}
                </p>
              </div>
            )}

            {/* 텍스트 입력 (항상 표시 — 음성모드에서도 사용 가능) */}
            <div className={styles.inputRow}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder={
                  mode
                    ? '텍스트로도 입력 가능해요…'
                    : '메시지를 입력하세요… (Enter 전송)'
                }
                value={input}
                onChange={function (e) {
                  setInput(e.target.value);
                }}
                onKeyDown={onKeyDown}
                rows={1}
                aria-label="메시지 입력"
              />

              {/* 전송 버튼 */}
              <button
                className={styles.sendBtn}
                onClick={function () {
                  sendMessage();
                }}
                disabled={!input.trim()}
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

            {/* 모드 버튼 행 */}
            <div className={styles.modeRow}>
              {/* 🎤 일반 음성모드 */}
              <button
                className={isVoice ? styles.modeActiveBtn : styles.modeBtn}
                onClick={function () {
                  setVoiceMode('voice');
                }}
                title="음성 모드 (TTS 없음, 연속 대화)"
              >
                🎤 {isVoice ? '음성 ON' : '음성'}
              </button>

              {/* 👁️ 시각장애인 모드 */}
              <button
                className={isBlind ? styles.modeActiveBtnBlind : styles.modeBtn}
                onClick={function () {
                  setVoiceMode('blind');
                }}
                title="시각장애인 모드 (TTS 자동 + 연속 대화)"
              >
                👁️ {isBlind ? '접근성 ON' : '접근성'}
              </button>
            </div>

            <p className={styles.footerNote}>{FOOTER_NOTE}</p>
          </div>
        </div>
      )}
      {/* ── 투어 예약 모달 ── */}
      <Modal
        open={tourModalOpen}
        onClose={function () {
          setTourModalOpen(false);
        }}
        title="📅 사전 방문 예약"
        size="lg"
      >
        <TourReservationCreate
          inlineMode
          onSuccess={function () {
            setTourModalOpen(false);
            setTourListModalOpen(true);
          }}
          onClose={function () {
            setTourModalOpen(false);
          }}
          onGoList={function () {
            setTourModalOpen(false);
            setTourListModalOpen(true);
          }}
        />
      </Modal>

      {/* ── 투어 예약 조회 모달 ── */}
      <Modal
        open={tourListModalOpen}
        onClose={function () {
          setTourListModalOpen(false);
        }}
        title="📋 방문 예약 조회"
        size="lg"
      >
        <TourReservationList
          inlineMode
          onGoCreate={function () {
            setTourListModalOpen(false);
            setTourModalOpen(true);
          }}
          onClose={function () {
            setTourListModalOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
