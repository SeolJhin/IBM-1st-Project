import { axiosInstance } from "./axiosInstance";
import { buildFormData } from "../../shared/utils/buildFormData";

export const apiJson = {
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),
};

export const apiForm = {
  post: (url, obj, config) => axiosInstance.post(url, buildFormData(obj), config),
  put: (url, obj, config) => axiosInstance.put(url, buildFormData(obj), config),
};

export const apiUrlEncoded = {
  post: (url, params, config) =>
    axiosInstance.post(url, new URLSearchParams(params), {
      ...config,
      headers: { ...(config?.headers || {}), "Content-Type": "application/x-www-form-urlencoded" },
    }),
};
