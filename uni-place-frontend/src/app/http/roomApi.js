import { api } from "./axiosInstance";

export const roomApi = {
  getList: (params = {}) =>
    api.get("/rooms", {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 10,
        sort: params.sort ?? "roomId",
        direct: params.direct ?? "DESC",
        buildingId: params.buildingId,
        buildingNm: params.buildingNm,
        roomNo: params.roomNo,
        floor: params.floor,
        roomSt: params.roomSt,
        rentType: params.rentType,
      },
    }),

  getDetail: (roomId) => api.get(`/rooms/${roomId}`),
};
