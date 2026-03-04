// src/features/admin/api/adminApi.js
import { fetchWithAuthRetry } from '../../../app/http/apiBase';

let dashboardEndpointUnavailable = false;

function getAccessToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
}

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

function pageableSort(sort, direct) {
  const safeSort = String(sort ?? '').trim();
  const safeDirect = String(direct ?? 'DESC')
    .trim()
    .toUpperCase();
  if (!safeSort) return undefined;
  return `${safeSort},${safeDirect === 'ASC' ? 'ASC' : 'DESC'}`;
}

async function parsePayload(res) {
  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json().catch(() => null);
  }
  return res.text().catch(() => null);
}

function unwrapOrThrow(res, payload) {
  const api =
    payload && typeof payload === 'object' && 'success' in payload
      ? payload
      : null;

  if (!res.ok || (api && api.success === false)) {
    const message =
      (api && api.message) ||
      (payload && payload.message) ||
      (typeof payload === 'string'
        ? payload
        : '요청 처리 중 오류가 발생했습니다.');
    const error = new Error(message);
    error.status = res.status;
    error.errorCode = api?.errorCode;
    error.data = payload;
    throw error;
  }

  return api ? api.data : payload;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function extractTotalCount(payload) {
  if (payload == null) return 0;

  if (typeof payload === 'number') return toNumber(payload);
  if (Array.isArray(payload)) return payload.length;
  if (typeof payload !== 'object') return 0;

  const directKeys = [
    'totalElements',
    'totalCount',
    'count',
    'total',
    'elements',
  ];
  for (const key of directKeys) {
    if (payload[key] !== undefined) return toNumber(payload[key]);
  }

  if (Array.isArray(payload.content)) return payload.content.length;
  if (Array.isArray(payload.items)) return payload.items.length;
  if (Array.isArray(payload.rows)) return payload.rows.length;

  if (payload.data && payload.data !== payload) {
    return extractTotalCount(payload.data);
  }

  return 0;
}

async function fetchDashboardFallback() {
  const [
    usersResult,
    spacesResult,
    toursResult,
    contractsResult,
    bannersResult,
    roomServicesResult,
  ] = await Promise.allSettled([
    request(
      `/admin/users${buildQuery({ page: 1, size: 1, sort: 'userId', direct: 'DESC' })}`,
      { auth: true }
    ),
    request(
      `/spaces${buildQuery({ page: 1, size: 1, sort: 'spaceId', direct: 'DESC' })}`
    ),
    request(
      `/admin/tour-reservations${buildQuery({ page: 1, size: 1, sort: 'tourId', direct: 'DESC' })}`,
      { auth: true }
    ),
    request(
      `/admin/contracts${buildQuery({ page: 1, size: 1, sort: 'contractId', direct: 'DESC' })}`,
      { auth: true }
    ),
    request(
      `/admin/banners${buildQuery({ page: 0, size: 1, sort: pageableSort('banId', 'DESC') })}`,
      { auth: true }
    ),
    request(
      `/admin/room-services${buildQuery({ page: 0, size: 1, sort: 'createdAt' })}`,
      { auth: true }
    ),
  ]);

  const settled = [
    usersResult,
    spacesResult,
    toursResult,
    contractsResult,
    bannersResult,
    roomServicesResult,
  ];
  const fulfilledCount = settled.filter(
    (result) => result.status === 'fulfilled'
  ).length;

  if (fulfilledCount === 0) {
    const firstError = settled.find((result) => result.status === 'rejected');
    throw (
      firstError?.reason || new Error('대시보드 데이터를 불러오지 못했습니다.')
    );
  }

  const getCount = (result) =>
    result.status === 'fulfilled' ? extractTotalCount(result.value) : 0;

  return {
    residentCount: getCount(usersResult),
    facilityCount: getCount(spacesResult),
    tourCount: getCount(toursResult),
    contractCount: getCount(contractsResult),
    bannerViewCount: getCount(bannersResult),
    roomServiceOrderCount: getCount(roomServicesResult),
    _source: 'aggregate',
  };
}

async function request(
  path,
  { method = 'GET', body, headers = {}, auth = false } = {}
) {
  const isFormData = body instanceof FormData;

  const res = await fetchWithAuthRetry(
    path,
    {
      method,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),

        ...(auth && getAccessToken()
          ? { Authorization: `Bearer ${getAccessToken()}` }
          : {}),

        ...headers,
      },
      credentials: 'same-origin',

      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    },
    { auth }
  );

  const payload = await parsePayload(res);
  return unwrapOrThrow(res, payload);
}

