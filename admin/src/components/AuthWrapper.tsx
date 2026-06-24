import type { ReactNode } from 'react';
import { useHasRoleOrPermission } from '@/auth/hooks';
import type { RoleCode, PermissionCode } from '@/constants/permissions';

interface AuthWrapperProps {
  role?: RoleCode | RoleCode[];
  permission?: PermissionCode | PermissionCode[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * 权限包装组件
 * 根据角色或权限控制子组件显示
 */
export default function AuthWrapper({
  role,
  permission,
  fallback = null,
  children,
}: AuthWrapperProps) {
  const hasAuth = useHasRoleOrPermission(role, permission);

  if (!hasAuth) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
