import type { ApiResp, Cine, LoginUser } from "@/types";

const API_BASE = (
  import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:8793/api"
).replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = (await response.json()) as ApiResp<T>;
  if (!response.ok || body.code !== "SUCCESS") {
    throw new Error(body.message || "请求失败");
  }
  return body.data as T;
}

export async function loginByPhonePassword(phone: string, password: string) {
  return request<LoginUser>("/user/login/password", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export async function fetchCines(token: string) {
  return request<Cine[]>("/cines", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
