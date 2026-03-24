import axios from "axios";
import { tokenStore } from "./tokenStore";
import { refreshAccessTokenOnce, withApiPrefix } from "./apiBase";

const GUEST_ACCESS_TOKEN_KEY = "guest_access_token";
const GUEST_ACCESS_EXP_KEY = "guest_access_exp_ms";
const GUEST_RENEW_MARGIN_MS = 3 * 60 * 1000;
let guestTokenPromise = null;

function isAiRequest(url) {
  return String(url || "").includes("/ai/");
}

function decodeJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded));
  } catch (e) {
    return null;
  }
}

function getCachedGuestToken() {
  const token = sessionStorage.getItem(GUEST_ACCESS_TOKEN_KEY) || "";
  const expMs = Number(sessionStorage.getItem(GUEST_ACCESS_EXP_KEY) || 0);
  if (!token || !expMs) return "";
  if (Date.now() >= expMs - GUEST_RENEW_MARGIN_MS) return "";
  return token;
}

function cacheGuestToken(token) {
  if (!token) return;
  const payload = decodeJwtPayload(token);
  const expMs = Number(payload?.exp || 0) * 1000;
  if (!expMs) return;
  sessionStorage.setItem(GUEST_ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(GUEST_ACCESS_EXP_KEY, String(expMs));
}

function clearGuestTokenCache() {
  sessionStorage.removeItem(GUEST_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(GUEST_ACCESS_EXP_KEY);
}

async function fetchGuestToken() {
  const current = sessionStorage.getItem(GUEST_ACCESS_TOKEN_KEY) || "";
  const headers = { "Content-Type": "application/json" };
  if (current) {
    headers.Authorization = `Bearer ${current}`;
  }

  const res = await fetch(withApiPrefix("/auth/guest-token"), {
    method: "POST",
    credentials: "same-origin",
    headers,
  });
  if (!res.ok) {
    throw new Error("guest token request failed");
  }

  const payload = await res.json().catch(() => null);
  const data = payload?.data ?? payload;
  const token = data?.accessToken || "";
  if (!token) {
    throw new Error("guest token response invalid");
  }

  cacheGuestToken(token);
  return token;
}

async function ensureGuestAccessToken() {
  const cached = getCachedGuestToken();
  if (cached) return cached;

  if (!guestTokenPromise) {
    guestTokenPromise = (async () => {
      try {
        return await fetchGuestToken();
      } finally {
        guestTokenPromise = null;
      }
    })();
  }
  return guestTokenPromise;
}

export const api = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  if (config.url) {
    config.url = withApiPrefix(config.url);
  }

  let token = tokenStore.getAccess();
  if (!token && isAiRequest(config.url)) {
    token = await ensureGuestAccessToken();
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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

    const rawUrl = String(original.url || "");
    if (
      rawUrl.includes("/auth/login") ||
      rawUrl.includes("/auth/refresh") ||
      rawUrl.includes("/auth/guest-token")
    ) {
      return Promise.reject(error);
    }

    if (isAiRequest(rawUrl) && !tokenStore.getRefresh()) {
      original._retry = true;
      clearGuestTokenCache();
      const guestToken = await ensureGuestAccessToken();
      original.headers = original.headers ?? {};
      if (guestToken) {
        original.headers.Authorization = `Bearer ${guestToken}`;
      }
      return api(original);
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
