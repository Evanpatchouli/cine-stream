// router/config.tsx
import { lazy, type ComponentType } from "react";
import { PERMISSIONS, type RoleCode, type PermissionCode } from "@/constants/permissions";

// 路由配置接口
export interface RouteConfig {
  path: string;
  label: string;
  icon?: string;
  component: ComponentType;
  permission?: PermissionCode;      // 所需权限编码
  roles?: RoleCode | RoleCode[];         // 允许的角色（可选）
  hideInMenu?: boolean;     // 是否在菜单中隐藏
  children?: RouteConfig[];
}

// 权限路由映射表（与后端权限树对应）
export const routeConfigs: RouteConfig[] = [
  // ========== 仪表盘（公开）==========
  {
    path: "/dashboard",
    label: "仪表盘",
    icon: "dashboard",
    component: lazy(() => import("@/views/dashboard")),
  },

  // ========== 系统管理模块 ==========
  {
    path: "/system",
    label: "系统管理",
    icon: "setting",
    component: lazy(() => import("@/views/system/layout")), // Layout 组件
    permission: PERMISSIONS.SYSTEM,
    children: [
      {
        path: "/system/user",
        label: "用户管理",
        icon: "user",
        component: lazy(() => import("@/views/system/user")),
        permission: PERMISSIONS.SYSTEM_USER,
      },
    ],
  },

  {
    path: "/cine",
    label: "影视管理",
    icon: "video-camera",
    component: lazy(() => import("@/views/cine")),
    permission: PERMISSIONS.CINE_MANAGE,
  },

  // ========== 权限演示（开发调试用，生产环境可删除）==========
  {
    path: "/permission-demo",
    label: "权限演示",
    icon: "experiment",
    component: lazy(() => import("@/views/permission-demo")),
    hideInMenu: true, // 不在菜单显示，直接访问
  },
];
