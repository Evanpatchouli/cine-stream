import type Resp from "@/models/Resp";
import type { LoginUser, PlaybackPreferences, UserProfile } from "@/types";
import { createAppRequest } from "./http";

const appRequest = createAppRequest("/user");

export const loginByPhonePassword = (
  phone: string,
  password: string,
): Promise<Resp<LoginUser>> =>
  appRequest.post("/login/password", { phone, password });

export const getProfile = (): Promise<Resp<UserProfile>> =>
  appRequest.get("/profile");

export const updateProfile = (data: {
  nickname?: string;
  email?: string;
}): Promise<Resp<UserProfile>> => appRequest.put("/profile", data);

export const updateAvatar = (avatar: string): Promise<Resp<UserProfile>> =>
  appRequest.put("/avatar", { avatar });

export const uploadAvatar = (file: File): Promise<Resp<UserProfile>> => {
  const formData = new FormData();
  formData.append("file", file);
  return appRequest.post("/avatar", formData);
};

export const getPlaybackPreferences = (): Promise<Resp<PlaybackPreferences>> =>
  appRequest.get("/playback-preferences");

export const updatePlaybackPreferences = (
  data: Partial<PlaybackPreferences>,
): Promise<Resp<PlaybackPreferences>> =>
  appRequest.put("/playback-preferences", data);
