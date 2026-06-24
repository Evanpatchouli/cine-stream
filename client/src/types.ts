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
  genre?: string;
  year?: string;
  season?: string;
  rating?: string;
  poster?: string;
  backdrop?: string;
  badge?: string;
  meta?: string;
  progressText?: string;
  progress?: number;
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

export interface ApiResp<T> {
  code: string | number;
  message?: string;
  data?: T;
}
