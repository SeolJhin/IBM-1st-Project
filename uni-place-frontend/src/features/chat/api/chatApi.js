/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
// src/features/chat/api/chatApi.js
// Spring 백엔드 연동 (intent 분류는 AI 서버가 LLM으로 자동 처리)

import { api } from '../../../app/http/axiosInstance';
import {
  GROQ_MODEL,
  GROQ_TEMPERATURE,
  GROQ_MAX_TOKENS,
  HISTORY_STORAGE_KEY,
  HISTORY_WINDOW,
  RETENTION_DAYS,
  FOLLOW_UP_PATTERN,
} from '../config/chatConfig';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const STORAGE_KEY = HISTORY_STORAGE_KEY;

function getRetentionDays(userRole) {
  return RETENTION_DAYS[userRole] !== undefined ? RETENTION_DAYS[userRole] : 1;
}

// ── 대화기록 로드 ─────────────────────────────────────────
export function loadHistory(userId, userRole) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    const key = userId != null ? String(userId) : 'guest';
    const records = Array.isArray(all[key]) ? all[key] : [];
    const retentionMs = getRetentionDays(userRole) * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return records.filter(function (msg) {
      return now - msg.ts < retentionMs;
    });
  } catch (e) {
    return [];
  }
}

// ── 대화기록 저장 ─────────────────────────────────────────
export function saveHistory(userId, userRole, messages) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const key = userId != null ? String(userId) : 'guest';
    const retentionMs = getRetentionDays(userRole) * 24 * 60 * 60 * 1000;
    const now = Date.now();
    all[key] = messages.filter(function (m) {
      return now - m.ts < retentionMs;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
}

// ── 대화기록 삭제 ─────────────────────────────────────────
export function clearHistory(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    const key = userId != null ? String(userId) : 'guest';
    delete all[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
}

// ── Groq 직접 호출 (useBackend=false) ────────────────────
export var SYSTEM_PROMPT = `당신은 UNI PLACE의 AI 어시스턴트입니다. 항상 친절하고 자연스러운 한국어로 응답하세요.

━━━ UNI PLACE 서비스 전체 안내 ━━━

【건물·방 정보】
- 건물(Building): 건물명, 주소, 설명, 엘리베이터 유무, 주차 가능 대수
- 방(Room): 방 번호, 층, 면적(㎡), 방 타입(원룸/투룸 등), 반려동물 허용 여부, 보증금, 월세, 관리비, 임대 유형(월세/단기), 옵션(에어컨·세탁기 등), 최대 입주 인원, 최소 임대 기간, 향(동/서/남/북), 방 설명
- 방 상태: available(입주 가능), occupied(입주 중), maintenance(점검 중)

【계약】
- 계약 상태: requested(신청됨), active(활성), expired(만료), terminated(해지)
- 계약 정보: 계약 시작일/종료일, 보증금, 월세, 관리비, 납부일, 입주일, 임대인 정보
- 임대 유형: monthly_rent(월세), stay(단기 숙박)
- 계약 갱신, 이상 감지, 계약서 PDF 발급 가능

【결제】
- 결제 상태: ready(대기), paid(완료), cancelled(취소), pending(처리중), disputed(분쟁)
- 결제 수단: 카카오페이 등 PG사 연동
- 납부 내역 조회, 오류 신고, 환불(취소) 문의 가능
- 월 청구서(MonthlyCharge) 별도 발행

【공용공간 예약】
- 예약 상태: requested(신청), confirmed(확정), cancelled(취소)
- 예약 정보: 공간명, 이용 시작/종료 시간, 이용 인원
- 예약 가능 시간 확인, 신청·취소 가능

【투어 예약】
- 방 투어 예약: 날짜·시간 슬롯 선택, 예약·취소 가능
- 투어 상태: PENDING(대기), CONFIRMED(확정), CANCELLED(취소), COMPLETED(완료), NO_SHOW(노쇼)

【룸서비스·상품】
- 상품 주문, 장바구니 관리
- 재고 확인(건물별 재고 관리)
- 주문 상태: PENDING, CONFIRMED, PREPARING, DELIVERED, CANCELLED

【커뮤니티】
- 자유 게시판: 글 작성·수정·삭제·좋아요·댓글
- 민원(Complain): 접수·조회·처리 현황 확인
- 민원 상태: PENDING(접수), IN_PROGRESS(처리중), RESOLVED(해결), CLOSED(종료)
- QnA, 공지사항 조회

【고객 지원】
- FAQ: 카테고리별 자주 묻는 질문 조회
- 공지사항: 최신 공지 확인
- QnA: 1:1 문의 접수

【리뷰】
- 방·건물 리뷰 조회 및 작성

【회원】
- 역할: guest(비회원), user(일반 회원), tenant(입주자), admin(관리자)
- 회원가입, 로그인, 소셜 로그인(카카오 등), 비밀번호 재설정

━━━ 응답 규칙 ━━━
1. 이전 대화 내용을 반드시 기억하고 맥락에 맞게 이어서 답변하세요.
2. 사용자가 언급한 정보(방 번호, 날짜, 금액 등)는 다시 묻지 말고 활용하세요.
3. 답변은 2~4문장으로 간결하게, 절차가 필요한 경우 번호 목록으로 안내하세요.
4. 로그인이 필요한 기능(계약 조회, 결제 내역 등)은 로그인 여부를 먼저 확인하세요.
5. 확실하지 않은 내용은 "정확한 안내는 고객센터(앱 내 QnA)를 이용해 주세요"라고 안내하세요.
6. 금액은 항상 "원" 단위로, 날짜는 "YYYY년 MM월 DD일" 형식으로 표기하세요.`;

export async function sendToGemini(
  apiKey,
  systemPrompt,
  conversationHistory,
  userMessage
) {
  var messages = [{ role: 'system', content: systemPrompt || SYSTEM_PROMPT }];
  conversationHistory.forEach(function (msg) {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  });
  messages.push({ role: 'user', content: userMessage });

  var res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: messages,
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_MAX_TOKENS,
    }),
  });

  if (!res.ok) {
    var err = {};
    try {
      err = await res.json();
    } catch (e2) {}
    var msg =
      err && err.error && err.error.message
        ? err.error.message
        : 'Groq API 오류 (' + res.status + ')';
    throw new Error(msg);
  }
  var data = await res.json();
  var content =
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;
  return content || '응답을 받지 못했습니다.';
}

