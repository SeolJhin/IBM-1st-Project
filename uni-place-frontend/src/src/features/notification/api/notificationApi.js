import { api } from '../../../app/http/axiosInstance';

/** 백엔드 ApiResponse<T> { success, data, ... } 언랩 */
const unwrap = (res) => {
  const d = res.data;
  if (d && typeof d === 'object' && 'success' in d) {
    if (d.success) return d.data;
    throw new Error(d.message || 'API error');
  }
  return d;
};

export const notificationApi = {
  /**
   * GET /notifications
   * → { notifications: { content, page, size, totalElements, totalPages }, unreadCount }
   */
  getList: (params = {}) =>
    api
      .get('/notifications', {
        params: { page: params.page ?? 0, size: params.size ?? 20 },
      })
      .then(unwrap),

  /**
   * GET /notifications/unread
   * → { notifications: PageResponse, unreadCount }
   */
  getUnread: (params = {}) =>
    api
      .get('/notifications/unread', {
        params: { page: params.page ?? 0, size: params.size ?? 20 },
      })
      .then(unwrap),

  /**
   * PATCH /notifications/read  body: { notificationId }
   */
  markRead: (notificationId) =>
    api.patch('/notifications/read', { notificationId }).then(unwrap),

  /**
   * PATCH /notifications/read-all
   * → number (읽음 처리된 건수)
   */
  markAllRead: () => api.patch('/notifications/read-all').then(unwrap),
};
