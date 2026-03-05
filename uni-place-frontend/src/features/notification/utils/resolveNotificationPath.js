function toPositiveInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const int = Math.trunc(num);
  return int > 0 ? int : null;
}

function trailingNumber(path) {
  const m = String(path || '').match(/\/(\d+)(?:\?.*)?$/);
  return m ? toPositiveInt(m[1]) : null;
}

function messageNumber(message, key) {
  const m = String(message || '').match(
    new RegExp(`${key}\\s*=\\s*(\\d+)`, 'i')
  );
  return m ? toPositiveInt(m[1]) : null;
}

function queryNumber(path, key) {
  try {
    const url = new URL(path, 'https://local.invalid');
    return toPositiveInt(url.searchParams.get(key));
  } catch {
    return null;
  }
}

function withQuery(path, params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '') return;
    search.set(k, String(v));
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

function sanitizeRawPath(rawPath) {
  const raw = String(rawPath || '').trim();
  if (!raw) return '';
  const slashed = raw.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(slashed)) {
    try {
      const u = new URL(slashed);
      return `${u.pathname || ''}${u.search || ''}` || '';
    } catch {
      return '';
    }
  }
  if (slashed.startsWith('/')) return slashed;
  return `/${slashed}`;
}

function normalizeFromRawPath(rawPath, item) {
  const path = sanitizeRawPath(rawPath);
  const targetId = toPositiveInt(item?.targetId);
  const msg = String(item?.message || '');

  if (!path || path === '/') return null;

  // 공지사항
  if (path.startsWith('/notices/')) {
    return path.replace('/notices/', '/support/notice/');
  }

  // 커뮤니티
  // 실제 라우트: /community, /community/:boardId
  // 백엔드가 /community/boards/123 또는 /boards/123 으로 보냄
  if (path.startsWith('/community/boards/')) {
    const boardId = trailingNumber(path);
    return boardId ? `/community/${boardId}` : '/community';
  }
  if (path.startsWith('/boards/')) {
    const boardId = trailingNumber(path);
    return boardId ? `/community/${boardId}` : '/community';
  }
  if (path === '/boards' || path === '/community') {
    return '/community';
  }

  // 보안/마이페이지
  if (path === '/mypage/security') {
    return '/me?tab=me';
  }

  // 계약 (유저)
  if (
    path === '/me?tab=myroom&sub=contracts' ||
    path.startsWith('/me?tab=myroom')
  ) {
    return path;
  }
  if (path === '/mypage/contracts' || path === '/contracts/me') {
    const contractId =
      queryNumber(path, 'contractId') ??
      targetId ??
      messageNumber(msg, 'contractId');
    return withQuery('/me?tab=myroom&sub=contracts', { contractId });
  }

  // 결제 (유저)
  // 실제 라우트: /commerce/orders
  // /payments/123 같은 경로는 라우트 없으므로 목록으로
  if (
    path === '/payments/my' ||
    path === '/mypage/orders' ||
    path === '/commerce/orders'
  ) {
    return '/commerce/orders';
  }
  if (path.startsWith('/payments/') || path.startsWith('/pay/')) {
    return '/commerce/orders';
  }

  // 공간예약 (유저)
  if (path.startsWith('/space-reservations/my')) {
    return '/me?tab=space&sub=list';
  }

  // 투어예약 (관리자)
  if (
    path.startsWith('/tour-reservations') ||
    path.startsWith('/admin/tour-reservations')
  ) {
    const tourId =
      trailingNumber(path) ??
      queryNumber(path, 'tourId') ??
      targetId ??
      messageNumber(msg, 'tourId');
    return withQuery('/admin/reservations/tours', { tourId });
  }

  // 관리자 결제
  // 실제 라우트: /admin/pay/payments
  if (
    path.startsWith('/admin/payments') ||
    path.startsWith('/admin/pay/payments')
  ) {
    const paymentId =
      trailingNumber(path) ??
      queryNumber(path, 'paymentId') ??
      targetId ??
      messageNumber(msg, 'paymentId');
    return withQuery('/admin/pay/payments', { paymentId });
  }

  // 관리자 공간예약
  if (
    path.startsWith('/admin/space-reservations') ||
    path.startsWith('/admin/reservations/spaces')
  ) {
    const reservationId =
      trailingNumber(path) ??
      queryNumber(path, 'reservationId') ??
      targetId ??
      messageNumber(msg, 'reservationId');
    return withQuery('/admin/reservations/spaces', { reservationId });
  }

  // 관리자 투어예약
  if (path.startsWith('/admin/reservations/tours')) {
    const tourId =
      trailingNumber(path) ??
      queryNumber(path, 'tourId') ??
      targetId ??
      messageNumber(msg, 'tourId');
    return withQuery('/admin/reservations/tours', { tourId });
  }

  // 관리자 유저
  if (path.startsWith('/admin/users')) {
    const keyword = String(path.split('/').pop() || '').trim();
    return withQuery('/admin/users', { keyword: keyword || undefined });
  }

  // QnA 관리자
  if (path.startsWith('/admin/qna') || path.startsWith('/admin/support/qna')) {
    const qnaId =
      trailingNumber(path) ??
      queryNumber(path, 'qnaId') ??
      targetId ??
      messageNumber(msg, 'qnaId');
    return qnaId ? `/admin/support/qna/${qnaId}` : '/admin/support/qna';
  }

  // QnA 유저
  if (path.startsWith('/support/qna')) {
    const qnaId =
      trailingNumber(path) ??
      queryNumber(path, 'qnaId') ??
      targetId ??
      messageNumber(msg, 'qnaId');
    return qnaId ? `/support/qna/${qnaId}` : '/support/qna';
  }

  // 민원 관리자
  if (
    path.startsWith('/admin/complain') ||
    path.startsWith('/admin/support/complain')
  ) {
    const compId =
      trailingNumber(path) ??
      queryNumber(path, 'id') ??
      queryNumber(path, 'compId') ??
      targetId ??
      messageNumber(msg, 'compId');
    return compId
      ? `/admin/support/complain/${compId}`
      : '/admin/support/complain';
  }

  // 민원 유저
  if (path.startsWith('/support/complain')) {
    const compId =
      trailingNumber(path) ??
      queryNumber(path, 'id') ??
      queryNumber(path, 'compId') ??
      targetId ??
      messageNumber(msg, 'compId');
    return compId ? `/support/complain/${compId}` : '/support/complain';
  }

  // 계약 관리자
  if (path.startsWith('/admin/contracts') || path.startsWith('/contracts/')) {
    const contractId =
      trailingNumber(path) ??
      queryNumber(path, 'contractId') ??
      targetId ??
      messageNumber(msg, 'contractId');
    return withQuery('/admin/contracts', { contractId });
  }

  // 주문/룸서비스 관리자
  // 실제 라우트: /admin/roomservice/room_orders
  if (
    path.startsWith('/admin/room-service-orders') ||
    path.startsWith('/admin/room-services') ||
    path.startsWith('/admin/roomservice/room_orders') ||
    path.startsWith('/room-services/')
  ) {
    const orderId =
      trailingNumber(path) ??
      queryNumber(path, 'orderId') ??
      targetId ??
      messageNumber(msg, 'orderId');
    return withQuery('/admin/roomservice/room_orders', { orderId });
  }

  // 주문 유저
  if (path.startsWith('/commerce/orders') || path === '/mypage/orders') {
    return '/commerce/orders';
  }

  // 리뷰
  // 실제 라우트: /reviews/my, /reviews/:reviewId
  // /reviews (trailing 없음) → 없는 라우트
  if (path === '/reviews') {
    return '/reviews/my';
  }
  if (path.startsWith('/reviews/')) {
    return path;
  }

  // 관리자 리뷰/보안 → 라우트 없음 → admin 홈
  if (path === '/admin/reviews' || path === '/admin/security') {
    return '/admin';
  }

  if (path === '/admin') {
    return '/admin';
  }

  return path.startsWith('/') ? path : null;
}

