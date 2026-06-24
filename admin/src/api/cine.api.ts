import type Resp from "@/models/Resp";
import type { PaginatedResult } from "@cine-stream/common";
import { createAppRequest } from "./request";

const appRequest = createAppRequest("/admin/cines");

export interface EpisodeInput {
  name: string;
  description?: string;
  duration?: string;
  thumbnail?: string;
  file_path: string;
  file_url?: string;
}

export interface CineRecord {
  id: string;
  name: string;
  description?: string;
  genre?: string[];
  year?: string;
  season?: string;
  rating?: string;
  poster?: string;
  backdrop?: string;
  badge?: string;
  meta?: string;
  cast?: string[];
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

export interface MediaInfo {
  relative_path: string;
  duration: string;
  duration_seconds: number;
  thumbnail: string;
}

export interface ImageUploadResult {
  objectKey: string;
  url: string;
  bucket: string;
}

export const queryCinePage = (params: {
  page: number;
  size: number;
  keyword?: string;
}): Promise<Resp<PaginatedResult<CineRecord>>> => appRequest.get("/", { params });

export const createCine = (data: {
  name: string;
  description?: string;
  genre?: string[];
  year?: string;
  season?: string;
  rating?: string;
  poster?: string;
  backdrop?: string;
  badge?: string;
  meta?: string;
  cast?: string[];
}): Promise<Resp<CineRecord>> => appRequest.post("/", data);

export const updateCine = (
  id: string,
  data: {
    name?: string;
    description?: string;
    genre?: string[];
    year?: string;
    season?: string;
    rating?: string;
    poster?: string;
    backdrop?: string;
    badge?: string;
    meta?: string;
    cast?: string[];
  },
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

export const getMediaInfo = (filePath: string): Promise<Resp<MediaInfo>> =>
  appRequest.get("/media/info", { params: { path: filePath } });

export const getMediaRoot = (): Promise<Resp<MediaRootSetting>> =>
  appRequest.get("/media/root");

export const updateMediaRoot = (root: string): Promise<Resp<MediaRootSetting>> =>
  appRequest.put("/media/root", { root });

export const uploadCineImage = (
  file: File,
): Promise<Resp<ImageUploadResult>> => {
  const formData = new FormData();
  formData.append("file", file);
  return appRequest.post("/images", formData);
};
