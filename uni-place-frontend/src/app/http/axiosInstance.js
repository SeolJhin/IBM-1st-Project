import axios from "axios";
import { tokenStore } from "./tokenStore";

export const api = axios.create({
  baseURL: "", // CRA proxy 사용
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
