import type { Nullable } from "@cine-stream/common";

export interface IResp<T = unknown> {
  code: number | string;
  message: string;
  data: Nullable<T>;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
