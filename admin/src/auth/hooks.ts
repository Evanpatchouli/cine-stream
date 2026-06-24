import { useMemo } from 'react';
import { useLoginStore } from './store';
import { PermissionChecker } from './permission';
import type { RoleCode, PermissionCode } from '@/constants/permissions';

/**
 * 使用权限检查器 Hook
 */
export function usePermissionChecker(): PermissionChecker {
  const { userInfo } = useLoginStore();

  return useMemo(() => {
    return new PermissionChecker(
      userInfo?.roles || [],
      userInfo?.permissions || []
    );
  }, [userInfo?.roles, userInfo?.permissions]);
}

/**
 * 检查角色 Hook
 */
export function useHasRole(role: RoleCode | RoleCode[]): boolean {
  const checker = usePermissionChecker();
  return useMemo(() => checker.hasRole(role), [checker, role]);
}

/**
 * 检查权限 Hook
 */
export function useHasPermission(permission: PermissionCode | PermissionCode[]): boolean {
  const checker = usePermissionChecker();
  return useMemo(() => checker.hasPermission(permission), [checker, permission]);
}

/**
 * 检查角色或权限 Hook
 */
export function useHasRoleOrPermission(
  role?: RoleCode | RoleCode[],
  permission?: PermissionCode | PermissionCode[]
): boolean {
  const checker = usePermissionChecker();
  return useMemo(
    () => checker.hasRoleOrPermission(role, permission),
    [checker, role, permission]
  );
}

/**
 * 检查是否是超级管理员 Hook
 */
export function useIsSuperAdmin(): boolean {
  const checker = usePermissionChecker();
  return useMemo(() => checker.isSuperAdmin(), [checker]);
}
