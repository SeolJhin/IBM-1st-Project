const ACCESS = "access_token";
const REFRESH = "refresh_token";
const DEVICE = "device_id";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS),
  setAccess: (v) => localStorage.setItem(ACCESS, v),
  getRefresh: () => localStorage.getItem(REFRESH),
  setRefresh: (v) => localStorage.setItem(REFRESH, v),

  getDeviceId: () => localStorage.getItem(DEVICE),
  setDeviceId: (v) => localStorage.setItem(DEVICE, v),

  clear: () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(DEVICE);
  },
};

export function getOrCreateDeviceId() {
  let id = tokenStore.getDeviceId();
  if (id) return id;

  // 간단한 uuid 대체(브라우저 내장)
  id = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
  tokenStore.setDeviceId(id);
  return id;
}
