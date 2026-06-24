import {
  getClientIp,
  getNonce,
  getTimestamp,
  getUserAgent,
} from '../utils/request.util';
// src/common/middlewares/token.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { AccessInfo } from '../types';
import { createLogger } from '@/common/logger';

// 扩展 Express Request 类型
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      meta?: AccessInfo;
    }
  }
}

@Injectable()
export class RequestMetaMiddleware implements NestMiddleware {
  private readonly logger = createLogger(RequestMetaMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // 获取请求元数据
    const meta: AccessInfo = {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      xtimestamp: getTimestamp(req),
      xnonce: getNonce(req),
    };
    req.meta = meta;

    // 记录访问日志（可选）
    this.logAccess(req, meta);

    return next();
  }

  /**
   * 访问日志
   */
  private logAccess(req: Request, meta: AccessInfo): void {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      // ip: meta.ip,
      // userAgent: meta.userAgent,
      // userId: meta.user?.userId || 'anonymous',
      // timestamp: new Date().toISOString(),
    };

    this.logger.trace(`请求: ${JSON.stringify(logData)}`);
  }
}
