import { type BaseQueryPageParams, type PaginatedResult } from '@cine-stream/common';
import type Resp from "@/models/Resp";
import { createAppRequest } from "./request";

const appRequest = createAppRequest("/admin/role");

interface Role {
  id: number;
  role_name: string;
  role_code: string;
  description: string;
  permissions: Permission[];
}

interface Permission {
  id: number;
  perm_name: string;
  perm_code: string;
  description: string;
}

export const queryAllRoles = (params: {
  withPermission?: boolean;
  simplify?: boolean;
}): Promise<Resp<Array<Role>>> => appRequest.get("/all", { params });

export const queryRolePage = (params: BaseQueryPageParams): Promise<Resp<PaginatedResult<Role>>> => appRequest.get("/", { params });
