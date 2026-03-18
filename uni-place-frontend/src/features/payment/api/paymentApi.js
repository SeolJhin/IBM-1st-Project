import { api } from '../../../app/http/axiosInstance';

export const paymentApi = {
  /** 내 결제 내역 목록 */
  getMyPayments: ({ targetType, year, month, page = 1, size = 10 } = {}) =>
    api.get('/payments/my', {
      params: {
        ...(targetType ? { targetType } : {}),
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        page,
        size,
      },
    }),

  /** 결제 상세 */
  getMyPaymentDetail: (paymentId) => api.get(`/payments/my/${paymentId}`),
};
