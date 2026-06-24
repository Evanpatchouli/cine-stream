import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  applyDecorators,
} from '@nestjs/common';
import {
  AUTH_REQUIRED_KEY,
  PUBLIC_KEY,
  ROLE_KEY,
  ROLE_IN_KEY,
  ROLES_KEY,
} from './auth.constants';
import { RoleCodes } from '@/constants/role.constant';
import { Hintable, HintableArray } from '@cine-stream/common';

/**
 * Controller 或 Method 级别：开启认证
 * - 类上标记：类内方法默认需要认证
 * - 方法上标记：覆盖默认公开逻辑
 */
export const Auth = () => SetMetadata(AUTH_REQUIRED_KEY, true);

/**
 * 方法级：指定这个接口需要认证（适用于类没有 Auth）
 */
export const AuthApi = () => SetMetadata(AUTH_REQUIRED_KEY, true);

/**
 * 方法级：公开接口（用于 @Auth 类下豁免）
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/**
 * 角色鉴权：单角色，要求用户拥有此角色
 */
export const Role = (role: Hintable<RoleCodes>) => SetMetadata(ROLE_KEY, role);

/**
 * 角色鉴权：某几个角色之一（OR）
 */
export const RoleIn = (...roles: HintableArray<RoleCodes>) =>
  SetMetadata(ROLE_IN_KEY, roles);

/**
 * 角色鉴权：要求同时具备所有角色（AND）
 */
export const Roles = (...roles: HintableArray<RoleCodes>) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * 不强制认证，无用户返回 null
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.meta?.user) {
      console.warn(
        '[Warning] CurrentUser() used but no user found, returning null',
      );
      return null;
    }
    return req.meta.user;
  },
);

/**
 * 强制认证，无用户 401
 */
export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.meta?.user) {
      throw new UnauthorizedException('用户未登录');
    }
    return req.meta.user;
  },
);

/**
 * 强制认证 + admin 校验
 */
export const AdminUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.meta?.user;

    if (!user) {
      throw new UnauthorizedException('用户未登录');
    }
    if (!user.roles?.includes('admin')) {
      throw new ForbiddenException('需要管理员权限');
    }
    return user;
  },
);
