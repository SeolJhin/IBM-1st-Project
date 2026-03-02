function str(value) {
  return String(value ?? '');
}

function hasKorean(text) {
  return /[가-힣]/.test(str(text));
}

function readValue(message, key) {
  const safe = str(message);
  const match = safe.match(new RegExp(`${key}\\s*=\\s*([^,\\)]+)`, 'i'));
  return match ? str(match[1]).trim() : '';
}

function paymentAmount(message) {
  return readValue(message, '결제금액') || readValue(message, 'amount');
}

function paymentId(item, message) {
  return item?.targetId || readValue(message, 'paymentId');
}

function normalizeByCode(item, code, message) {
  const pid = paymentId(item, message);
  const amt = paymentAmount(message);
  const provider = readValue(message, 'provider');
  const unlockAt = readValue(message, 'unlockAt') || readValue(message, '해제시각');
  const deviceId = readValue(message, 'deviceId');
  const ip = readValue(message, 'ip');

  switch (code) {
    case 'BRD_LIKE':
      return '작성하신 게시글에 좋아요가 눌렸습니다.';
    case 'RPL_LIKE':
      return '작성하신 댓글에 좋아요가 눌렸습니다.';
    case 'BRD_REPLY':
      return '작성하신 게시글에 댓글이 달렸습니다.';
    case 'BRD_REREPLY':
      return '작성하신 댓글에 답글이 달렸습니다.';
    case 'ADM_BRD_DEL':
      return '관리자 정책에 의해 게시글이 삭제되었습니다.';
    case 'ADM_RPL_DEL':
      return '관리자 정책에 의해 댓글이 삭제되었습니다.';
    case 'ADM_BRD_IMP':
      return '중요공지 설정이 변경되었습니다.';
    case 'RVW_NEW':
      return '새 리뷰가 등록되었습니다.';
    case 'ADM_RVW_DEL':
      return '관리자 정책에 의해 리뷰가 삭제되었습니다.';
    case 'SP_REQ':
      return hasKorean(message) ? message : '공간 예약 요청이 접수되었습니다.';
    case 'SP_CFM':
      return hasKorean(message) ? message : '공간 예약이 확정되었습니다.';
    case 'SP_CAN':
      return hasKorean(message) ? message : '공간 예약이 취소되었습니다.';
    case 'SP_REM':
      return hasKorean(message) ? message : '공간 예약 알림이 도착했습니다.';
    case 'TOUR_REQ':
      return hasKorean(message) ? message : '투어 예약 요청이 접수되었습니다.';
    case 'TOUR_CFM':
      return hasKorean(message) ? message : '투어 예약이 확정되었습니다.';
    case 'TOUR_CAN':
      return hasKorean(message) ? message : '투어 예약이 취소되었습니다.';
    case 'TOUR_REM':
      return hasKorean(message) ? message : '투어 예약 알림이 도착했습니다.';
    case 'PAY_OK':
      return pid
        ? `결제가 완료되었습니다. (paymentId=${pid}${amt ? `, 결제금액=${amt}` : ''})`
        : '결제가 완료되었습니다.';
    case 'PAY_FAIL':
      return pid ? `결제에 실패했습니다. (paymentId=${pid})` : '결제에 실패했습니다.';
    case 'PAY_RETRY':
      return pid ? `결제를 다시 시도합니다. (paymentId=${pid})` : '결제를 다시 시도합니다.';
    case 'PAY_REFUND':
      return hasKorean(message) ? message : '환불이 완료되었습니다.';
    case 'PAY_STATUS_ADMIN':
      return '관리자가 결제 상태를 변경했습니다.';
    case 'PAY_WEBHOOK_FAIL':
      return '결제 웹훅 검증에 실패했습니다.';
    case 'PAY_DUPLICATE':
      return '중복 결제가 감지되었습니다.';
    case 'PAY_STATUS_MISMATCH':
      return '결제 상태 불일치가 감지되었습니다.';
    case 'PAY_BATCH_FAIL':
      return '결제 배치 처리에 실패했습니다.';
    case 'SEC_NEW_DEVICE': {
      const bits = [deviceId && `기기=${deviceId}`, ip && `IP=${ip}`].filter(Boolean);
      return bits.length ? `새 기기 로그인이 감지되었습니다. (${bits.join(', ')})` : '새 기기 로그인이 감지되었습니다.';
    }
    case 'SEC_EMAIL_CHG':
      return '이메일이 변경되었습니다.';
    case 'SEC_TEL_CHG':
      return '전화번호가 변경되었습니다.';
    case 'SEC_PWD_CHG':
      return '비밀번호가 변경되었습니다.';
    case 'SEC_LOGIN_LOCK':
      return unlockAt ? `반복된 로그인 실패로 계정이 잠겼습니다. (해제시각=${unlockAt})` : '반복된 로그인 실패로 계정이 잠겼습니다.';
    case 'SEC_SOCIAL_LINK':
      return provider ? `소셜 계정 연동이 완료되었습니다. (provider=${provider})` : '소셜 계정 연동이 완료되었습니다.';
    case 'ADM_LOGIN_OK':
      return '관리자 로그인 성공 알림입니다.';
    case 'ADM_NEW_DEVICE':
      return '관리자 계정의 새 기기 로그인이 감지되었습니다.';
    case 'ADM_LOGIN_LOCK':
      return '관리자 계정이 반복된 로그인 실패로 잠겼습니다.';
    case 'ADM_USER_ROLE_CHG':
      return '관리자가 사용자 권한을 변경했습니다.';
    case 'ADM_USER_STATUS_CHG':
      return '관리자가 사용자 상태를 변경했습니다.';
    case 'ADM_BULK_USER_CHANGE':
      return '대량 사용자 변경이 감지되었습니다.';
    case 'ADM_ABNORMAL_TRAFFIC':
      return '비정상 로그인 트래픽이 감지되었습니다.';
    case 'ADM_ABNORMAL_API':
      return '비정상 API 접근이 감지되었습니다.';
    case 'ADMIN_NOTICE':
      return hasKorean(message) ? message : '관리자 공지 알림입니다.';
    default:
      return '';
  }
}

