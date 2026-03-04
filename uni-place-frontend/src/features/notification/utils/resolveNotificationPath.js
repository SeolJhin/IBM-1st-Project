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
  const m = String(message || '').match(new RegExp(`${key}\\s*=\\s*(\\d+)`, 'i'));
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

  if (path.startsWith('/notices/')) {
    return path.replace('/notices/', '/support/notice/');
  }

  if (path.startsWith('/boards') || path.startsWith('/community/boards')) {
    return '/community';
  }

  if (path === '/mypage/security') {
    return '/me?tab=me';
  }

  if (path === '/mypage/contracts' || path === '/contracts/me') {
    const contractId =
      queryNumber(path, 'contractId') ??
      targetId ??
      messageNumber(msg, 'contractId');
    return withQuery('/me?tab=myroom&sub=contracts', { contractId });
  }

  if (
    path === '/payments/my' ||
    path.startsWith('/payments/') ||
    path.startsWith('/pay/')
  ) {
    return '/commerce/orders';
  }

  if (path.startsWith('/space-reservations/my')) {
    return '/reservations/space/list';
  }

  if (path.startsWith('/tour-reservations')) {
    return '/reservations/tour/list';
  }

  if (path.startsWith('/admin/payments') || path.startsWith('/admin/pay/payments')) {
    const paymentId =
      trailingNumber(path) ??
      queryNumber(path, 'paymentId') ??
      targetId ??
      messageNumber(msg, 'paymentId');
    return withQuery('/admin/pay/payments', { paymentId });
  }

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

  if (
    path.startsWith('/admin/tour-reservations') ||
    path.startsWith('/admin/reservations/tours')
  ) {
    const tourId =
      trailingNumber(path) ??
      queryNumber(path, 'tourId') ??
      targetId ??
      messageNumber(msg, 'tourId');
    return withQuery('/admin/reservations/tours', { tourId });
  }

  if (path.startsWith('/admin/users')) {
    const keyword = String(path.split('/').pop() || '').trim();
    return withQuery('/admin/users', { keyword: keyword || undefined });
  }

  if (path.startsWith('/admin/qna') || path.startsWith('/admin/support/qna')) {
    const qnaId =
      trailingNumber(path) ??
      queryNumber(path, 'qnaId') ??
      targetId ??
      messageNumber(msg, 'qnaId');
    return qnaId ? `/admin/support/qna/${qnaId}` : '/admin/support/qna';
  }

  if (path.startsWith('/support/qna')) {
    const qnaId =
      trailingNumber(path) ??
      queryNumber(path, 'qnaId') ??
      targetId ??
      messageNumber(msg, 'qnaId');
    return qnaId ? `/support/qna/${qnaId}` : '/support/qna';
  }

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

  if (path.startsWith('/support/complain')) {
    const compId =
      trailingNumber(path) ??
      queryNumber(path, 'id') ??
      queryNumber(path, 'compId') ??
      targetId ??
      messageNumber(msg, 'compId');
    return compId ? `/support/complain/${compId}` : '/support/complain';
  }

  if (path.startsWith('/admin/contracts') || path.startsWith('/contracts/')) {
    const contractId =
      trailingNumber(path) ??
      queryNumber(path, 'contractId') ??
      targetId ??
      messageNumber(msg, 'contractId');
    return withQuery('/admin/contracts', { contractId });
  }

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

  return path.startsWith('/') ? path : null;
}

export function resolveNotificationPath(item) {
  const code = String(item?.code || '').toUpperCase();
  const msg = String(item?.message || '');
  const targetId = toPositiveInt(item?.targetId);
  const raw = item?.urlPath;

  const normalized = normalizeFromRawPath(raw, item);
  if (normalized && normalized !== '/') return normalized;

  const qnaId = messageNumber(msg, 'qnaId') ?? targetId;
  if (code.startsWith('QNA_')) {
    if (code === 'QNA_NEW') {
      return qnaId ? `/admin/support/qna/${qnaId}` : '/admin/support/qna';
    }
    return qnaId ? `/support/qna/${qnaId}` : '/support/qna';
  }

  const compId = messageNumber(msg, 'compId') ?? targetId;
  if (code.startsWith('COMP_')) {
    if (code === 'COMP_NEW') {
      return compId
        ? `/admin/support/complain/${compId}`
        : '/admin/support/complain';
    }
    return compId ? `/support/complain/${compId}` : '/support/complain';
  }

  const contractId = messageNumber(msg, 'contractId') ?? targetId;
  if (code.startsWith('CONTRACT_')) {
    if (code === 'CONTRACT_REQ') {
      return withQuery('/admin/contracts', { contractId });
    }
    return withQuery('/me?tab=myroom&sub=contracts', { contractId });
  }

  if (contractId) {
    return withQuery('/admin/contracts', { contractId });
  }

  const orderId = messageNumber(msg, 'orderId');
  if (
    orderId ||
    code.includes('ROOMSERVICE') ||
    code.includes('ROOM_SERVICE') ||
    code.includes('ORDER')
  ) {
    return withQuery('/admin/roomservice/room_orders', {
      orderId: orderId ?? targetId,
    });
  }

  if (code.startsWith('SP_')) {
    return withQuery('/admin/reservations/spaces', { reservationId: targetId });
  }

  if (code.startsWith('TOUR_')) {
    return withQuery('/admin/reservations/tours', { tourId: targetId });
  }

  if (code.startsWith('PAY_')) {
    return withQuery('/admin/pay/payments', { paymentId: targetId });
  }

  if (code.startsWith('SEC_')) {
    return '/me?tab=me';
  }

  if (code.startsWith('BRD_') || code.startsWith('RPL_')) {
    return '/community';
  }

  if (code.startsWith('RVW_')) {
    return '/reviews/my';
  }

  return null;
}
