import { useLoginStore } from "@/auth/store";
import Resp from "@/models/Resp";
import type { IResp } from "@/types/resp";
import { message } from "antd";
import axios, { AxiosError, type AxiosResponse } from "axios";
import { joinURL, withLeadingSlash, withoutTrailingSlash } from "ufo";

const appBaseUrl = import.meta.env.VITE_APP_API_BASE_URL;

// 定义通用的响应接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
  success?: boolean;
}

// 定义错误响应接口
export interface ApiError {
  code: number | string;
  message: string;
  data?: any;
  timestamp?: number;
  success?: boolean;
  status?: number;
  statusText?: string;
  config?: any;
}

const createBaseRequest = (baseUrl?: string) => {
  const instance = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
    withCredentials: true,
    validateStatus: (status) => {
      // 允许所有状态码，这样就不会自动抛出错误
      return status >= 200 && status < 600;
    },
  });

  return instance;
};

export const createAppRequest = (subpath: string = "") => {
  const baseUrl = withoutTrailingSlash(
    withLeadingSlash(joinURL(appBaseUrl, subpath)),
  );
  const instance = createBaseRequest(baseUrl);

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      const token = useLoginStore.getState().token;
      config.headers["Timestamp"] = Date.now();
      config.headers["X-Nonce"] = Math.random().toString(36).substring(2, 15);
      config.headers["Authorization"] = "Bearer " + (token ?? "");
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 响应拦截器 - 修改这里！
  instance.interceptors.response.use(
    // @ts-ignore
    (response: AxiosResponse<ApiResponse>) => {
      const { code, message, data } = response.data as IResp;

      // 如果是 2xx 状态码，直接返回数据
      if (response.status >= 200 && response.status < 300) {
        return new Resp(code, message, data);
      }

      // 对于非2xx的状态码，构造错误对象，但包含响应体
      const error: ApiError = {
        code: code || response.status,
        message: response.data?.message || response.statusText || "请求失败",
        data: response.data?.data || response.data,
        timestamp: response.data?.timestamp,
        success: response.data?.success || false,
        status: response.status,
        statusText: response.statusText,
        config: response.config,
      };

      // message.error(error.message);

      // 返回一个拒绝的Promise，但带有完整的错误信息
      return handleError(
        new AxiosError(
          error.message,
          String(error.code),
          error.config,
          null,
          response,
        ),
      );
    },
    async (error: AxiosError) => {
      return handleError(error);
    },
  );

  return instance;
};

const handleError = (error: AxiosError) => {
  // 网络错误或请求超时
  if (error.code === "ECONNABORTED") {
    message.error("请求超时，请稍后重试");
    const timeoutError: ApiError = {
      code: 408,
      message: "请求超时，请稍后重试",
      status: 408,
      statusText: "Request Timeout",
    };
    return Promise.reject(timeoutError);
  }

  if (!error.response) {
    // 网络错误，没有响应
    const networkError: ApiError = {
      code: 0,
      message: "网络错误，请检查网络连接",
      status: 0,
      statusText: "Network Error",
    };
    message.error("网络错误，请检查网络连接");
    return Promise.reject(networkError);
  }

  // 有响应，但是错误状态码
  const response = error.response;
  const apiError: ApiError = {
    code: (response.data as any)?.code || response.status,
    message:
      (response.data as any)?.message || response.statusText || "请求失败",
    data: (response.data as any)?.data || response.data,
    timestamp: (response.data as any)?.timestamp,
    success: (response.data as any)?.success || false,
    status: response.status,
    statusText: response.statusText,
    config: error.config,
  };

  // 根据状态码显示不同提示
  if (response.status === 401) {
    message.error("登录已过期，请重新登录");
    // 这里可以添加刷新token的逻辑
  } else if (response.status === 403) {
    message.error("没有权限访问此资源");
  } else if (response.status === 404) {
    message.error("请求的资源不存在");
  } else if (response.status >= 500) {
    message.error("服务器内部错误，请稍后重试");
  } else {
    // 显示服务器返回的错误信息
    const errorMsg = apiError.message || "请求失败";
    message.error(errorMsg);
  }

  return Promise.reject(apiError);
};

export const request = createBaseRequest();
export const appRequest = createAppRequest();
