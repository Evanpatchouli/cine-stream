import { message } from "antd";
import { useState, useEffect, useCallback } from "react";
import * as API from "@/api/captcha.api";
import type { NullableString, ValuesOf } from "@cine-stream/common";
import type { CaptchaWay } from "@/constants";

export interface UseCaptchaOptions {
  onSuccess?: (captchaId: string) => void;
  onError?: (err: Error) => void;
}

const defaultOnSuccess = () => {};
const defaultOnError = () => message.error("验证码获取失败");

export default function useCaptcha(
  way: ValuesOf<typeof CaptchaWay>,
  {
    onSuccess = defaultOnSuccess,
    onError = defaultOnError,
  }: UseCaptchaOptions = {
    onSuccess: defaultOnSuccess,
    onError: defaultOnError,
  },
): [Base64URLString | null, () => Promise<void>] {
  const [captchaBase64, setCaptchaBase64] = useState<NullableString>("");

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await API.getCaptcha(way);
      if (res.isSuccess()) {
        setCaptchaBase64(res.getData() || "");
        return onSuccess(res.getData() || "");
      } else {
        throw new Error(res.getMessage() || "服务异常");
      }
    } catch (err) {
      console.error(err as Error);
      onError?.(err as Error);
    }
  }, [way, onSuccess, onError]);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  return [captchaBase64, fetchCaptcha];
}
