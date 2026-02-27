// src/app/http/request.js
import axios from 'axios';

/**
 * ✅ CRA proxy 사용 시 baseURL은 "" 유지
 * package.json에 "proxy": "http://localhost:8080"
 */
const instance = axios.create({
  baseURL: '',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // 토큰 키 다르면 여기만 수정
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 백엔드 공통 응답 ApiResponse<T> 언랩
 * { success, data, errorCode, message }
 */
export function unwrapApi(resData) {
  if (!resData) return resData;
  // axios가 이미 data만 반환할 때도 있으니 방어
  if (typeof resData === 'object' && 'success' in resData) {
    if (resData.success) return resData.data;
    throw new Error(resData.message || 'API error');
  }
  return resData;
}

/** 공통 GET/POST/PUT */
export const http = {
  async get(url, config) {
    const { data } = await instance.get(url, config);
    return unwrapApi(data);
  },
  async post(url, body, config) {
    const { data } = await instance.post(url, body, config);
    return unwrapApi(data);
  },
  async put(url, body, config) {
    const { data } = await instance.put(url, body, config);
    return unwrapApi(data);
  },
};
