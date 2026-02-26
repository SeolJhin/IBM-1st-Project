import { api } from "./axiosInstance";

export const noticeApi = {
  getList: (params = {}) =>
    api.get("/notices", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort ?? "noticeId,desc",
        keyword: params.keyword,
      },
    }),

  getDetail: (noticeId) => api.get(`/notices/${noticeId}`),
};
