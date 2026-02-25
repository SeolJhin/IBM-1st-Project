import { axiosInstance } from "./axiosInstance";

export const eventApi = {
  // GET /api/events
  getEvents: (params) => axiosInstance.get("/api/events", { params }),

  // GET /api/events/{eventId}
  getEventDetail: (eventId) => axiosInstance.get(`/api/events/${eventId}`),
};
