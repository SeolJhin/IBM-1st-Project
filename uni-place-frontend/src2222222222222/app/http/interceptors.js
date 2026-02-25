import { tokenStore } from "./tokenStore";

export function attachInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    const access = tokenStore.getAccess();
    if (access) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        // token expired / invalid - drop tokens
        tokenStore.clear();
      }
      return Promise.reject(err);
    }
  );
}
