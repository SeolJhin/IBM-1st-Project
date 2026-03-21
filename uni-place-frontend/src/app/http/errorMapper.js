/**
 * 백엔드 ErrorCode(code 필드) → 한글 사용자 메시지 매핑
 */
const ERROR_MESSAGES = {
  // Auth / Security
  AUTH_401: '로그인이 필요합니다.',
  AUTH_403: '접근 권한이 없습니다.',
  AUTH_410: '토큰이 유효하지 않습니다. 다시 로그인해주세요.',
  AUTH_411: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
  AUTH_412: '토큰 형식이 올바르지 않습니다. 다시 로그인해주세요.',
  AUTH_413: '보안을 위해 로그아웃 처리되었습니다. 다시 로그인해주세요.',
  AUTH_414: '로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
  AUTH_415: '보안 위협이 감지되어 전체 로그아웃 처리되었습니다.',

  // User
  USER_404: '사용자를 찾을 수 없습니다.',
  USER_409_1: '이미 사용 중인 이메일입니다.',
  USER_409_2: '이미 사용 중인 전화번호입니다.',
  USER_400_1: '비밀번호가 올바르지 않습니다.',
  USER_400_2: '유효하지 않은 재설정 링크입니다. 다시 요청해주세요.',
  USER_400_3: '재설정 링크가 만료되었습니다. 다시 요청해주세요.',
  USER_400_4: '이메일 인증을 완료해주세요.',
  USER_400_5: '인증코드가 올바르지 않거나 만료되었습니다.',
  USER_429_1: '잠시 후 다시 시도해주세요. (60초 후 재발송 가능)',

  // Common
  COMMON_400: '잘못된 요청입니다.',
  COMMON_500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',

  // System
  SYSTEM_404_1: '회사 정보를 찾을 수 없습니다.',
  SYSTEM_404_2: '배너를 찾을 수 없습니다.',

  // Payment
  PAYMENT_404: '결제 정보를 찾을 수 없습니다.',
  PAYMENT_403: '해당 결제에 접근 권한이 없습니다.',
  PAYMENT_400_1: '이미 결제 완료된 건입니다.',
  PAYMENT_400_2: '이미 취소된 결제입니다.',
  PAYMENT_400_3: '결제 대상 정보가 올바르지 않습니다.',
  PAYMENT_400_4: '환불할 수 없는 결제 상태입니다.',
  PAYMENT_400_5: '환불 금액이 올바르지 않습니다.',
  PAYMENT_502: '결제사 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',

  // Order
  ORDER_404: '주문을 찾을 수 없습니다.',
  ORDER_400_1: '취소할 수 없는 주문 상태입니다.',
  ORDER_403: '해당 주문에 접근 권한이 없습니다.',
  ORDER_400_2: '해당 주문 상태에서는 룸서비스를 요청할 수 없습니다.',

  // Tour Reservation
  TOUR_RSV_404: '방문 예약을 찾을 수 없습니다.',
  TOUR_RSV_400_1: '예약 시간이 올바르지 않습니다.',
  TOUR_RSV_400_2: '예약 슬롯이 올바르지 않습니다.',
  TOUR_RSV_400_3: '현재 예약이 불가능한 방 상태입니다.',
  TOUR_RSV_409_1: '이미 예약된 시간대와 겹칩니다. 다른 시간을 선택해주세요.',
  TOUR_RSV_409_2: '동일한 연락처로 이미 예약이 존재합니다.',
  TOUR_RSV_400_4: '이미 취소된 예약입니다.',
  TOUR_RSV_400_5: '취소할 수 없는 예약 상태입니다.',
  TOUR_RSV_400_6: '방이 해당 건물에 속하지 않습니다.',

  // Space Reservation
  SPACE_RSV_404: '공용공간 예약을 찾을 수 없습니다.',
  SPACE_RSV_400_1: '예약 시간이 올바르지 않습니다.',
  SPACE_RSV_400_2: '예약 슬롯이 올바르지 않습니다.',
  SPACE_RSV_400_3: '예약 인원이 올바르지 않습니다.',
  SPACE_RSV_409: '이미 예약된 시간대와 겹칩니다. 다른 시간을 선택해주세요.',
  SPACE_RSV_400_4: '취소할 수 없는 예약 상태입니다.',
  SPACE_RSV_403: '해당 예약에 접근 권한이 없습니다.',
  SPACE_RSV_403_1: '입주자만 공용공간을 예약할 수 있습니다.',
  SPACE_RSV_403_2: '비활성 상태의 계정은 예약할 수 없습니다.',

  // Building / Room / Space
  BUILDING_404: '선택한 건물을 찾을 수 없습니다.',
  ROOM_404: '선택한 방을 찾을 수 없습니다.',
  SPACE_404: '선택한 공용공간을 찾을 수 없습니다.',
};

/**
 * HTTP 상태코드별 기본 한글 메시지
 */
const HTTP_STATUS_MESSAGES = {
  400: '잘못된 요청입니다.',
  401: '로그인이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  409: '이미 존재하는 정보입니다.',
  422: '입력 정보를 확인해주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  502: '서버와의 통신 중 오류가 발생했습니다.',
  503: '서비스가 일시적으로 중단되었습니다.',
};

const ACTIONS = {
  login: { id: 'login', label: '로그인' },
  retry: { id: 'retry', label: '다시 시도' },
  home: { id: 'home', label: '홈으로' },
  support: { id: 'support', label: '문의하기' },
  reload: { id: 'reload', label: '새로고침' },
};

