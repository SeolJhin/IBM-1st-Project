// src/shared/utils/validators.js
// ── 공통 유효성 검사 유틸 ─────────────────────────────────────

/** 비밀번호: 영문 1개 이상 + 숫자 1개 이상 + 특수기호 1개 이상, 8~20자 */
export function validatePassword(pwd) {
  if (!pwd) return '비밀번호를 입력해주세요.';
  if (pwd.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  if (pwd.length > 20) return '비밀번호는 20자 이하여야 합니다.';
  if (!/[a-zA-Z]/.test(pwd)) return '비밀번호에 영문자가 포함되어야 합니다.';
  if (!/[0-9]/.test(pwd)) return '비밀번호에 숫자가 포함되어야 합니다.';
  const hasSpecial = [...pwd].some((ch) =>
    `!@#$%^&*()_+-=[]{};':"\\|,.<>/?\`~`.includes(ch)
  );
  if (!hasSpecial) return '비밀번호에 특수기호가 1개 이상 포함되어야 합니다.';
  return '';
}

/** 이메일 형식 */
export function validateEmail(email) {
  if (!email || !email.trim()) return '이메일을 입력해주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return '올바른 이메일 형식이 아닙니다.';
  return '';
}

/** 전화번호: 010-XXXX-XXXX 또는 010XXXXXXXX (하이픈 선택) */
export function validatePhone(tel) {
  if (!tel || !tel.trim()) return '전화번호를 입력해주세요.';
  const digits = tel.replace(/-/g, '');
  if (!/^01[016789]\d{7,8}$/.test(digits))
    return '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
  return '';
}

/** 이름: 2~30자, 공백 불허 */
export function validateName(name) {
  if (!name || !name.trim()) return '이름을 입력해주세요.';
  if (name.trim().length < 2) return '이름은 2자 이상 입력해주세요.';
  if (name.trim().length > 30) return '이름은 30자 이하로 입력해주세요.';
  return '';
}

/** 닉네임: 2~20자 */
export function validateNickname(nick) {
  if (!nick || !nick.trim()) return '닉네임을 입력해주세요.';
  if (nick.trim().length < 2) return '닉네임은 2자 이상 입력해주세요.';
  if (nick.trim().length > 20) return '닉네임은 20자 이하로 입력해주세요.';
  return '';
}

/** 주민등록번호: 000000-0000000 */
export function validateRrn(rrn) {
  if (!rrn || !rrn.trim()) return '주민등록번호를 입력해주세요.';
  const digits = rrn.replace(/-/g, '');
  if (!/^\d{13}$/.test(digits))
    return '주민등록번호는 13자리 숫자여야 합니다. (예: 000000-0000000)';
  return '';
}

/** 게시글/문의 제목: 2~100자 */
export function validateTitle(title, label = '제목') {
  if (!title || !title.trim()) return `${label}을 입력해주세요.`;
  if (title.trim().length < 2) return `${label}은 2자 이상 입력해주세요.`;
  if (title.trim().length > 100) return `${label}은 100자 이하로 입력해주세요.`;
  return '';
}

/** 게시글/문의 내용: 최소 10자 */
export function validateContent(content, label = '내용', min = 10) {
  if (!content || !content.trim()) return `${label}을 입력해주세요.`;
  if (content.trim().length < min)
    return `${label}은 ${min}자 이상 입력해주세요.`;
  return '';
}

/** 납부일: 1~31 정수 */
export function validatePaymentDay(day) {
  const n = Number(day);
  if (!day && day !== 0) return '납부일을 입력해주세요.';
  if (!Number.isInteger(n) || n < 1 || n > 31)
    return '납부일은 1~31 사이의 숫자여야 합니다.';
  return '';
}

/** 날짜가 오늘 이후인지 */
export function validateFutureDate(dateStr, label = '날짜') {
  if (!dateStr) return `${label}을 선택해주세요.`;
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr < today) return `${label}은 오늘 이후 날짜여야 합니다.`;
  return '';
}

/** 방문 예약자 이름: 2자 이상 */
export function validateTourName(name) {
  if (!name || !name.trim()) return '방문자 이름을 입력해주세요.';
  if (name.trim().length < 2) return '이름은 2자 이상 입력해주세요.';
  return '';
}

/** 방문 예약 비밀번호: 숫자 4자리 */
export function validateTourPwd(pwd) {
  if (!pwd) return '예약 비밀번호를 입력해주세요.';
  if (!/^[0-9]{4}$/.test(pwd)) return '예약 비밀번호는 숫자 4자리여야 합니다.';
  return '';
}
