// src/features/notification/api/notificationApi.js
// ✅ 변경사항: deleteRead() 추가 — DELETE /notifications/read

import { api } from '../../../app/http/axiosInstance';

const unwrap = (res) => {
  const d = res.data;
  if (d && typeof d === 'object' && 'success' in d) {
    if (d.success) return d.data;
    throw new Error(d.message || 'API요청에 실패했습니다.');
  }
  return d;
};

export const notificationApi = {
  /** GET /notifications */
  getList: (params = {}) =>
    api
      .get('/notifications', {
        params: { page: params.page ?? 0, size: params.size ?? 20 },
      })
      .then(unwrap),

  /** GET /notifications/unread */
  getUnread: (params = {}) =>
    api
      .get('/notifications/unread', {
        params: { page: params.page ?? 0, size: params.size ?? 20 },
      })
      .then(unwrap),

  /** PATCH /notifications/read  { notificationId } */
  markRead: (notificationId) =>
    api.patch('/notifications/read', { notificationId }).then(unwrap),

  /** PATCH /notifications/read-all */
  markAllRead: () => api.patch('/notifications/read-all').then(unwrap),

  /**
   * ✅ DELETE /notifications/read
   * 읽은 알림 전체 삭제 → 삭제된 건수(Integer) 반환
   */
  deleteRead: () => api.delete('/notifications/read').then(unwrap),
};
