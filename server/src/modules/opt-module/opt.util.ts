import { TimeUnit } from '@cine-stream/common';
import TimeUnitUtil from '@/utils/time.unit.util';

export type OPT = {
  code: string;
  expiry: number;
};

/**
 * 生成 6 位 OPT（一次性验证码）
 */
export const createOPT = (expireIn?: TimeUnit): OPT => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = TimeUnitUtil.toMS(expireIn || '5m');
  return { code, expiry };
};
