export interface Episode {
  id?: string;
  name: string;
  description?: string;
  file_path?: string;
  file_url?: string;
  stream_url?: string;
  hls_url?: string;
  hls_status?: "none" | "processing" | "ready" | "failed";
  hls_profiles?: Array<"1080p" | "720p" | "360p">;
  duration?: string;
  duration_seconds?: number;
  thumbnail?: string;
  progress?: number;
}

export interface Cine {
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
  progressText?: string;
  progress?: number;
  cast?: string[];
  episodes?: Episode[];
}

export interface LoginUser {
  id: string;
  nickname?: string;
  phone?: string;
  username?: string;
  email?: string;
  avatar?: string;
  token: string;
  roles?: string[];
  permissions?: string[];
}

export interface PlaybackPreferences {
  auto_play_next: boolean;
  default_muted: boolean;
}

export interface UserProfile {
  id: string;
  nickname?: string;
  phone?: string;
  username?: string;
  email?: string;
  avatar?: string;
  playback_preferences?: PlaybackPreferences;
}

export interface WatchHistoryItem {
  id: string;
  cine_id: string;
  episode_id?: string | null;
  progress: number;
  position_seconds: number;
  duration_seconds: number;
  last_watched_at: number;
  cine?: Cine | null;
  episode?: Episode | null;
}

export interface WatchCollectionItem {
  id: string;
  cine_id: string;
  created_at: number;
  cine?: Cine | null;
}

export interface WatchOverview {
  watched_count: number;
  saved_count: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface RecordWatchHistoryInput {
  cine_id: string;
  episode_id?: string;
  progress?: number;
  position_seconds?: number;
  duration_seconds?: number;
}
