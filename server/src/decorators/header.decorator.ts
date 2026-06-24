import { Request } from 'express';
import { getAuthorization } from '@/utils/request.util';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取请求头中的Authorization
 */
export const HeaderAuthorization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return getAuthorization(request);
  },
);
