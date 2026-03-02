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

  // 1. errorCode 기반 매핑 우선
  if (err.errorCode && ERROR_MESSAGES[err.errorCode]) {
    return ERROR_MESSAGES[err.errorCode];
  }

  // 2. 백엔드에서 내려온 message가 한글이면 그대로 사용
  if (err.message && isKorean(err.message)) {
    return err.message;
  }

  // 3. HTTP 상태 기반 기본 메시지
  if (err.status && HTTP_STATUS_MESSAGES[err.status]) {
    return HTTP_STATUS_MESSAGES[err.status];
  }

  // 4. 네트워크 오류 감지
  const msg = err.message?.toLowerCase() ?? '';
  if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
  }
  if (err.name === 'TypeError') {
    return '네트워크 연결을 확인해주세요.';
  }

  return fallback;
}

function isKorean(text) {
  return /[\uAC00-\uD7A3\u3130-\u318F\u1100-\u11FF]/.test(text);
}
