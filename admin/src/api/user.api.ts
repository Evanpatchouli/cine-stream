import type {
  AccountLoginForm,
  AccountRegisterForm,
  EmailLoginForm,
  ILoginResult,
  IRegisterResult,
  PhoneLoginForm,
} from "@/types/user";
import { createAppRequest } from "./request";
import type Resp from "@/models/Resp";

const appRequest = createAppRequest("/user");
export const accountLogin = (
  data: AccountLoginForm,
): Promise<Resp<ILoginResult>> => appRequest.post("/login/account", data);

export const accountRegister = (
  data: AccountRegisterForm,
): Promise<Resp<IRegisterResult>> => appRequest.post("/register/account", data);

export const emailLogin = (data: EmailLoginForm): Promise<Resp<ILoginResult>> =>
  appRequest.post("/login/email", data);

export const phoneLogin = (data: PhoneLoginForm): Promise<Resp<ILoginResult>> =>
  appRequest.post("/login/phone", data);

export const logout = (): Promise<Resp<{}>> => appRequest.post("/logout");
