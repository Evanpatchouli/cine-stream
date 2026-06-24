import { Maybe } from '@cine-stream/common';
import {
  signJWTToken,
  signLoginToken,
  AuthTokenPayload,
} from '@/auth/jwt';

export const generateToken = (
  id: string,
  openid: Maybe<string>,
  phone: Maybe<string>,
  username: Maybe<string>,
  email: Maybe<string>,
  roles: string[],
  permissions: string[],
) => {
  const payload = {
    id,
    openid,
    phone,
    username,
    email,
    roles: roles || [],
    permissions: permissions || [],
  } as AuthTokenPayload;
  const jwtoken = signJWTToken(payload);
  return signLoginToken(jwtoken);
};
