import { getAuthorization } from '../utils/request.util';
// src/common/middlewares/token.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { decodeLoginTokenToAuthPayload } from '../auth/jwt';
import CustomError from '../exception/CustomError';
import RS from '../constants/resp.constant';
import type { AccessInfo } from '../types';
import { MiniMatch } from '../utils/map.filter.fn';

@Injectable()
export class GlobalAuthTokenMiddleware implements NestMiddleware {
  private readonly enable = false;
  private readonly whiteList = [];
  private readonly logger = new Logger(GlobalAuthTokenMiddleware.name);
  use(req: Request, res: Response, next: NextFunction) {
    // next();
    if (this.enable) {
      if (MiniMatch<string>(this.whiteList)(req.path)) {
        return next();
      } else {
        const token = getAuthorization(req);
        const userInfo = decodeLoginTokenToAuthPayload(token);
        // 设置到请求对象上
        if (!userInfo) {
          throw new CustomError({
            status: 401,
            message: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.message,
            code: RS.AUTHENTICATION_FAIL_TOKEN_INVALID.code,
          });
        } else {
          const meta: AccessInfo = {
            ...(req.meta || {}),
            user: userInfo,
          } as AccessInfo;
          req.meta = meta;
        }
      }
    }
    return next();
  }
}
