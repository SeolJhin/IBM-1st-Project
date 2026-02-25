import { api } from "./axiosInstance";

export const buildingApi = {
  getList: ({ page = 1, size = 10, sort = "buildingId", direct = "DESC" } = {}) =>
    api.get("/buildings", { params: { page, size, sort, direct } }),

  getDetail: (buildingId) => api.get(`/buildings/${buildingId}`),

  getRooms: (
    buildingId,
    { page = 1, size = 10, sort = "roomId", direct = "DESC" } = {},
  ) => api.get(`/buildings/${buildingId}/rooms`, { params: { page, size, sort, direct } }),

  getSpaces: (
    buildingId,
    { page = 1, size = 10, sort = "spaceId", direct = "DESC" } = {},
  ) => api.get(`/buildings/${buildingId}/spaces`, {
    params: { page, size, sort, direct },
  }),
};
