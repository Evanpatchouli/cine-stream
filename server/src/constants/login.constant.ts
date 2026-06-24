import { ValuesOf } from '@cine-stream/common';

export const LoginTypes = {
  OPENID: 'openid',
  PHONE: 'phone',
  ACCOUNT: 'account',
  EMAIL: 'email'
} as const;

export type LoginType = ValuesOf<typeof LoginTypes>;
