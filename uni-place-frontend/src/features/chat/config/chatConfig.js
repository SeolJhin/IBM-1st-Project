// features/chat/config/chatConfig.js
// ─────────────────────────────────────────────────────────────
// 챗봇 전역 설정 — 이 파일 하나만 수정하면 전체 챗봇에 반영됩니다
// ─────────────────────────────────────────────────────────────

// ── API 키 ────────────────────────────────────────────────────
export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY ?? '';

// ── 지도/날씨 API 키 ──────────────────────────────────────────
// 발급 후 .env.local 파일에 추가하세요:
//   REACT_APP_KAKAO_MAP_KEY=발급받은_JavaScript키
//   REACT_APP_KMA_KEY=공공데이터포털_Decoding키 (기상청 단기예보)
export const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY ?? '';
export const KMA_KEY = process.env.REACT_APP_KMA_KEY ?? '';

// ── 백엔드 사용 여부 ──────────────────────────────────────────
// true  → Spring /api/ai/chat/agent-chatbot 호출 (권장)
// false → Groq API 직접 호출 (API 키 필요)
export const USE_BACKEND_AI = true;

// ── 서비스 브랜딩 ─────────────────────────────────────────────
export const SERVICE_NAME = 'UNI PLACE'; // 서비스 이름 (헤더 타이틀 등)
export const BOT_AVATAR = '🏠'; // 챗봇 플로팅 버튼 아이콘
export const WELCOME_TITLE = '안녕하세요! UNI PLACE AI입니다.';
export const WELCOME_TEXT =
  '계약, 예약, 결제, 커뮤니티 등\n무엇이든 물어보세요!';
export const FOOTER_NOTE =
  'AI 답변은 참고용입니다. 정확한 내용은 고객센터에 문의하세요.';

// ── AI 모델 설정 (Groq 직접 호출 시) ─────────────────────────
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_TEMPERATURE = 0.7;
export const GROQ_MAX_TOKENS = 1024;

// ── 대화 히스토리 설정 ────────────────────────────────────────
export const HISTORY_WINDOW = 5; // AI에게 전달하는 최근 대화 수 (토큰 절감: 10→5턴)
export const HISTORY_STORAGE_KEY = 'uniplace_chat_history';

// ── 역할별 대화 보존 기간 (일) ───────────────────────────────
export const RETENTION_DAYS = {
  guest: 1,
  user: 90,
  tenant: 90,
  admin: 365,
};

// ── 역할 표시 레이블 ──────────────────────────────────────────
export const RETENTION_LABEL = {
  guest: '비회원 · 1일',
  user: '일반회원 · 90일',
  tenant: '입주자 · 90일',
  admin: '관리자 · 365일',
};

// ── 역할별 빠른 질문 버튼 ─────────────────────────────────────
// 자주 하는 질문이 바뀌면 여기만 수정하세요
export const QUICK_QUESTIONS = {
  guest: [
    '입주 가능한 방이 있나요?',
    '반려동물 키울 수 있는 방 있어요?',
    '월세는 얼마예요?',
    '방 투어 예약하고 싶어요',
    '보증금 없는 방 있나요?',
    '주차 가능한 건물 알려주세요',
  ],
  user: [
    '입주 가능한 방이 있나요?',
    '방 투어 예약하고 싶어요',
    '계약은 어떻게 신청하나요?',
    '월세·관리비는 어떻게 납부해요?',
    '자주 묻는 질문 보여주세요',
    '1:1 문의하고 싶어요',
  ],
  tenant: [
    '내 계약 정보 확인하고 싶어요',
    '이번 달 납부 금액이 얼마예요?',
    '우리 건물 공용공간 예약 추천해줘',
    '회의실 비는 시간 알려줘',
    '민원 접수하고 싶어요',
    '룸서비스 주문하고 싶어요',
  ],
  admin: [
    '미납 현황 요약해줘',
    '민원 처리 현황 알려줘',
    '계약 이상 감지 결과 보여줘',
    '룸서비스 재고 현황은?',
    '커뮤니티 게시글 검토 요청',
    '이번 달 결제 요약 보여줘',
  ],
};

// ── 후속 질문 패턴 ────────────────────────────────────────────
// "거기는요?", "그 건물은?" 같은 후속 질문을 감지하는 정규식
export const FOLLOW_UP_PATTERN = /는요|도요|거기|그건|그 건물|그쪽|다른 건물/;

// ── 건물명 한글↔영문 대응표 ───────────────────────────────────
// DB 저장명(영문)과 사용자 발화(한글)가 다를 때 변환해주는 매핑입니다.
// 건물명이 추가되거나 바뀌면 여기에만 추가하세요.
//
// 형식: { '사용자가 입력할 한글': 'DB에 저장된 영문명' }
// 양방향 매칭이므로 영문으로 입력해도 한글로 검색됩니다.
export const BUILDING_NAME_ALIASES = {
  유니플레이스: 'Uniplace',
  유니플레이스a: 'Uniplace A',
  유니플레이스b: 'Uniplace B',
  유니플레이스c: 'Uniplace C',
  // 필요 시 추가: '강남점': 'Uniplace Gangnam', ...
};
