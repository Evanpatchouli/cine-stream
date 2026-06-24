# 前端权限控制系统

## 📋 系统概述

本权限控制系统基于后端返回的用户信息中的 `roles`（角色编码数组）和 `permissions`（权限编码数组）实现前端权限控制。

### 后端数据结构

**User Schema** (`user.schema.ts`):
- `role_ids`: 用户关联的角色 ID 数组
- 登录后返回 `roles`: 角色编码数组，如 `["ADMIN", "USER"]`
- 登录后返回 `permissions`: 权限编码数组，如 `["USER_VIEW", "USER_CREATE"]`

**Role Schema** (`role.schema.ts`):
- `role_code`: 角色编码（唯一，如 "ADMIN"）
- `role_name`: 角色名称
- `permission_ids`: 角色关联的权限 ID 数组
- `status`: 状态（0-禁用，1-启用）

**Permission Schema** (`permission.schema.ts`):
- `perm_code`: 权限编码（唯一，大写字母+下划线，如 "USER_VIEW"）
- `perm_name`: 权限名称
- `type`: 权限类型
  - `1` - MENU（菜单权限）
  - `2` - BUTTON（按钮权限）
  - `3` - API（接口权限）
  - `4` - DATA（数据权限）
- `parent_id`: 父权限 ID（支持树形结构）
- `path`: 路由路径
- `component`: 组件路径
- `status`: 状态（0-禁用，1-启用）

## 🏗️ 前端架构

### 文件结构

```
src/
├── auth/
│   ├── store.ts              # Zustand 认证状态（token, userInfo）
│   ├── permission.ts         # 权限检查工具类和函数
│   ├── hooks.ts              # 权限相关 React Hooks
│   └── README.md             # 详细使用文档
├── components/
│   ├── AuthButton.tsx        # 权限按钮组件
│   ├── AuthRoute.tsx         # 权限路由组件
│   └── AuthWrapper.tsx       # 权限包装组件
├── constants/
│   └── permissions.ts        # 权限和角色常量定义
├── views/
│   ├── forbidden.tsx         # 403 无权限页面
│   └── permission-demo.tsx   # 权限使用示例页面
└── router/
    └── index.tsx             # 路由配置（已添加权限控制）
```

## 🎯 核心功能

### 1. 权限检查类 (PermissionChecker)

位置: `src/auth/permission.ts`

提供完整的权限检查功能：
- `hasRole()` - 检查角色
- `hasPermission()` - 检查权限
- `hasAllRoles()` - 检查所有角色
- `hasAllPermissions()` - 检查所有权限
- `hasRoleOrPermission()` - 检查角色或权限
- `isSuperAdmin()` - 是否超级管理员

### 2. React Hooks

位置: `src/auth/hooks.ts`

- `usePermissionChecker()` - 获取权限检查器实例
- `useHasRole()` - 检查角色
- `useHasPermission()` - 检查权限
- `useHasRoleOrPermission()` - 检查角色或权限
- `useIsSuperAdmin()` - 是否超级管理员

### 3. 权限组件

**AuthWrapper** - 权限包装组件
- 根据权限控制子组件显示/隐藏
- 支持 fallback 自定义无权限时的显示内容

**AuthButton** - 权限按钮组件
- 继承 Ant Design Button 所有属性
- 根据权限控制按钮显示/隐藏

**AuthRoute** - 权限路由组件
- 根据权限控制路由访问
- 无权限时重定向到 403 页面

## 📝 使用示例

### 示例 1: 在组件中使用 Hook

```typescript
import { useHasPermission } from '@/auth/hooks';
import { PERMISSIONS } from '@/constants/permissions';

function UserList() {
  const canCreate = useHasPermission(PERMISSIONS.USER_CREATE);

  return (
    <div>
      {canCreate && <button>创建用户</button>}
    </div>
  );
}
```
