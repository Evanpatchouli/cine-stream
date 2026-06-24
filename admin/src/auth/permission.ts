import { useLoginStore } from './store';
import type { RoleCode, PermissionCode } from '@/constants/permissions';

/**
 * 权限检查类
 */
export class PermissionChecker {
  private roles: string[];
  private permissions: string[];

  constructor(roles: string[] = [], permissions: string[] = []) {
    this.roles = roles;
    this.permissions = permissions;
  }

  /**
   * 检查是否有指定角色（任意一个）
   */
  hasRole(role: RoleCode | RoleCode[]): boolean {
    if (!this.roles || this.roles.length === 0) return false;

    const rolesToCheck = Array.isArray(role) ? role : [role];
    return rolesToCheck.some(r => this.roles.includes(r));
  }

  /**
   * 检查是否有所有指定角色
   */
  hasAllRoles(roles: RoleCode[]): boolean {
    if (!this.roles || this.roles.length === 0) return false;
    return roles.every(r => this.roles.includes(r));
  }

  /**
   * 检查是否有指定权限（任意一个）
   */
  hasPermission(permission: PermissionCode | PermissionCode[]): boolean {
    if (!this.permissions || this.permissions.length === 0) return false;

    const permsToCheck = Array.isArray(permission) ? permission : [permission];
    return permsToCheck.some(p => this.permissions.includes(p));
  }

  /**
   * 检查是否有所有指定权限
   */
  hasAllPermissions(permissions: PermissionCode[]): boolean {
    if (!this.permissions || this.permissions.length === 0) return false;
    return permissions.every(p => this.permissions.includes(p));
  }

  /**
   * 检查是否有角色或权限（任意一个满足即可）
   */
  hasRoleOrPermission(
    role?: RoleCode | RoleCode[],
    permission?: PermissionCode | PermissionCode[]
  ): boolean {
    const hasRoleCheck = role ? this.hasRole(role) : false;
    const hasPermCheck = permission ? this.hasPermission(permission) : false;
    return hasRoleCheck || hasPermCheck;
  }

  /**
   * 检查是否同时有角色和权限
   */
  hasRoleAndPermission(
    role: RoleCode | RoleCode[],
    permission: PermissionCode | PermissionCode[]
  ): boolean {
    return this.hasRole(role) && this.hasPermission(permission);
  }

  /**
   * 是否是超级管理员
   */
  isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }
}

/**
 * 获取权限检查器实例
 */
export function getPermissionChecker(): PermissionChecker {
  const { userInfo } = useLoginStore.getState();
  return new PermissionChecker(
    userInfo?.roles || [],
    userInfo?.permissions || []
  );
}

/**
 * 快捷函数：检查角色
 */
export function hasRole(role: RoleCode | RoleCode[]): boolean {
  return getPermissionChecker().hasRole(role);
}

/**
 * 快捷函数：检查权限
 */
export function hasPermission(permission: PermissionCode | PermissionCode[]): boolean {
  return getPermissionChecker().hasPermission(permission);
}

/**
 * 快捷函数：检查角色或权限
 */
export function hasRoleOrPermission(
  role?: RoleCode | RoleCode[],
  permission?: PermissionCode | PermissionCode[]
): boolean {
  return getPermissionChecker().hasRoleOrPermission(role, permission);
}

/**
 * 快捷函数：是否是超级管理员
 */
export function isSuperAdmin(): boolean {
  return getPermissionChecker().isSuperAdmin();
}
