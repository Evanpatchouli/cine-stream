// src/common/decorators/ip.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import {
  getClientIp,
  getClientIpWithInfo,
  IpInfoInterface,
} from '@/utils/ip.utils';
import { Hintable } from '@cine-stream/common';

/**
 * 获取客户端IP装饰器
 */
export const Ip = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return getClientIp(request);
  },
);

/**
 * 获取详细IP信息装饰器
 */
export const IpInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IpInfoInterface => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return getClientIpWithInfo(request);
  },
);

type RequestKeys = Hintable<keyof Request>;

/**
 * 获取原始请求对象装饰器（用于需要更多信息的情况）
 */
export const RequestIp = createParamDecorator(
  (data: RequestKeys | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (data) {
      return request[data];
    }

    return request;
  },
);
