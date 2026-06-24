import type { ButtonProps } from 'antd';
import { Button } from 'antd';
import type { ReactNode } from 'react';
import { useHasRoleOrPermission } from '@/auth/hooks';
import type { RoleCode, PermissionCode } from '@/constants/permissions';

interface AuthButtonProps extends Omit<ButtonProps, 'role'> {
  role?: RoleCode | RoleCode[];
  permission?: PermissionCode | PermissionCode[];
  fallback?: ReactNode;
  children?: ReactNode;
}

/**
 * 权限按钮组件
 * 根据角色或权限控制按钮显示
 */
export default function AuthButton({
  role,
  permission,
  fallback = null,
  children,
  ...buttonProps
}: AuthButtonProps) {
  const hasAuth = useHasRoleOrPermission(role, permission);

  if (!hasAuth) {
    return <>{fallback}</>;
  }

  return <Button {...buttonProps}>{children}</Button>;
}
