import type { ValuesOf } from "@cine-stream/common";
import { CaptchaWay } from '@/constants/index';
import useCaptcha, { type UseCaptchaOptions } from "@/hooks/useCaptcha";

export type CaptchaProps = {
  way: ValuesOf<typeof CaptchaWay>,
} & UseCaptchaOptions

export default function Captcha({ way, onSuccess, onError }: CaptchaProps) {
  const [data, refetch] = useCaptcha(way, { onSuccess, onError });
  const handleClick = () => {
    refetch();
  }

  return (
    <>
      {data ? (
        <img
          src={`data:image/svg+xml;base64,${data}`}
          alt="验证码"
          onClick={handleClick}
          style={{ height: '100%', width: '100%', objectFit: 'contain' }}
        />
      ) : (
        <span style={{ fontSize: 12, color: '#999' }}>加载中...</span>
      )}
    </>
  )
}