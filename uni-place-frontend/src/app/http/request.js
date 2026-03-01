// src/app/http/request.js
import axios from 'axios';
import { refreshAccessTokenOnce, withApiPrefix } from './apiBase';

const instance = axios.create({
  baseURL: '',
});

instance.interceptors.request.use((config) => {
  if (config.url) {
    config.url = withApiPrefix(config.url);
  }

  const token =
    localStorage.getItem('access_token') || localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
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

    const token =
      localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    original.headers = original.headers ?? {};
    if (token) {
      original.headers.Authorization = `Bearer ${token}`;
    }

    return instance(original);
  }
);

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

function toFormBody(body = {}) {
  const params = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });
  return params;
}

// Legacy wrappers for pages that still import apiJson/apiUrlEncoded.
export const apiJson = {
  get(url, config) {
    return instance.get(url, config);
  },
  post(url, body, config) {
    return instance.post(url, body, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers ?? {}),
      },
    });
  },
  put(url, body, config) {
    return instance.put(url, body, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers ?? {}),
      },
    });
  },
  patch(url, body, config) {
    return instance.patch(url, body, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers ?? {}),
      },
    });
  },
  delete(url, config) {
    return instance.delete(url, config);
  },
};

export const apiUrlEncoded = {
  get(url, params = {}, config = {}) {
    return instance.get(url, { ...config, params });
  },
  post(url, body, config) {
    return instance.post(url, toFormBody(body), {
      ...config,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(config?.headers ?? {}),
      },
    });
  },
  put(url, body, config) {
    return instance.put(url, toFormBody(body), {
      ...config,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(config?.headers ?? {}),
      },
    });
  },
  patch(url, body, config) {
    return instance.patch(url, toFormBody(body), {
      ...config,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(config?.headers ?? {}),
      },
    });
  },
  delete(url, config) {
    return instance.delete(url, config);
  },
};
