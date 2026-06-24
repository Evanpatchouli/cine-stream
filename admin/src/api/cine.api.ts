import type Resp from "@/models/Resp";
import type { PaginatedResult } from "@cine-stream/common";
import { createAppRequest } from "./request";

const appRequest = createAppRequest("/admin/cines");

export interface EpisodeInput {
  name: string;
  description?: string;
  file_path: string;
  file_url?: string;
}

export interface CineRecord {
  id: string;
  name: string;
  description?: string;
  episode_ids?: string[];
  episodes?: Array<EpisodeInput & { id?: string }>;
  created_at?: number;
  updated_at?: number;
}

export interface MediaFileItem {
  name: string;
  type: "directory" | "file";
  relative_path: string;
  absolute_path: string;
  file_url?: string;
}

export interface MediaRootSetting {
  root: string;
  configured_root: string;
}

export const queryCinePage = (params: {
  page: number;
  size: number;
  keyword?: string;
}): Promise<Resp<PaginatedResult<CineRecord>>> => appRequest.get("/", { params });

export const createCine = (data: {
  name: string;
  description?: string;
}): Promise<Resp<CineRecord>> => appRequest.post("/", data);

export const updateCine = (
  id: string,
  data: { name?: string; description?: string },
): Promise<Resp<CineRecord>> => appRequest.put(`/${id}`, data);

export const deleteCine = (id: string): Promise<Resp<void>> =>
  appRequest.delete(`/${id}`);

export const replaceEpisodes = (
  id: string,
  episodes: EpisodeInput[],
): Promise<Resp<CineRecord>> => appRequest.put(`/${id}/episodes`, { episodes });

export const listMediaFiles = (dir?: string): Promise<
  Resp<{
    root: string;
    configured_root: string;
    current: string;
    items: MediaFileItem[];
  }>
> => appRequest.get("/media/files", { params: { dir } });

export const getMediaRoot = (): Promise<Resp<MediaRootSetting>> =>
  appRequest.get("/media/root");

export const updateMediaRoot = (root: string): Promise<Resp<MediaRootSetting>> =>
  appRequest.put("/media/root", { root });
