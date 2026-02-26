import { api } from "./axiosInstance";

export const tourReservationApi = {
  getReservableRooms: ({
    buildingId,
    buildingNm,
    page = 1,
    size = 10,
    sort = "roomId",
    direct = "DESC",
  } = {}) =>
    api.get("/tour-reservations/rooms", {
      params: { buildingId, buildingNm, page, size, sort, direct },
    }),

  getReservableSlots: ({ buildingId, roomId, date }) =>
    api.get("/tour-reservations/slots", { params: { buildingId, roomId, date } }),

  create: (payload) => api.post("/tour-reservations", payload),

  lookup: (
    payload,
    { page = 1, size = 10, sort = "tourId", direct = "DESC" } = {},
  ) =>
    api.post("/tour-reservations/lookup", payload, {
      params: { page, size, sort, direct },
    }),

  cancel: (tourId, payload) => api.put(`/tour-reservations/cancel/${tourId}`, payload),
};
