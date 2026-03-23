/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
// src/features/chat/components/ChatBot.jsx
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SpaceReservationCreate from '../../reservation/pages/SpaceReservationCreate';
import SpaceReservationList from '../../reservation/pages/SpaceReservationList';
import Modal from '../../../shared/components/Modal/Modal';
import styles from './ChatBot.module.css';
import { useChat, speakText } from '../hooks/useChat';
import chatbotIcon from './horse_only.png';
import chatbotFabIcon from './chatbot_icon_final.png';
import uniplaceLogoImg from './uniplace_header_logo.png';
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

function buildTourCreateUrl(params) {
  var query = new URLSearchParams();
  if (params.buildingId) query.set('buildingId', String(params.buildingId));
  if (params.roomId) query.set('roomId', String(params.roomId));
  if (params.date) query.set('date', String(params.date));
  if (params.startAt) query.set('startAt', String(params.startAt));
  if (params.endAt) query.set('endAt', String(params.endAt));
  var qs = query.toString();
  return qs ? '/reservations/tour/create?' + qs : '/reservations/tour/create';
}

function extractLatestTourPrefill(allMessages) {
  function toTwoDigits(value) {
    return String(value).padStart(2, '0');
  }

  if (!Array.isArray(allMessages)) return {};
  for (var i = allMessages.length - 1; i >= 0; i--) {
    var msg = allMessages[i];
    if (!msg || msg.role !== 'assistant') continue;
    var metadata = msg.metadata || {};
    if (metadata.recommend_type !== 'tour_reserve') continue;

    var date = metadata.date || null;
    var startAt = metadata.start_at || null;
    var endAt = metadata.end_at || null;

    // metadata에 시간이 없으면 답변 텍스트의 날짜/시간 범위를 파싱해 보완
    var content = msg.content || '';
    if (!date) {
      var dateMatch = content.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
      if (dateMatch) date = dateMatch[1];
    }
    if ((!startAt || !endAt) && date) {
      var rangeMatch = content.match(
        /([01]?\d|2[0-3]):([0-5]\d)\s*[~\-]\s*([01]?\d|2[0-3]):([0-5]\d)/
      );
      if (rangeMatch) {
        startAt =
          date +
          'T' +
          toTwoDigits(rangeMatch[1]) +
          ':' +
          rangeMatch[2] +
          ':00';
        endAt =
          date +
          'T' +
          toTwoDigits(rangeMatch[3]) +
          ':' +
          rangeMatch[4] +
          ':00';
      }
    }

    return {
      buildingId: metadata.building_id || null,
      roomId: metadata.room_id || null,
      date: date,
      startAt: startAt,
      endAt: endAt,
    };
  }
  return {};
}

