import type Resp from "@/models/Resp";
import { createAppRequest } from "./request";
import type { PaginatedResult } from "@cine-stream/common";

const appRequest = createAppRequest("/admin/user-manage");

export const queryUserPage = (params: {
  page: number;
  size: number;
}): Promise<Resp<PaginatedResult<Record<string, any>>>> =>
  appRequest.get("/", { params });

export const createUser = (data: {
  phone: string;
  password: string;
  roleIds?: string[];
}): Promise<Resp<Record<string, any>>> => appRequest.post("/", data);

export const getUserDetail = (id: string): Promise<Resp<Record<string, any>>> =>
  appRequest.get(`/${id}`);

export const toggleUserStatus = (id: string): Promise<Resp<void>> =>
  appRequest.put(`/${id}/status`);

export const updatePhone = (id: string, phone: string): Promise<Resp<void>> =>
  appRequest.put(`/${id}/phone`, { phone });

export const updateEmail = (id: string, email: string): Promise<Resp<void>> =>
  appRequest.put(`/${id}/email`, { email });

export const updateRoles = (id: string, roleIds: number[]): Promise<Resp<void>> =>
  appRequest.put(`/${id}/roles`, { roleIds });

export const resetPassword = (id: string): Promise<Resp<void>> =>
  appRequest.put(`/${id}/reset-password`);

export const deleteUser = (id: string): Promise<Resp<void>> =>
  appRequest.delete(`/${id}`);

export const restoreUser = (id: string): Promise<Resp<void>> =>
  appRequest.put(`/${id}/restore`);
