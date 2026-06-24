import type Resp from "@/models/Resp";
import { createAppRequest } from "./request";
import { CaptchaWay } from "../constants/index";
import type { ValuesOf } from "@cine-stream/common";

const appRequest = createAppRequest("/captcha");
export const getLoginCaptcha = (): Promise<Resp<Base64URLString>> =>
  appRequest.get("/login");

export const getRegisterCaptcha = (): Promise<Resp<Base64URLString>> =>
  appRequest.get("/register");

export const getCaptcha = (way: ValuesOf<typeof CaptchaWay>) => {
  switch (way) {
    case CaptchaWay.LOGIN:
      return getLoginCaptcha();
    case CaptchaWay.REGISTER:
      return getRegisterCaptcha();
    default:
      return Promise.reject("暂不支持");
  }
};
