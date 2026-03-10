// features/chat/config/chatConfig.js
// Gemini API 키 설정
//
// 발급 방법:
//   1. https://aistudio.google.com/app/apikey 접속
//   2. "Create API key" 클릭
//   3. 아래 GEMINI_API_KEY에 붙여넣기
//
// 또는 .env 파일에 REACT_APP_GEMINI_API_KEY=your_key 추가

export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY ?? '';

// 백엔드 Spring AI 엔드포인트 사용 여부
// true: /api/ai/chat 백엔드 호출 (별도 인증 필요)
// false: Gemini API 직접 호출 (기본값, API키만 있으면 됨)
export const USE_BACKEND_AI = false;
