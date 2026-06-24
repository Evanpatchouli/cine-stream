export interface Episode {
  id?: string;
  name: string;
  description?: string;
  file_path?: string;
  file_url?: string;
  duration?: string;
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
  token: string;
  roles?: string[];
  permissions?: string[];
}

export interface UserProfile {
  id: string;
  nickname?: string;
  phone?: string;
  username?: string;
  email?: string;
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

export interface RecordWatchHistoryInput {
  cine_id: string;
  episode_id?: string;
  progress?: number;
  position_seconds?: number;
  duration_seconds?: number;
}