const AUTH_EXPIRED_CODES = new Set([
  'AUTH_410',
  'AUTH_411',
  'AUTH_412',
  'AUTH_413',
  'AUTH_414',
  'AUTH_415',
]);

function extractPayload(err) {
  const responseData = err?.response?.data;
  if (responseData && typeof responseData === 'object') return responseData;
  const data = err?.data;
  if (data && typeof data === 'object') return data;
  return null;
}

function extractStatus(err) {
  const raw = err?.status ?? err?.response?.status;
  const status = Number(raw);
  return Number.isFinite(status) && status > 0 ? status : 0;
}

function extractErrorCode(err) {
  const payload = extractPayload(err);
  return (
    err?.errorCode ||
    payload?.errorCode ||
    payload?.code ||
    payload?.error_code ||
    ''
  );
}

function extractMessage(err) {
  const payload = extractPayload(err);
  return (
    err?.message ||
    payload?.message ||
    payload?.error ||
    payload?.detail ||
    ''
  );
}

function hasAccessToken() {
  try {
    return Boolean(
      localStorage.getItem('access_token') ||
        localStorage.getItem('accessToken')
    );
  } catch {
    return false;
  }
}

function isNetworkError(err) {
  const code = String(err?.code || '').toLowerCase();
  const name = String(err?.name || '').toLowerCase();
  const msg = String(extractMessage(err) || '').toLowerCase();
  return (
    code === 'err_network' ||
    code === 'econnaborted' ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('load failed') ||
    name === 'typeerror'
  );
}

function isAuthExpired(err, errorCode, status) {
  if (AUTH_EXPIRED_CODES.has(errorCode)) return true;
  if (status !== 401) return false;
  return hasAccessToken();
}

function isForbidden(errorCode, status) {
  return status === 403 || /_403(?:_|$)/.test(errorCode);
}

function isServerError(errorCode, status) {
  return status >= 500 || /^COMMON_5/.test(errorCode);
}

function toActionList(kind) {
  if (kind === 'auth_required' || kind === 'auth_expired') {
    return [ACTIONS.login, ACTIONS.home];
  }
  if (kind === 'forbidden') {
    return [ACTIONS.home, ACTIONS.support];
  }
  if (kind === 'network') {
    return [ACTIONS.retry, ACTIONS.reload];
  }
  if (kind === 'server') {
    return [ACTIONS.retry, ACTIONS.support];
  }
  return [];
}

/**
 * 에러 객체에서 한글 메시지를 추출합니다.
 * 우선순위: errorCode 매핑 → 백엔드 message(한글이면 사용) → HTTP 상태 기본값 → 최종 fallback
 *
 * @param {Error} err
 * @param {string} [fallback]
 * @returns {string} 한글 에러 메시지
 */
export function toKoreanMessage(
  err,
  fallback = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
) {
  if (!err) return fallback;

  if (typeof err === 'string') {
    return err;
  }

  const errorCode = extractErrorCode(err);
  const status = extractStatus(err);
  const message = extractMessage(err);

  // 1. errorCode 기반 매핑 우선
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // 2. 세션 만료 계열 우선 매핑
  if (isAuthExpired(err, errorCode, status)) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해주세요.';
  }

  if (status === 401) {
    return '로그인이 필요합니다.';
  }

  if (status === 403) {
    return '현재 계정 권한으로 접근할 수 없습니다.';
  }

  // 3. 백엔드에서 내려온 message가 한글이면 그대로 사용
  if (message && isKorean(message)) {
    return message;
  }

  // 4. HTTP 상태 기반 기본 메시지
  if (status && HTTP_STATUS_MESSAGES[status]) {
    return HTTP_STATUS_MESSAGES[status];
  }

  // 5. 네트워크 오류 감지
  if (isNetworkError(err)) {
    return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
  }

  return fallback;
}

/**
 * 화면 표시용 에러 가이드(원인 + 사용자 행동 버튼)
 *
 * @param {Error|string|null} err
 * @param {string} [fallback]
 * @returns {{
 *   kind: string,
 *   title: string,
 *   message: string,
 *   actions: Array<{id:string,label:string}>,
 *   status: number,
 *   errorCode: string,
 * }}
 */
export function toErrorGuide(
  err,
  fallback = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
) {
  if (!err) {
    return {
      kind: 'none',
      title: '',
      message: '',
      actions: [],
      status: 0,
      errorCode: '',
    };
  }

  if (typeof err === 'string') {
    return {
      kind: 'message',
      title: '안내',
      message: err,
      actions: [],
      status: 0,
      errorCode: '',
    };
  }

  const status = extractStatus(err);
  const errorCode = extractErrorCode(err);
  const message = toKoreanMessage(err, fallback);

  let kind = 'unknown';
  let title = '오류가 발생했습니다';

  if (isAuthExpired(err, errorCode, status)) {
    kind = 'auth_expired';
    title = '세션이 만료되었습니다';
  } else if (status === 401) {
    kind = 'auth_required';
    title = '로그인이 필요합니다';
  } else if (isForbidden(errorCode, status)) {
    kind = 'forbidden';
    title = '접근 권한이 없습니다';
  } else if (isNetworkError(err)) {
    kind = 'network';
    title = '네트워크 연결 오류';
  } else if (isServerError(errorCode, status)) {
    kind = 'server';
    title = '서버 처리 오류';
  }

  return {
    kind,
    title,
    message,
    actions: toActionList(kind),
    status,
    errorCode,
  };
}

function isKorean(text) {
  return /[\uAC00-\uD7A3\u3130-\u318F\u1100-\u11FF]/.test(text);
}
