function toPositiveInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const int = Math.trunc(num);
  return int > 0 ? int : null;
}

function trailingNumber(path) {
  const m = String(path || '').match(/\/(\d+)(?:\/)?$/);
  return m ? toPositiveInt(m[1]) : null;
}

function messageNumber(message, key) {
  const m = String(message || '').match(new RegExp(`${key}\\s*=\\s*(\\d+)`, 'i'));
  return m ? toPositiveInt(m[1]) : null;
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

function normalizeFromRawPath(rawPath, item) {
  const path = String(rawPath || '').trim();
  const targetId = toPositiveInt(item?.targetId);
  const msg = String(item?.message || '');

  if (!path) return null;

  if (path.startsWith('/notices/')) {
    return path.replace('/notices/', '/support/notice/');
  }

  if (path.startsWith('/boards') || path.startsWith('/community/boards')) {
    return '/community';
  }

  if (path === '/mypage/security') {
    return '/me?tab=me';
  }

  if (path === '/payments/my' || path.startsWith('/payments/')) {
    return '/commerce/orders';
  }

  if (path.startsWith('/space-reservations/my')) {
    return '/reservations/space/list';
  }

  if (path.startsWith('/tour-reservations')) {
    return '/reservations/tour/list';
  }

  if (path.startsWith('/admin/payments')) {
    const paymentId =
      trailingNumber(path) ?? targetId ?? messageNumber(msg, 'paymentId');
    return withQuery('/admin/pay/payments', { paymentId });
  }

  if (path.startsWith('/admin/space-reservations')) {
    const reservationId =
      trailingNumber(path) ?? targetId ?? messageNumber(msg, 'reservationId');
    return withQuery('/admin/reservations/spaces', { reservationId });
  }

  if (path.startsWith('/admin/tour-reservations')) {
    const tourId = trailingNumber(path) ?? targetId ?? messageNumber(msg, 'tourId');
    return withQuery('/admin/reservations/tours', { tourId });
  }

  if (path.startsWith('/admin/users')) {
    const keyword = String(path.split('/').pop() || '').trim();
    return withQuery('/admin/users', { keyword: keyword || undefined });
  }

  if (path.startsWith('/admin/contracts')) {
    const contractId =
      trailingNumber(path) ?? targetId ?? messageNumber(msg, 'contractId');
    return withQuery('/admin/contracts', { contractId });
  }

  if (path.startsWith('/admin/room-services')) {
    const orderId = trailingNumber(path) ?? targetId ?? messageNumber(msg, 'orderId');
    return withQuery('/admin/roomservice/room_orders', { orderId });
  }

  return path;
}

export function resolveNotificationPath(item) {
  const code = String(item?.code || '').toUpperCase();
  const msg = String(item?.message || '');
  const targetId = toPositiveInt(item?.targetId);
  const raw = String(item?.urlPath || '').trim();

  const normalized = normalizeFromRawPath(raw, item);
  if (normalized) return normalized;

  const contractId = messageNumber(msg, 'contractId');
  if (contractId || code.includes('CONTRACT')) {
    return withQuery('/admin/contracts', { contractId: contractId ?? targetId });
  }

  const orderId = messageNumber(msg, 'orderId');
  if (orderId || code.includes('ROOMSERVICE') || code.includes('ORDER')) {
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

  return null;
}
