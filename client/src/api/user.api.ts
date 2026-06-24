import type Resp from "@/models/Resp";
import type { LoginUser, UserProfile } from "@/types";
import { createAppRequest } from "./http";

const appRequest = createAppRequest("/user");

export const loginByPhonePassword = (
  phone: string,
  password: string,
): Promise<Resp<LoginUser>> =>
  appRequest.post("/login/password", { phone, password });

export const getProfile = (): Promise<Resp<UserProfile>> =>
  appRequest.get("/profile");
