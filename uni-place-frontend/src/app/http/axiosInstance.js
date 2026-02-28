import axios from "axios";
import { tokenStore } from "./tokenStore";
import { withApiPrefix } from "./apiBase";

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
