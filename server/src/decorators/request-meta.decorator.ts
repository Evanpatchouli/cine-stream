import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const RequestMeta = createParamDecorator((ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();

  return request.meta || null;
});

// 快捷装饰器
export const CurrentUser = createParamDecorator((ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();

  return request.meta?.user || null;
});
