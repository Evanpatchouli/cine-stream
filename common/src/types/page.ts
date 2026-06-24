export interface BaseQueryPageParams {
  page: number;
  size: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
