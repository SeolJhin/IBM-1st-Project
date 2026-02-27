// src/app/http/request.js
import axios from 'axios';
import { withApiPrefix } from './apiBase';

const instance = axios.create({
  baseURL: '',
});

instance.interceptors.request.use((config) => {
  if (config.url) {
    config.url = withApiPrefix(config.url);
  }

  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function unwrapApi(resData) {
  if (!resData) return resData;
  if (typeof resData === 'object' && 'success' in resData) {
    if (resData.success) return resData.data;
    throw new Error(resData.message || 'API error');
  }
  return resData;
}

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

