import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AUTH_REQUIRED_KEY,
  PUBLIC_KEY,
  ROLE_KEY,
  ROLE_IN_KEY,
  ROLES_KEY,
} from './auth.constants';
import { verifyLoginTokenToAuthPayload } from './jwt';
import { getAuthorization } from '../utils/request.util';
import { logger } from '@/common/logger';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const handler = ctx.getHandler();
    const clazz = ctx.getClass();
    const req = ctx.switchToHttp().getRequest();

    // 1. 若标记 Public => 无条件公开
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      handler,
      clazz,
    ]);
    if (isPublic) return true;

    // 2. 判断是否需要认证
    const isAuthRequired = this.reflector.getAllAndOverride<boolean>(
      AUTH_REQUIRED_KEY,
      [handler, clazz],
    );

    // 3. 判断是否有角色注解（角色注解隐含需要认证）
    const needRoleSingle = this.reflector.getAllAndOverride<string>(ROLE_KEY, [
      handler,
      clazz,
    ]);
    const needRoleIn = this.reflector.getAllAndOverride<string[]>(ROLE_IN_KEY, [
      handler,
      clazz,
    ]);
    const needRolesAll = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      handler,
      clazz,
    ]);

    const needAuth =
      isAuthRequired || needRoleSingle || needRoleIn || needRolesAll;

    // 4. 若无认证 & 无角色，默认公开
    if (!needAuth) return true;

    // 5. 执行认证
    const token = getAuthorization(req);
    if (!token) {
      logger.info('请求地址', (req as Request).url);
      throw new UnauthorizedException('未提供认证令牌');
    }

    const user = verifyLoginTokenToAuthPayload(token);

    // 写入 req.meta.user
    req.meta = req.meta || {};
    req.meta.user = user;

    // 6. 角色鉴权
    const userRoles: string[] = user?.roles || [];

    // Role(role) => user.roles 必须包含 role
    if (needRoleSingle && !userRoles.includes(needRoleSingle)) {
      logger.info('请求地址', (req as Request).url);
      logger.error(`需要角色: ${needRoleSingle}`);
      throw new ForbiddenException();
    }

    // RoleIn(...roles) => user.roles 至少包含其中一个
    if (needRoleIn && !needRoleIn.some((r) => userRoles.includes(r))) {
      logger.info('请求地址', (req as Request).url);
      logger.error(`需要满足任意角色: ${needRoleIn.join(', ')}`);
      throw new ForbiddenException();
    }

    // Roles(...roles) => user.roles 必须包含所有角色
    if (needRolesAll && !needRolesAll.every((r) => userRoles.includes(r))) {
      logger.info('请求地址', (req as Request).url);
      logger.error(
        `需要${needRolesAll.length > 1 ? '同时具备' : ''}角色: ${needRolesAll.join(', ')}`,
      );
      throw new ForbiddenException();
    }

    return true;
  }
}