function ActionButtons({ buttons, onAction, allMessages }) {
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
              var pathOnly = normalizedUrl.split('?')[0];
              var urlParams = new URLSearchParams(
                normalizedUrl.split('?')[1] || ''
              );

              if (pathOnly === '/reservations/tour/create') {
                var suggested = extractLatestTourPrefill(allMessages);
                navigate(
                  buildTourCreateUrl({
                    buildingId:
                      urlParams.get('buildingId') || suggested.buildingId,
                    roomId: urlParams.get('roomId') || suggested.roomId,
                    date: urlParams.get('date') || suggested.date,
                    startAt: urlParams.get('startAt') || suggested.startAt,
                    endAt: urlParams.get('endAt') || suggested.endAt,
                  })
                );
                return;
              }

              if (pathOnly === '/reservations/tour/list') {
                navigate('/reservations/tour/list');
                return;
              }

              if (
                normalizedUrl.startsWith('http') ||
                normalizedUrl.startsWith('/ai/') ||
                normalizedUrl.startsWith('/api/ai/') ||
                normalizedUrl.startsWith('/api/')
              ) {
                var openUrl = normalizedUrl.startsWith('/ai/')
                  ? `/api${normalizedUrl}`
                  : normalizedUrl;
                window.open(openUrl, '_blank');
              } else if (
                (pathOnly === '/me' &&
                  (normalizedUrl.includes('tab=space') ||
                    !normalizedUrl.includes('tab='))) ||
                normalizedUrl.includes('tab=space&sub=create') ||
                normalizedUrl.includes('tab=space&sub=list') ||
                pathOnly === '/reservations/space/create' ||
                pathOnly === '/reservations/space/list'
              ) {
                // 공용공간 → 대화 내역에서 building_id / space_id 추출 후 모달 오픈
                var isList =
                  normalizedUrl.includes('sub=list') ||
                  pathOnly === '/reservations/space/list';
                if (isList) {
                  if (onAction) onAction(null, { type: 'space_list' });
                  return;
                }
                // 대화 내역에서 building_id / space_id 파싱
                var extractedBuildingId = null;
                var extractedSpaceId = null;
                if (allMessages) {
                  for (var mi = allMessages.length - 1; mi >= 0; mi--) {
                    var m = allMessages[mi];
                    if (m.role !== 'assistant') continue;
                    var txt = m.content || '';
                    // "building_id: 3" 패턴
                    var bidMatch = txt.match(/building_id[:\s]+(\d+)/i);
                    if (bidMatch && !extractedBuildingId)
                      extractedBuildingId = Number(bidMatch[1]);
                    // "space_id: 4" 패턴
                    var sidMatch = txt.match(/space_id[:\s]+(\d+)/i);
                    if (sidMatch && !extractedSpaceId)
                      extractedSpaceId = Number(sidMatch[1]);
                    if (extractedBuildingId && extractedSpaceId) break;
                  }
                }
                // URL 파라미터에서도 시도
                if (!extractedSpaceId && urlParams.get('spaceId'))
                  extractedSpaceId = Number(urlParams.get('spaceId'));
                if (!extractedBuildingId && urlParams.get('buildingId'))
                  extractedBuildingId = Number(urlParams.get('buildingId'));
                if (onAction) {
                  onAction(null, {
                    type: 'space_reserve',
                    spaceId: extractedSpaceId,
                    buildingId: extractedBuildingId,
                  });
                }
              } else if (pathOnly === '/spaces') {
                if (onAction) onAction(null, { type: 'space_list' });
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

function MessageBubble({ msg, onSpeak, onAction, allMessages }) {
  var isUser = msg.role === 'user';
  var actions = Array.isArray(msg.actions) ? msg.actions : [];
  return (
    <div className={isUser ? styles.rowUser : styles.rowAssistant}>
      {!isUser && (
        <div className={styles.bubbleAvatar}>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12,2 22,10 12,22 2,10" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
      )}
      <div>
        <div className={isUser ? styles.bubbleUser : styles.bubbleAssistant}>
          {msg.content}
        </div>
        {!isUser &&
          (actions.length > 0 || (msg.buttons && msg.buttons.length > 0)) && (
            <div className={styles.actionRow}>
              {actions.length > 0 &&
                actions.map(function (action, index) {
                  return (
                    <button
                      key={(action.type || 'action') + '-' + index}
                      className={styles.actionBtn}
                      onClick={function () {
                        if (onAction) onAction(msg, action);
                      }}
                    >
                      {action.label}
                    </button>
                  );
                })}

              {msg.buttons && msg.buttons.length > 0 && (
                <ActionButtons
                  buttons={msg.buttons}
                  onAction={onAction}
                  allMessages={allMessages}
                />
              )}
            </div>
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
      <div className={styles.bubbleAvatar}>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12,2 22,10 12,22 2,10" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>
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

  // ── 공용공간 예약 모달 상태 ──────────────────────────────────
  var spaceModalState = React.useState(false);
  var spaceModalOpen = spaceModalState[0];
  var setSpaceModalOpen = spaceModalState[1];
  var spaceListModalState = React.useState(false);
  var spaceListModalOpen = spaceListModalState[0];
  var setSpaceListModalOpen = spaceListModalState[1];

  // ── 공용공간 자동선택 파라미터 ───────────────────────────────
  var spaceInitState = React.useState(null); // { spaceId, buildingId, startAt, endAt }
  var spaceInit = spaceInitState[0];
  var setSpaceInit = spaceInitState[1];

  var unreadState = React.useState(false);
  var hasUnread = unreadState[0];
  var setHasUnread = unreadState[1];
  var textareaRef = useRef(null);
  var navigate = useNavigate();

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
  var handleAction = chat.handleAction;

  React.useEffect(
    function () {
      if (!open && messages.length > 0) {
        var last = messages[messages.length - 1];
        if (last.role === 'assistant') setHasUnread(true);
      }
    },
    [messages, open]
  );

  // ── 건물 상세에서 "AI에게 물어보기" 이벤트 수신 ──────────────
  React.useEffect(
    function () {
      function handleOpenChatbot(e) {
        var detail = e.detail || {};
        setOpen(true);
        setHasUnread(false);
        setTimeout(function () {
          if (textareaRef.current) textareaRef.current.focus();
          var nm = detail.buildingNm || '';
          if (nm) {
            setInput(nm + ' 건물에 대해 알려줘');
          }
        }, 100);
      }
      window.addEventListener('open-chatbot', handleOpenChatbot);
      return function () {
        window.removeEventListener('open-chatbot', handleOpenChatbot);
      };
    },
    [setInput]
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

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── 액션 버튼 핸들러 ─────────────────────────────────────────
  function onActionClick(msg, action) {
    if (!action) return;

    // 기존 발주서 액션
    if (handleAction) handleAction(msg, action);

    // 공용공간 예약 → 마이페이지 공용시설 탭 (모달)
    if (action.type === 'space_reserve') {
      setSpaceInit({
        spaceId: action.spaceId || null,
        buildingId: action.buildingId || null,
        startAt: action.startAt || null,
        endAt: action.endAt || null,
      });
      setSpaceModalOpen(true);
      return;
    }
    // 공용공간 조회 → 마이페이지 공용시설 조회 탭 (모달)
    if (action.type === 'space_list') {
      setSpaceInit(null);
      setSpaceListModalOpen(true);
      return;
    }
    // 투어 예약 → 예약 생성 페이지로 이동(사전선택 값만 전달)
    if (action.type === 'tour_reserve') {
      setOpen(false);
      navigate(
        buildTourCreateUrl({
          buildingId: action.buildingId || null,
          roomId: action.roomId || null,
          date: action.date || null,
          startAt: action.startAt || null,
          endAt: action.endAt || null,
        })
      );
      return;
    }
    // 투어 조회 → 목록 페이지로 이동
    if (action.type === 'tour_list') {
      setOpen(false);
      navigate('/reservations/tour/list');
      return;
    }
  }

  var retentionLabel = RETENTION_LABEL[userRole] || RETENTION_LABEL.guest;
  var isVoice = mode === 'voice';
  var isBlind = mode === 'blind';

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        className={open ? styles.fabOpen : styles.fab}
        style={
          open
            ? {
                position: 'fixed',
                bottom: '32px',
                right: '32px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '1.5px solid rgba(184,148,90,0.4)',
                background: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.7)',
                zIndex: 1000,
              }
            : {
                width: '80px',
                height: '80px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }
        }
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
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <img
            src={chatbotFabIcon}
            alt="AI 챗봇"
            className={styles.fabImg}
            style={{
              width: '80px',
              height: '80px',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
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
            <div className={styles.headerLogo}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.92)"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
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
                <img
                  src={chatbotIcon}
                  alt="UniPlace AI"
                  className={styles.welcomeHouseImg}
                />
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
                    onAction={onActionClick}
                    allMessages={messages}
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
      {/* ── 공용공간 예약 모달 (마이페이지 공용시설 탭 연결) ── */}
      <Modal
        open={spaceModalOpen}
        onClose={function () {
          setSpaceModalOpen(false);
          setSpaceInit(null);
        }}
        title="🛋️ 공용시설 예약"
        size="lg"
      >
        <SpaceReservationCreate
          inlineMode
          initSpaceId={spaceInit?.spaceId || null}
          initBuildingId={spaceInit?.buildingId || null}
          initStartAt={spaceInit?.startAt || null}
          initEndAt={spaceInit?.endAt || null}
          onSuccess={function () {
            setSpaceModalOpen(false);
            setSpaceInit(null);
            setSpaceListModalOpen(true);
          }}
        />
      </Modal>

      {/* ── 공용공간 예약 조회 모달 (마이페이지 공용시설 탭 연결) ── */}
      <Modal
        open={spaceListModalOpen}
        onClose={function () {
          setSpaceListModalOpen(false);
        }}
        title="📋 공용시설 예약 조회"
        size="lg"
      >
        <SpaceReservationList
          inlineMode
          onGoCreate={function () {
            setSpaceListModalOpen(false);
            setSpaceModalOpen(true);
          }}
        />
      </Modal>
    </>
  );
}