export function resolveNotificationPath(item) {
  const code = String(item?.code || '').toUpperCase();
  const msg = String(item?.message || '');
  const targetId = toPositiveInt(item?.targetId);
  const raw = item?.urlPath;

  const normalized = normalizeFromRawPath(raw, item);
  if (normalized && normalized !== '/') return normalized;

  // urlPath 없을 때 code 기반 fallback

  // QnA
  const qnaId = messageNumber(msg, 'qnaId') ?? targetId;
  if (code.startsWith('QNA_')) {
    if (code === 'QNA_NEW') {
      return qnaId ? `/admin/support/qna/${qnaId}` : '/admin/support/qna';
    }
    return qnaId ? `/support/qna/${qnaId}` : '/support/qna';
  }

  // 민원
  const compId = messageNumber(msg, 'compId') ?? targetId;
  if (code.startsWith('COMP_')) {
    if (code === 'COMP_NEW') {
      return compId
        ? `/admin/support/complain/${compId}`
        : '/admin/support/complain';
    }
    return compId ? `/support/complain/${compId}` : '/support/complain';
  }

  // 계약
  const contractId = messageNumber(msg, 'contractId') ?? targetId;
  if (code.startsWith('CONTRACT_')) {
    if (code === 'CONTRACT_REQ') {
      return withQuery('/admin/contracts', { contractId });
    }
    return withQuery('/me?tab=myroom&sub=contracts', { contractId });
  }

  // 주문/룸서비스
  const orderId = messageNumber(msg, 'orderId');
  if (code === 'ORDER_NEW') {
    return withQuery('/admin/roomservice/room_orders', {
      orderId: orderId ?? targetId,
    });
  }
  if (code === 'ORDER_STATUS') {
    return '/commerce/orders';
  }

  // 공간예약
  if (code.startsWith('SP_')) {
    if (code === 'SP_REQ') {
      return withQuery('/admin/reservations/spaces', {
        reservationId: targetId,
      });
    }
    return '/me?tab=space&sub=list';
  }

  // 투어예약 (관리자만 수신)
  if (code.startsWith('TOUR_')) {
    return withQuery('/admin/reservations/tours', { tourId: targetId });
  }

  // 결제
  if (code.startsWith('PAY_')) {
    if (
      code === 'PAY_OK' ||
      code === 'PAY_FAIL' ||
      code === 'PAY_RETRY' ||
      code === 'PAY_REFUND'
    ) {
      return '/commerce/orders';
    }
    return withQuery('/admin/pay/payments', { paymentId: targetId });
  }

  // 청구서
  if (code === 'BILL_NEW') {
    return '/me?tab=myroom&sub=billing';
  }

  // 보안 (유저)
  if (code.startsWith('SEC_')) {
    return '/me?tab=me';
  }

  // 관리자 보안/시스템
  if (
    code.startsWith('ADM_LOGIN') ||
    code.startsWith('ADM_NEW_DEVICE') ||
    code.startsWith('ADM_ABNORMAL') ||
    code.startsWith('ADM_USER') ||
    code.startsWith('ADM_BULK')
  ) {
    return '/admin';
  }

  // 커뮤니티
  if (code.startsWith('BRD_') || code.startsWith('RPL_')) {
    return '/community';
  }

  // 리뷰
  if (code.startsWith('RVW_') || code === 'ADM_RVW_DEL') {
    return '/reviews/my';
  }

  return null;
}