async function requestForm(
  path,
  { method = 'POST', formData, headers = {}, auth = false } = {}
) {
  const res = await fetchWithAuthRetry(
    path,
    {
      method,
      headers: {
        ...(auth && getAccessToken()
          ? { Authorization: `Bearer ${getAccessToken()}` }
          : {}),
        ...headers,
      },
      credentials: 'same-origin',
      body: formData,
    },
    { auth }
  );

  const payload = await parsePayload(res);
  return unwrapOrThrow(res, payload);
}

export const adminApi = {
  // dashboard
  dashboard: async () => {
    if (!dashboardEndpointUnavailable) {
      try {
        const payload = await request('/admin/dashboard', { auth: true });
        return { ...payload, _source: 'dashboard' };
      } catch (error) {
        const status = Number(error?.status);
        if (status === 401 || status === 403) throw error;
        if (status === 404 || status === 405) {
          dashboardEndpointUnavailable = true;
        }
      }
    }

    return fetchDashboardFallback();
  },

  users: (params) => {
    const q = new URLSearchParams();

    q.set('page', String(params?.page ?? 1));
    q.set('size', String(params?.size ?? 10));
    q.set('sort', params?.sort ?? 'userId');
    q.set('direct', params?.direct ?? 'DESC');

    const role = String(params?.role ?? '').trim();
    if (role && role !== 'all') {
      q.set('role', role);
    }

    return request(`/admin/users?${q.toString()}`, { auth: true });
  },
  getUserDetail: (userId) => request(`/admin/users/${userId}`, { auth: true }),
  updateUserStatus: (userId, userStatus) =>
    request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { userStatus },
      auth: true,
    }),
  updateUserRole: (userId, userRole) =>
    request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: { userRole },
      auth: true,
    }),

  // 관리자 게시글 삭제
  adminDeleteBoard: (boardId) =>
    request(`/admin/boards/${boardId}`, { method: 'DELETE', auth: true }),

  // 관리자 댓글 삭제
  adminDeleteReply: (replyId) =>
    request(`/admin/replies/${replyId}`, { method: 'DELETE', auth: true }),

  // 관리자 리뷰 삭제
  adminDeleteReview: (reviewId) =>
    request(`/admin/reviews/${reviewId}`, { method: 'DELETE', auth: true }),
  getResidents: () => request('/admin/residents', { auth: true }),

  // tour reservations
  tourReservations: ({
    page = 1,
    size = 10,
    sort = 'tourId',
    direct = 'DESC',
  } = {}) => {
    const q = buildQuery({ page, size, sort, direct });
    return request(`/admin/tour-reservations${q}`, { auth: true });
  },
  changeTourStatus: (tourId, status) =>
    request(`/admin/tour-reservations/status/${tourId}?status=${status}`, {
      method: 'PUT',
      auth: true,
    }),
  getTourReservationById: async (tourId) => {
    const page = await request(
      `/admin/tour-reservations${buildQuery({ page: 1, size: 200, sort: 'tourId', direct: 'DESC' })}`,
      { auth: true }
    );
    const items = page?.content ?? [];
    return items.find((it) => Number(it.tourId) === Number(tourId)) ?? null;
  },

  // space reservations
  spaceReservations: ({
    buildingId,
    spaceId,
    userId,
    date,
    page = 1,
    size = 10,
    sort = 'reservationId',
    direct = 'DESC',
  } = {}) => {
    const q = buildQuery({
      buildingId,
      spaceId,
      userId,
      date,
      page,
      size,
      sort,
      direct,
    });
    return request(`/admin/space-reservations${q}`, { auth: true });
  },
  spaceReservationDetail: (reservationId) =>
    request(`/admin/space-reservations/${reservationId}`, { auth: true }),
  confirmSpaceReservation: (reservationId) =>
    request(`/admin/space-reservations/${reservationId}/confirm`, {
      method: 'PUT',
      auth: true,
    }),
  endSpaceReservation: (reservationId) =>
    request(`/admin/space-reservations/${reservationId}/end`, {
      method: 'PUT',
      auth: true,
    }),
  cancelSpaceReservation: (reservationId, reason) =>
    request(`/admin/space-reservations/${reservationId}/cancel`, {
      method: 'PUT',
      auth: true,
      body: reason ? { cancelReason: reason } : undefined,
    }),

  // contracts
  getContracts: ({
    keyword,
    contractStatus,
    buildingId,
    roomNo,
    startFrom,
    endTo,
    page = 1,
    size = 10,
    sort = 'contractId',
    direct = 'DESC',
  } = {}) => {
    const q = buildQuery({
      keyword,
      contractStatus,
      buildingId,
      roomNo,
      startFrom,
      endTo,
      page,
      size,
      sort,
      direct,
    });
    return request(`/admin/contracts${q}`, { auth: true });
  },
  getContractById: (contractId) => {
    return request(`/admin/contracts/${contractId}`, { auth: true });
  },
  updateContract: (contractId, { contractStatus, moveinAt, pdfFile } = {}) => {
    const fd = new FormData();
    if (contractStatus != null) fd.append('contractStatus', contractStatus);
    if (moveinAt != null) fd.append('moveinAt', moveinAt);
    if (pdfFile != null) fd.append('pdfFile', pdfFile);

    return request(`/admin/contracts/${contractId}`, {
      method: 'PUT',
      body: fd,
      auth: true,
    });
  },

  // monthly charge
  getMonthlyCharges: (contractId) =>
    request(`/admin/monthly-charges${buildQuery({ contractId })}`, {
      auth: true,
    }),
  getMonthlyChargeDetail: (chargeId) =>
    request(`/admin/monthly-charges/${chargeId}`, { auth: true }),

  // payments/refunds
  getPayments: () => request('/admin/payments', { auth: true }),
  getPaymentDetail: (paymentId) =>
    request(`/admin/payments/${paymentId}`, { auth: true }),
  getRefunds: () => request('/admin/refunds', { auth: true }),
  getRefundDetail: async (refundId) => {
    const items = await request('/admin/refunds', { auth: true });
    if (!Array.isArray(items)) return null;
    return (
      items.find((it) => Number(it.refundId ?? it.id) === Number(refundId)) ??
      null
    );
  },

  // orders
  getAllOrders: ({ page = 0, size = 20, sort = 'orderCreatedAt' } = {}) =>
    request(`/admin/orders${buildQuery({ page, size, sort })}`, { auth: true }),
  getOrderDetail: async (orderId) => {
    const data = await request(
      `/admin/orders${buildQuery({ page: 0, size: 200, sort: 'orderCreatedAt' })}`,
      { auth: true }
    );
    const items = data?.content ?? [];
    return items.find((it) => Number(it.orderId) === Number(orderId)) ?? null;
  },

  // products
  // 관리자용 전체 상품 목록 (on_sale + sold_out, 빌딩별 재고 포함) → GET /admin/products
  getAllProductsAdmin: () => request('/admin/products', { auth: true }),
  getProducts: () => request('/products'),
  getProduct: (prodId) => request(`/products/${prodId}`),
  createProduct: (body) =>
    request('/admin/products', { method: 'POST', body, auth: true }),
  updateProduct: (prodId, body) =>
    request(`/admin/products/${prodId}`, {
      method: 'PUT',
      body,
      auth: true,
    }),
  changeProductStatus: (prodId, status) =>
    request(`/admin/products/${prodId}/status`, {
      method: 'PATCH',
      body: status,
      auth: true,
    }),
  deleteProduct: (prodId) =>
    request(`/admin/products/${prodId}`, { method: 'DELETE', auth: true }),

  getProductImages: (prodId) =>
    request(`/admin/products/${prodId}/images`, { auth: true }),
  uploadProductImages: (prodId, files = []) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return requestForm(`/admin/products/${prodId}/images`, {
      method: 'POST',
      formData,
      auth: true,
    });
  },
  replaceProductMainImage: (prodId, file) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    return requestForm(`/admin/products/${prodId}/image`, {
      method: 'PUT',
      formData,
      auth: true,
    });
  },
  deleteProductImages: (prodId, fileIds = []) =>
    request(`/admin/products/${prodId}/images`, {
      method: 'DELETE',
      body: fileIds,
      auth: true,
    }),
  getProductBuildingStocks: (prodId) =>
    request(`/admin/products/${prodId}/building-stocks`, { auth: true }),
  upsertProductBuildingStock: (prodId, buildingId, stock) =>
    request(`/admin/products/${prodId}/building-stocks/${buildingId}`, {
      method: 'PUT',
      body: { stock },
      auth: true,
    }),

  // room service orders
  getAllRoomServiceOrders: ({ page = 0, size = 20, sort = 'createdAt' } = {}) =>
    request(`/admin/room-services${buildQuery({ page, size, sort })}`, {
      auth: true,
    }),
  updateRoomServiceOrderStatus: (orderId, body) =>
    request(`/admin/room-services/${orderId}/status`, {
      method: 'PATCH',
      body,
      auth: true,
    }),
  getRoomServiceOrderById: async (orderId) => {
    const data = await request(
      `/admin/room-services${buildQuery({ page: 0, size: 200, sort: 'createdAt' })}`,
      { auth: true }
    );
    const items = data?.content ?? [];
    return items.find((it) => Number(it.orderId) === Number(orderId)) ?? null;
  },

  // affiliates
  getAffiliates: ({
    page = 0,
    size = 20,
    sort = 'affiliateId',
    direct = 'DESC',
  } = {}) =>
    request(
      `/admin/affiliates${buildQuery({ page, size, sort: pageableSort(sort, direct) })}`,
      {
        auth: true,
      }
    ),
  getAffiliateDetail: (affiliateId) =>
    request(`/admin/affiliates/${affiliateId}`, { auth: true }),
  createAffiliate: (body) =>
    request(`/admin/affiliates`, {
      method: 'POST',
      auth: true,
      body,
    }),
  updateAffiliate: (affiliateId, body) =>
    request(`/admin/affiliates/${affiliateId}`, {
      method: 'PATCH',
      auth: true,
      body,
    }),
  deleteAffiliate: (affiliateId) =>
    request(`/admin/affiliates/${affiliateId}`, {
      method: 'DELETE',
      auth: true,
    }),
  // common-codes
  getActiveCommonCodes: (groupCode) =>
    request(`/admin/common-codes/${groupCode}`, { auth: true }),

  // banners
  getBanners: ({ page = 0, size = 10, sort = 'banId', direct = 'DESC' } = {}) =>
    request(
      `/admin/banners${buildQuery({ page, size, sort: pageableSort(sort, direct) })}`,
      {
        auth: true,
      }
    ),
  getBannerDetail: async (banId) => {
    const data = await request(
      `/admin/banners${buildQuery({ page: 0, size: 200, sort: pageableSort('banId', 'DESC') })}`,
      { auth: true }
    );
    const items = data?.content ?? [];
    return items.find((it) => Number(it.banId) === Number(banId)) ?? null;
  },

  createBanner: (formData) =>
    requestForm(`/admin/banners`, {
      method: 'POST',
      formData,
      auth: true,
    }),

  updateBanner: (banId, formData, deleteFlag = false) =>
    requestForm(`/admin/banners/${banId}?deleteFlag=${deleteFlag}`, {
      method: 'PUT',
      formData,
      auth: true,
    }),

  deleteBanner: (banId) =>
    request(`/admin/banners/${banId}`, {
      method: 'DELETE',
      auth: true,
    }),

  updateBannerStatus: (banId, status) =>
    request(
      `/admin/banners/${banId}/status?status=${encodeURIComponent(status)}`,
      {
        method: 'PATCH',
        auth: true,
      }
    ),
  updateBannerOrder: (orders) =>
    request(`/admin/banners/order`, {
      method: 'PATCH',
      body: orders,
      auth: true,
    }),

  // company info
  getCompanyInfo: () => request('/company-info', { auth: true }),
  updateCompanyInfo: (companyId, body) =>
    request(`/admin/company-info/${companyId}`, {
      method: 'PATCH',
      body,
      auth: true,
    }),

  // property list/detail
  getBuildings: ({
    page = 1,
    size = 10,
    sort = 'buildingId',
    direct = 'DESC',
  } = {}) => request(`/buildings${buildQuery({ page, size, sort, direct })}`),
  getBuildingDetail: (buildingId) =>
    request(`/admin/buildings/${buildingId}`, { auth: true }),
  createBuilding: (formData) =>
    requestForm('/admin/buildings', { method: 'POST', formData, auth: true }),
  updateBuilding: (buildingId, formData) =>
    requestForm(`/admin/buildings/${buildingId}`, {
      method: 'PUT',
      formData,
      auth: true,
    }),
  deleteBuilding: (buildingId) =>
    request(`/admin/buildings/${buildingId}`, { method: 'DELETE', auth: true }),

  getRooms: ({
    page = 1,
    size = 10,
    sort = 'roomId',
    direct = 'DESC',
    ...filters
  } = {}) =>
    request(`/rooms${buildQuery({ page, size, sort, direct, ...filters })}`),
  getRoomDetail: (roomId) => request(`/admin/rooms/${roomId}`, { auth: true }),
  createRoom: (formData) =>
    requestForm('/admin/rooms', { method: 'POST', formData, auth: true }),
  updateRoom: (roomId, formData) =>
    requestForm(`/admin/rooms/${roomId}`, {
      method: 'PUT',
      formData,
      auth: true,
    }),
  deleteRoom: (roomId) =>
    request(`/admin/rooms/${roomId}`, { method: 'DELETE', auth: true }),

  getSpaces: ({
    page = 1,
    size = 10,
    sort = 'spaceId',
    direct = 'DESC',
    ...filters
  } = {}) =>
    request(`/spaces${buildQuery({ page, size, sort, direct, ...filters })}`),
  getSpaceDetail: (spaceId) =>
    request(`/admin/spaces/${spaceId}`, { auth: true }),
  createSpace: (formData) =>
    requestForm('/admin/spaces', { method: 'POST', formData, auth: true }),
  updateSpace: (spaceId, formData) =>
    requestForm(`/admin/spaces/${spaceId}`, {
      method: 'PUT',
      formData,
      auth: true,
    }),
  deleteSpace: (spaceId) =>
    request(`/admin/spaces/${spaceId}`, { method: 'DELETE', auth: true }),

  // support detail
  getComplainDetail: (compId) =>
    request(`/complains/${compId}`, { auth: true }),
  getFaqDetail: (faqId) => request(`/faqs/${faqId}`, { auth: true }),
  getNoticeDetail: (noticeId) =>
    request(`/notices/${noticeId}`, { auth: true }),
};
