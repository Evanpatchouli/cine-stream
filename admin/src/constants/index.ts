export const APP_NAME = "模板项目";
export const SYSTEM_NAME = "后台管理系统";
export const SUCCESS_CODE = "SUCCESS";

export const CaptchaWay = {
  REGISTER: "captcha::register",
  LOGIN: "captcha::login",
  FORGET_PASSWORD: "captcha::forgetPassword",
  CHANGE_PASSWORD: "captcha::changePassword",
} as const;

export const OPTWay = {
  PHONE_REGISTER: "opt::register::phone",
  PHONE_LOGIN: "opt::login::phone",
  PHONE_FORGET_PASSWORD: "opt::forgetPassword::phone",
  PHONE_CHANGE_PASSWORD: "opt::changePassword::phone",
  EMAIL_REGISTER: "opt::register::email",
  EMAIL_LOGIN: "opt::login::email",
  EMAIL_FORGET_PASSWORD: "opt::forgetPassword::email",
  EMAIL_CHANGE_PASSWORD: "opt::changePassword::email",
} as const;

export const StoreNames = {
  LOGIN: "app-login-store",
} as const;