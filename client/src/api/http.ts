import { useAuthStore } from "@/stores/auth";
import Resp from "@/models/Resp";
import axios, { AxiosError, type AxiosResponse } from "axios";

const appBaseUrl = import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:8793/api";

export interface ApiResponse<T = any> {
  code: number | string;
  message: string;
  data: T | null;
}

export interface ApiError {
  code: number | string;
  message: string;
  data?: any;
  status?: number;
  statusText?: string;
  config?: any;
}

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const joinBaseUrl = (baseUrl: string, subpath: string) => {
  const base = baseUrl.replace(/\/+$/g, "");
  const path = trimSlashes(subpath);
  return path ? `${base}/${path}` : base;
};

const createBaseRequest = (baseUrl?: string) => {
  return axios.create({
    baseURL: baseUrl,
    timeout: 5000,
    withCredentials: false,
    validateStatus: (status) => status >= 200 && status < 600,
  });
};

export const createAppRequest = (subpath = ""): any => {
  const instance = createBaseRequest(joinBaseUrl(appBaseUrl, subpath));

  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    config.headers["Timestamp"] = Date.now();
    config.headers["X-Nonce"] = Math.random().toString(36).substring(2, 15);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>): any => {
      const { code, message, data } = response.data;

      if (response.status >= 200 && response.status < 300) {
        return new Resp(code, message, data);
      }

      return handleError(
        new AxiosError(
          response.data?.message || response.statusText || "请求失败",
          String(response.data?.code || response.status),
          response.config,
          null,
          response,
        ),
      );
    },
    async (error: AxiosError) => handleError(error),
  );

  return instance;
};

const handleError = (error: AxiosError) => {
  if (error.code === "ECONNABORTED") {
    return Promise.reject({
      code: 408,
      message: "请求超时，请稍后重试",
      status: 408,
      statusText: "Request Timeout",
    } satisfies ApiError);
  }

  if (!error.response) {
    return Promise.reject({
      code: 0,
      message: "网络错误，请检查网络连接",
      status: 0,
      statusText: "Network Error",
    } satisfies ApiError);
  }

  const response = error.response;
  return Promise.reject({
    code: (response.data as ApiResponse)?.code || response.status,
    message: (response.data as ApiResponse)?.message || response.statusText || "请求失败",
    data: (response.data as ApiResponse)?.data || response.data,
    status: response.status,
    statusText: response.statusText,
    config: error.config,
  } satisfies ApiError);
};

export const request = createBaseRequest();
export const appRequest = createAppRequest();
