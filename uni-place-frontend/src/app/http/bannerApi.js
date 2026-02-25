import { api } from "./axiosInstance";

export const bannerApi = {
  getActive: () => api.get("/banners/active"),
  getDetail: (banId) => api.get(`/banners/${banId}`),
};
