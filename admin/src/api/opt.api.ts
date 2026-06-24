import type Resp from "@/models/Resp";
import { createAppRequest } from "./request";
import { OPTWay } from "../constants/index";
import type { ValuesOf } from "@cine-stream/common";

const appRequest = createAppRequest("/opt");

export const getPhoneLoginOPT = (phone: string): Promise<Resp<{}>> =>
  appRequest.get("/login/phone/" + phone);

export const getEmailLoginOPT = (email: string): Promise<Resp<{}>> =>
  appRequest.get("/login/email/" + email);

export const getOPT = (key: string, way: ValuesOf<typeof OPTWay>) => {
  switch (way) {
    case OPTWay.PHONE_LOGIN:
      return getPhoneLoginOPT(key);
    case OPTWay.EMAIL_LOGIN:
      return getEmailLoginOPT(key);
    default:
      return Promise.reject("暂不支持");
  }
};
