// user/hooks/useAuth.js
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  device: 'device_id',
};

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(STORAGE_KEYS.device);
  if (deviceId) return deviceId;

  // 브라우저 지원 시 UUID 사용
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    deviceId = crypto.randomUUID();
  } else {
    // fallback: 간단한 랜덤
    deviceId = `dev_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  }
  localStorage.setItem(STORAGE_KEYS.device, deviceId);
  return deviceId;
}

function setTokens({ accessToken, refreshToken, deviceId }) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.access, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
  if (deviceId) localStorage.setItem(STORAGE_KEYS.device, deviceId);
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.access);
  localStorage.removeItem(STORAGE_KEYS.refresh);
  // deviceId는 유지(기기 식별자) - 필요 시 같이 지우고 싶으면 아래 주석 해제
  // localStorage.removeItem(STORAGE_KEYS.device);
}

function getRefreshContext() {
  return {
    refreshToken: localStorage.getItem(STORAGE_KEYS.refresh) || '',
    deviceId: localStorage.getItem(STORAGE_KEYS.device) || '',
  };
}

function isIgnorableLogoutError(error) {
  const message = String(error?.message ?? '').toLowerCase();
  const errorCode = String(error?.errorCode ?? '').toLowerCase();
  const status = Number(error?.status ?? 0);

  return (
    message.includes('token') ||
    message.includes('토큰') ||
    message.includes('unauthorized') ||
    status === 401 ||
    errorCode.includes('token')
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      // accessToken이 없으면 굳이 me 호출하지 않음
      const access = localStorage.getItem(STORAGE_KEYS.access);
      if (!access) {
        setUser(null);
        return;
      }
      const me = await authApi.me();
      setUser(me ?? null);
    } catch (e) {
      // access 만료/불일치면 refresh 시도
      try {
        const { refreshToken, deviceId } = getRefreshContext();
        if (refreshToken && deviceId) {
          const tokens = await authApi.refresh({ refreshToken, deviceId });
          setTokens(tokens);
          const me = await authApi.me();
          setUser(me ?? null);
          return;
        }
      } catch {
        // ignore
      }
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async ({ email, password }) => {
    const deviceId = getOrCreateDeviceId();
    const tokens = await authApi.login({
      userEmail: email,
      userPwd: password,
      deviceId,
    });
    setTokens(tokens);

    // UniPlace login은 토큰만 내려주므로 me로 유저 조회
    const me = await authApi.me();
    setUser(me ?? null);

    return { tokens, user: me };
  }, []);

  const logout = useCallback(async () => {
    try {
      const { refreshToken, deviceId } = getRefreshContext();
      if (refreshToken && deviceId) {
        try {
          await authApi.logout({ refreshToken, deviceId });
        } catch (e) {
          if (!isIgnorableLogoutError(e)) {
            console.warn('logout request failed:', e);
          }
        }
      }
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh: bootstrap }),
    [user, loading, login, logout, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error('useAuth는 <AuthProvider> 내부에서만 사용할 수 있어요.');
  return ctx;
}
