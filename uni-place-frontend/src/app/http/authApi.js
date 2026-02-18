import { api } from "./axiosInstance";

function unwrap(res) {
  // ApiResponse { success, data, message, errorCode } 형태 대응
  const body = res?.data;
  if (body && typeof body === "object" && "data" in body) {
    if (body.success === false) {
      const msg = body.message || "요청에 실패했습니다.";
      const err = new Error(msg);
      err.errorCode = body.errorCode;
      throw err;
    }
    return body.data;
  }
  return body;
}

export const authApi = {
  login: async ({ userEmail, userPwd, deviceId }) => {
    const res = await api.post("/auth/login", { userEmail, userPwd, deviceId });
    return unwrap(res);
  },

  me: async () => {
    const res = await api.get("/users/me");
    return unwrap(res);
  },

  refresh: async ({ refreshToken, deviceId }) => {
    const res = await api.post("/auth/refresh", { refreshToken, deviceId });
    return unwrap(res);
  },
};
