// src/features/chat/api/chatApi.js
// Groq Free API + Spring 백엔드 연동
// API 키 발급: https://console.groq.com (구글 로그인, 카드 불필요)

import { api } from '../../../app/http/axiosInstance';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const STORAGE_KEY = 'uniplace_chat_history';

const RETENTION_DAYS = {
  guest: 1,
  user: 90,
  tenant: 90,
  admin: 365,
};

function getRetentionDays(userRole) {
  return RETENTION_DAYS[userRole] !== undefined ? RETENTION_DAYS[userRole] : 1;
}

// ── 대화기록 로드 ─────────────────────────────────────────
export function loadHistory(userId, userRole) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    const key = userId != null ? userId : 'guest';
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
    const key = userId != null ? userId : 'guest';
    const retentionMs = getRetentionDays(userRole) * 24 * 60 * 60 * 1000;
    const now = Date.now();
    all[key] = messages.filter(function (m) {
      return now - m.ts < retentionMs;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    // localStorage full 등 무시
  }
}

// ── 대화기록 삭제 ─────────────────────────────────────────
export function clearHistory(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    const key = userId != null ? userId : 'guest';
    delete all[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    // ignore
  }
}

// ── Groq API 호출 ─────────────────────────────────────────
// 함수명 sendToGemini 유지 (useChat.js 하위호환)
export async function sendToGemini(
  apiKey,
  systemPrompt,
  conversationHistory,
  userMessage
) {
  const messages = [{ role: 'system', content: systemPrompt }];

  conversationHistory.forEach(function (msg) {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  });

  messages.push({ role: 'user', content: userMessage });

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    var err = {};
    try {
      err = await res.json();
    } catch (e2) {
      /* ignore */
    }
    var msg =
      err && err.error && err.error.message
        ? err.error.message
        : 'Groq API 오류 (' + res.status + ')';
    throw new Error(msg);
  }

  const data = await res.json();
  var content =
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;
  return content || '응답을 받지 못했습니다.';
}

// ── Spring 백엔드 호출 ────────────────────────────────────
export async function sendToBackend(prompt, userId, userSegment) {
  const res = await api.post('/ai/chat', {
    prompt: prompt,
    userId: userId != null ? userId : null,
    userSegment: userSegment != null ? userSegment : 'GENERAL',
  });
  var answer = res && res.data && res.data.data && res.data.data.answer;
  return answer || '응답을 받지 못했습니다.';
}
