import type Resp from "@/models/Resp";
import type {
  RecordWatchHistoryInput,
  WatchCollectionItem,
  WatchHistoryItem,
  WatchOverview,
} from "@/types";
import { createAppRequest } from "./http";

const appRequest = createAppRequest("/watch");

export const fetchWatchHistory = (): Promise<Resp<WatchHistoryItem[]>> =>
  appRequest.get("/history");

export const recordWatchHistory = (
  data: RecordWatchHistoryInput,
): Promise<Resp<WatchHistoryItem>> => appRequest.post("/history", data);

export const fetchCollections = (): Promise<Resp<WatchCollectionItem[]>> =>
  appRequest.get("/collections");

export const addCollection = (
  cineId: string,
): Promise<Resp<WatchCollectionItem>> =>
  appRequest.post(`/collections/${cineId}`);

export const removeCollection = (cineId: string): Promise<Resp<void>> =>
  appRequest.delete(`/collections/${cineId}`);

export const fetchOverview = (): Promise<Resp<WatchOverview>> =>
  appRequest.get("/overview");
