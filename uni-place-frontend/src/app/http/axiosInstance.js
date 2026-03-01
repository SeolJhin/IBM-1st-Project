import axios from "axios";
import { tokenStore } from "./tokenStore";
import { refreshAccessTokenOnce, withApiPrefix } from "./apiBase";

export const api = axios.create({
  baseURL: "", // CRA proxy 사용
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (config.url) {
    config.url = withApiPrefix(config.url);
  }
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    const status = Number(error?.response?.status || 0);
    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const rawUrl = String(original.url || '');
    if (rawUrl.includes('/auth/login') || rawUrl.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshed = await refreshAccessTokenOnce();
    if (!refreshed) {
      return Promise.reject(error);
    }

    const nextToken = tokenStore.getAccess();
    original.headers = original.headers ?? {};
    if (nextToken) {
      original.headers.Authorization = `Bearer ${nextToken}`;
    }
    return api(original);
  }
);
