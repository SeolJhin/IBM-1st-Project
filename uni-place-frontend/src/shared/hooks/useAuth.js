import React, { createContext, useContext, useMemo, useState } from "react";
import { authApi } from "../app/http/authApi";
import { tokenStore, getOrCreateDeviceId } from "../app/http/tokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();

      // 1) 로그인 → 토큰 발급
      const data = await authApi.login({
        userEmail: email,
        userPwd: password,
        deviceId,
      });

      // data 안에 토큰 키 이름이 뭔지에 따라 아래 2줄은 맞춰야 함
      // (보통 accessToken / refreshToken)
      if (data?.accessToken) tokenStore.setAccess(data.accessToken);
      if (data?.refreshToken) tokenStore.setRefresh(data.refreshToken);

      // 2) 로그인 검증: /users/me 호출이 성공하면 OK
      const me = await authApi.me();
      setUser(me);

      return me;
    } catch (e) {
      // 에러 메시지 통일
      throw new Error(e?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, setUser, loading, login }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서 사용해야 합니다.");
  return ctx;
}