function replaceLegacyEnglish(message) {
  let out = str(message);
  out = out.replace(/Email has been changed\.?/gi, '이메일이 변경되었습니다.');
  out = out.replace(/Phone number has been changed\.?/gi, '전화번호가 변경되었습니다.');
  out = out.replace(/Password has been changed\.?/gi, '비밀번호가 변경되었습니다.');
  out = out.replace(/Social account linked\.?/gi, '소셜 계정 연동이 완료되었습니다.');
  out = out.replace(/Abnormal API access detected/gi, '비정상 API 접근이 감지되었습니다');
  out = out.replace(/Abnormal login traffic detected/gi, '비정상 로그인 트래픽이 감지되었습니다');
  out = out.replace(/New device login detected/gi, '새 기기 로그인이 감지되었습니다');
  out = out.replace(/Admin login success/gi, '관리자 로그인 성공');
  out = out.replace(/Admin login locked/gi, '관리자 계정 로그인 잠금');
  out = out.replace(/Login blocked for 5 minutes due to repeated failures/gi, '반복된 로그인 실패로 5분 동안 로그인이 차단되었습니다');
  out = out.replace(/Bulk user change detected/gi, '대량 사용자 변경이 감지되었습니다');
  out = out.replace(/Admin changed user status/gi, '관리자가 사용자 상태를 변경했습니다');
  out = out.replace(/Admin changed user role/gi, '관리자가 사용자 권한을 변경했습니다');
  return out;
}

export function localizeNotificationMessage(item) {
  const code = str(item?.code).toUpperCase();
  const message = str(item?.message).trim();

  const byCode = normalizeByCode(item, code, message);
  if (byCode) {
    return byCode;
  }
  if (hasKorean(message)) {
    return message;
  }

  const replaced = replaceLegacyEnglish(message);
  return replaced || '알림이 도착했습니다.';
}

