import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useHasRoleOrPermission } from '@/auth/hooks';
import type { RoleCode, PermissionCode } from '@/constants/permissions';

interface AuthRouteProps {
  role?: RoleCode | RoleCode[];
  permission?: PermissionCode | PermissionCode[];
  redirectTo?: string;
  children: ReactNode;
}

/**
 * 权限路由组件
 * 根据角色或权限控制路由访问
 */
export default function AuthRoute({
  role,
  permission,
  redirectTo = '/403',
  children,
}: AuthRouteProps) {
  const hasAuth = useHasRoleOrPermission(role, permission);

  if (!hasAuth) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