// ── Spring 백엔드 호출 (useBackend=true) ──────────────────
// prompt + 대화 맥락 전송 → AI 서버가 LLM으로 intent를 자동 분류하여 처리
export async function sendToBackend(prompt, userId, userSegment, history) {
  var recentHistory = Array.isArray(history)
    ? history.slice(-HISTORY_WINDOW).map(function (m) {
        return { role: m.role, content: m.content };
      })
    : [];

  // ── 맥락 기반 슬롯 자동 추출 ──────────────────────────────
  // 후속 질문("~는요", "~도요") 처리: 이전 대화에서 언급된 건물명 등을 자동 인계
  var contextSlots = extractContextSlots(prompt, recentHistory);

  var res = await api.post('/ai/chat/agent-chatbot', {
    intent: 'AI_AGENT_CHATBOT',
    prompt: prompt,
    userId: userId != null ? userId : null,
    userSegment: userSegment != null ? userSegment : 'GENERAL',
    slots: {
      ...contextSlots,
      // history를 slots 최상위에 노출 → Python intent_classifier가 바로 접근 가능
      history: recentHistory,
    },
  });
  var data = res && res.data && res.data.data;
  var answer = data && data.answer;
  var metadata = data && data.metadata;
  // metadata.action_buttons: [{label, url, icon?}] 형태로 AI가 링크 버튼을 내려줌
  var buttons =
    metadata && Array.isArray(metadata.action_buttons)
      ? metadata.action_buttons
      : [];
  return { answer: answer || '응답을 받지 못했습니다.', buttons };
}

// ── 대화 맥락에서 슬롯 자동 추출 ──────────────────────────────
// 후속 질문에서 건물명을 직접 추출하거나 이전 AI 답변에서 인계
// 건물명 추출은 백엔드(DB 목록 기반)에서 처리하므로
// 프론트는 원문 prompt + history를 그대로 전달하는 역할만 담당
function extractContextSlots(prompt, history) {
  var slots = {};

  // 후속 질문 패턴 감지 — config의 FOLLOW_UP_PATTERN 사용 (하드코딩 없음)
  var isFollowUp = FOLLOW_UP_PATTERN.test(prompt);
  if (!isFollowUp) return slots;

  // 후속 질문이면 이전 대화 전체를 context_prompt로 전달
  // → 백엔드(BuildingListUseCase 등)가 DB 건물명 목록과 비교해 정확히 매칭
  var lastAssistant = '';
  for (var i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') {
      lastAssistant = history[i].content || '';
      break;
    }
  }
  if (lastAssistant) {
    slots['context_prompt'] = lastAssistant;
  }

  return slots;
}
