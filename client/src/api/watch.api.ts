import type Resp from "@/models/Resp";
import type {
  PaginatedResult,
  RecordWatchHistoryInput,
  WatchCollectionItem,
  WatchHistoryItem,
  WatchOverview,
} from "@/types";
import { createAppRequest } from "./http";

const appRequest = createAppRequest("/watch");

export interface QueryWatchHistoryParams {
  page?: number;
  size?: number;
}

export interface QueryCollectionsParams {
  page?: number;
  size?: number;
  genre?: string;
  status?: "downloaded" | "watching";
}

export const fetchWatchHistory = (
  params?: QueryWatchHistoryParams,
): Promise<Resp<PaginatedResult<WatchHistoryItem>>> =>
  appRequest.get("/history", { params });

export const fetchCineWatchHistory = (
  cineId: string,
): Promise<Resp<WatchHistoryItem[]>> =>
  appRequest.get(`/cines/${cineId}/history`);

export const recordWatchHistory = (
  data: RecordWatchHistoryInput,
): Promise<Resp<WatchHistoryItem>> => appRequest.post("/history", data);

export const removeWatchHistory = (historyId: string): Promise<Resp<void>> =>
  appRequest.delete(`/history/${historyId}`);

export const fetchCollections = (
  params?: QueryCollectionsParams,
): Promise<Resp<PaginatedResult<WatchCollectionItem>>> =>
  appRequest.get("/collections", { params });

export const addCollection = (
  cineId: string,
): Promise<Resp<WatchCollectionItem>> =>
  appRequest.post(`/collections/${cineId}`);

export const removeCollection = (cineId: string): Promise<Resp<void>> =>
  appRequest.delete(`/collections/${cineId}`);

export const fetchOverview = (): Promise<Resp<WatchOverview>> =>
  appRequest.get("/overview");
