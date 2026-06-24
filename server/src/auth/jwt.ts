import { Maybe, Nullable, NullableObject } from '@cine-stream/common';
import jwt from 'jsonwebtoken';
import AppConfig from '../app.config';
import RS from '../constants/resp.constant';
import CustomError from '../exception/CustomError';
import cache from '../cache';
import { JWTStatus } from '../constants/jwt.constant';
import TimeUnitUtil from 'src/utils/time.unit.util';
import { v7 as uuid } from 'uuid';
import CacheConstant from '@/constants/cache.constant';

export type AuthTokenPayload = {
  id: string;
  openid: Maybe<string>;
  phone: Maybe<string>;
  username: Maybe<string>;
  roles: string[];
  permissions: string[];
};

const { SK: secret, TTL, ...jwtConfig } = AppConfig.Jwt;
const PREFIX = CacheConstant.JWT_PREFIX;

const defaultTTL: string = '7d';

export function signJWTToken(user: AuthTokenPayload) {
  const payload = {
    id: user.id,
    openid: user.openid,
    roles: user.roles,
    permissions: user.permissions,
  };
  const jwtoken: Nullable<string> = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: TTL || defaultTTL,
    ...jwtConfig,
  });

  return jwtoken;
}

export type LoginTokenCachePayload = {
  status: (typeof JWTStatus)[keyof typeof JWTStatus];
  jwt: string;
};

export function signLoginToken(jwtoken: string) {
  const token = uuid();
  // 实际移除缓存的时间为token过期时间加上24小时，因为短期内用户可能还会登录，保留机会告知 token 过期
  const realTTL =
    TimeUnitUtil.toMS(TTL || defaultTTL) + TimeUnitUtil.toMS('24h');
  cache.set<LoginTokenCachePayload>(
    formatTokenKey(token),
    {
      status: JWTStatus.ACTIVE,
      jwt: jwtoken,
    },
    realTTL,
  );
  return token;
}

export function getAuthToken(login_token: string) {
  const token = cache.get<LoginTokenCachePayload>(formatTokenKey(login_token));
  if (!token) {
    throw new CustomError({
      status: 401,
      message: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.message,
      code: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.code,
    });
  }
  if (token.status !== JWTStatus.ACTIVE) {
    throw new CustomError({
      status: 401,
      message: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.message,
      code: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.code,
    });
  }
  return token.jwt;
}

export function verifyLoginTokenToAuthPayload(login_token: Maybe<string>) {
  if (!login_token) {
    throw new CustomError({
      status: 401,
      message: RS.AUTHENTICATION_FAIL_TOKEN_MISSING.message,
      code: RS.AUTHENTICATION_FAIL_TOKEN_MISSING.code,
    });
  }
  return decodeJWTToken(getAuthToken(login_token));
}

export function decodeLoginTokenToAuthPayload(login_token: Maybe<string>) {
  return verifyLoginTokenToAuthPayload(login_token);
}

export function decodeJWTToken(token: string) {
  let decoded: NullableObject<AuthTokenPayload> = null;
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as AuthTokenPayload;
  } catch (err) {
    if (err) {
      const error = err as jwt.VerifyErrors;
      // if (err instanceof jwt.TokenExpiredError) {
      //   throw new CustomError({
      //     status: 401,
      //     message: RS.AUTHENTICATION_FAIL_TOKEN_EXPIRED.message,
      //     code: RS.AUTHENTICATION_FAIL_TOKEN_EXPIRED.code,
      //   });
      // }
      // if (err instanceof jwt.JsonWebTokenError) {
      //   throw new CustomError({
      //     status: 401,
      //     message: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.message,
      //     code: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.code,
      //   });
      // }
      // if (err instanceof jwt.NotBeforeError) {
      //   throw new CustomError({
      //     status: 401,
      //     message: RS.AUTHENTICATION_FAIL_TOKEN_NOT_BEFORE.message,
      //     code: RS.AUTHENTICATION_FAIL_TOKEN_NOT_BEFORE.code,
      //   });
      // }
      // throw new CustomError({
      //   status: 401,
      //   message: RS.AUTHENTICATION_FAIL.message,
      //   code: RS.AUTHENTICATION_FAIL.code,
      // });
      switch (error.name) {
        case 'TokenExpiredError':
          throw new CustomError({
            status: 401,
            message: RS.AUTHENTICATION_FAIL_TOKEN_EXPIRED.message,
            code: RS.AUTHENTICATION_FAIL_TOKEN_EXPIRED.code,
          });
        case 'JsonWebTokenError':
          throw new CustomError({
            status: 401,
            message: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.message,
            code: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.code,
          });
        case 'NotBeforeError':
          throw new CustomError({
            status: 401,
            message: RS.AUTHENTICATION_FAIL_TOKEN_NOT_BEFORE.message,
            code: RS.AUTHENTICATION_FAIL_TOKEN_NOT_BEFORE.code,
          });
        default:
          throw new CustomError({
            status: 401,
            message: RS.AUTHENTICATION_FAIL.message,
            code: RS.AUTHENTICATION_FAIL.code,
          });
      }
    }
  }
  return decoded;
}

export function verifyLoginToken(token: string) {
  const key = formatTokenKey(token);
  const cachePayload = cache.get<LoginTokenCachePayload>(key);
  if (!cachePayload) {
    throw new CustomError({
      status: 401,
      message: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.message,
      code: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.code,
    });
  } else {
    if (cachePayload.status === JWTStatus.INACTIVE) {
      throw new CustomError({
        status: 401,
        message: RS.AUTHENTICATION_FAIL_TOKEN_EXPIRED.message,
        code: RS.AUTHENTICATION_FAIL_TOKEN_EXPIRED.code,
      });
    } else {
      const jwtoken = cachePayload.jwt;
      return decodeJWTToken(jwtoken);
    }
  }
}

export function expireLoginToken(token: string) {
  const key = formatTokenKey(token);
  cache.update<Partial<LoginTokenCachePayload>>(
    key,
    {
      status: JWTStatus.INACTIVE,
    },
    {
      hydrate: true,
      hydrateMode: 'shallow',
    },
  );
}

export function formatTokenKey(token: string) {
  return `${PREFIX}::${token}`;
}
