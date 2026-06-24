// router/generator.tsx
import type { RouteObject } from "react-router";
import AuthRoute from "@/components/AuthRoute";
import { type RouteConfig } from "./config";

// 将配置转换为 React Router 路由对象
export function generateRoutes(configs: RouteConfig[]): RouteObject[] {
  return configs.map((config) => {
    const route: RouteObject = {
      path: config.path,
      element: config.permission ? (
        <AuthRoute permission={config.permission} role={config.roles}>
          <config.component />
        </AuthRoute>
      ) : (
        <config.component />
      ),
    };

    // 递归处理子路由
    if (config.children) {
      route.children = generateRoutes(config.children);
    }

    return route;
  });
}

// 过滤有权限的路由（用于生成菜单）
export function filterAuthorizedRoutes(
  configs: RouteConfig[],
  hasPermission: (code: string) => boolean,
  hasRole: (code: string) => boolean
): RouteConfig[] {
  return configs
    .filter((config) => {
      if (config.hideInMenu) {
        return false;
      }

      // 检查权限
      if (config.permission && !hasPermission(config.permission)) {
        return false;
      }
      // 检查角色
      if (config.roles) {
        if (typeof config.roles === 'string') {
          if (!hasRole(config.roles)) {
            return false;
          } else if (Array.isArray(config.roles) && !config.roles.some(role => hasRole(role))) {
            return false;
          }
        }
        return true;
      }
      return true;
    })
    .map((config) => ({
      ...config,
      children: config.children
        ? filterAuthorizedRoutes(config.children, hasPermission, hasRole)
        : undefined,
    }))
    .filter((config) => {
      // 如果父路由没有子路由了，且本身没有component，则过滤掉
      if (config.children && config.children.length === 0 && !config.component) {
        return false;
      }
      return true;
    });
}
