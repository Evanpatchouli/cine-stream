# 前端权限控制系统使用指南

## 📋 概述

本权限系统基于后端返回的 `roles`（角色编码数组）和 `permissions`（权限编码数组）实现前端权限控制。

## 🎯 权限类型

根据后端 Permission Schema，权限分为 4 种类型：

1. **MENU (1)** - 菜单权限：控制路由和菜单显示
2. **BUTTON (2)** - 按钮权限：控制页面内按钮显示
3. **API (3)** - 接口权限：控制 API 调用（后端主要负责）
4. **DATA (4)** - 数据权限：控制数据范围（后端主要负责）

## 📁 文件结构

```
src/
├── auth/
│   ├── store.ts           # Zustand 认证状态管理
│   ├── permission.ts      # 权限检查工具函数
│   ├── hooks.ts           # 权限相关 Hooks
│   └── README.md          # 本文档
├── components/
│   ├── AuthButton.tsx     # 权限按钮组件
│   ├── AuthRoute.tsx      # 权限路由组件
│   └── AuthWrapper.tsx    # 权限包装组件
├── constants/
│   └── permissions.ts     # 权限常量定义
└── views/
    └── forbidden.tsx      # 403 无权限页面
```

## 🔧 使用方法

### 1. 工具函数方式（非 React 组件中使用）

```typescript
import { hasRole, hasPermission, isSuperAdmin } from '@/auth/permission';
import { ROLES, PERMISSIONS } from '@/constants/permissions';

// 检查角色
if (hasRole(ROLES.ADMIN)) {
  console.log('是管理员');
}

// 检查权限
if (hasPermission(PERMISSIONS.USER_CREATE)) {
  console.log('有创建用户权限');
}

// 检查多个权限（任意一个满足）
if (hasPermission([PERMISSIONS.USER_EDIT, PERMISSIONS.USER_DELETE])) {
  console.log('有编辑或删除用户权限');
}

// 检查是否是超级管理员
if (isSuperAdmin()) {
  console.log('是超级管理员');
}
```

### 2. Hooks 方式（React 组件中使用）

```typescript
import { useHasRole, useHasPermission, useIsSuperAdmin } from '@/auth/hooks';
import { ROLES, PERMISSIONS } from '@/constants/permissions';

function MyComponent() {
  const isAdmin = useHasRole(ROLES.ADMIN);
  const canCreateUser = useHasPermission(PERMISSIONS.USER_CREATE);
  const isSuperAdmin = useIsSuperAdmin();

  return (
    <div>
      {isAdmin && <p>管理员专属内容</p>}
      {canCreateUser && <button>创建用户</button>}
      {isSuperAdmin && <p>超级管理员专属内容</p>}
    </div>
  );
}
```

### 3. AuthWrapper 组件方式（包装任意内容）

```typescript
import AuthWrapper from '@/components/AuthWrapper';
import { PERMISSIONS } from '@/constants/permissions';

function MyPage() {
  return (
    <div>
      <h1>用户管理</h1>

      {/* 有权限时显示，无权限时隐藏 */}
      <AuthWrapper permission={PERMISSIONS.USER_CREATE}>
        <button>创建用户</button>
      </AuthWrapper>

      {/* 无权限时显示自定义内容 */}
      <AuthWrapper
        permission={PERMISSIONS.USER_DELETE}
        fallback={<span>您没有删除权限</span>}
      >
        <button>删除用户</button>
      </AuthWrapper>
    </div>
  );
}
```

### 4. AuthButton 组件方式（权限按钮）

```typescript
import AuthButton from '@/components/AuthButton';
import { PERMISSIONS } from '@/constants/permissions';

function UserList() {
  return (
    <div>
      {/* 有权限时显示按钮，无权限时隐藏 */}
      <AuthButton
        type="primary"
        permission={PERMISSIONS.USER_CREATE}
        onClick={() => console.log('创建用户')}
      >
        创建用户
      </AuthButton>

      {/* 无权限时显示禁用按钮 */}
      <AuthButton
        danger
        permission={PERMISSIONS.USER_DELETE}
        fallback={<button disabled>删除（无权限）</button>}
        onClick={() => console.log('删除用户')}
      >
        删除用户
      </AuthButton>
    </div>
  );
}
```

### 5. AuthRoute 组件方式（路由权限控制）

```typescript
// 在 router/index.tsx 中使用
import AuthRoute from '@/components/AuthRoute';
import { PERMISSIONS } from '@/constants/permissions';

const router = createHashRouter([
  {
    path: "/role",
    element: (
      <AuthRoute permission={PERMISSIONS.ROLE_VIEW}>
        <RoleView />
      </AuthRoute>
    ),
  },
  {
    path: "/user",
    element: (
      <AuthRoute permission={PERMISSIONS.USER_VIEW} redirectTo="/403">
        <UserView />
      </AuthRoute>
    ),
  },
]);
```

## 🎨 高级用法

### 组合角色和权限

```typescript
import AuthWrapper from '@/components/AuthWrapper';
import { ROLES, PERMISSIONS } from '@/constants/permissions';

// 方式1: 使用 Hook
function MyComponent() {
  const { hasRoleOrPermission } = usePermissionChecker();

  // 有管理员角色 或 有用户创建权限
  const canCreate = hasRoleOrPermission(ROLES.ADMIN, PERMISSIONS.USER_CREATE);

  return canCreate ? <button>创建</button> : null;
}

// 方式2: 使用组件（满足任意一个即可）
<AuthWrapper role={ROLES.ADMIN} permission={PERMISSIONS.USER_CREATE}>
  <button>创建用户</button>
</AuthWrapper>
```

### 检查多个权限

```typescript
import { usePermissionChecker } from '@/auth/hooks';
import { PERMISSIONS } from '@/constants/permissions';

function MyComponent() {
  const checker = usePermissionChecker();

  // 检查是否有任意一个权限
  const canEdit = checker.hasPermission([
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE
  ]);

  // 检查是否有所有权限
  const canFullManage = checker.hasAllPermissions([
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE
  ]);

  return (
    <div>
      {canEdit && <button>编辑</button>}
      {canFullManage && <button>完全管理</button>}
    </div>
  );
}
```

## 📝 权限常量管理

在 `src/constants/permissions.ts` 中定义所有权限常量：

```typescript
export const PERMISSIONS = {
  // 用户管理
  USER_VIEW: 'USER_VIEW',
  USER_CREATE: 'USER_CREATE',
  USER_EDIT: 'USER_EDIT',
  USER_DELETE: 'USER_DELETE',

  // 角色管理
  ROLE_VIEW: 'ROLE_VIEW',
  ROLE_CREATE: 'ROLE_CREATE',
  // ... 更多权限
} as const;
```

**建议**: 权限编码应与后端 Permission Schema 中的 `perm_code` 字段保持一致。

## ⚠️ 注意事项

1. **前端权限仅用于 UI 控制**，不能作为安全防护手段，真正的权限验证必须在后端进行
2. **权限编码大小写敏感**，建议统一使用大写字母和下划线（与后端一致）
3. **超级管理员** 通常拥有所有权限，可以在后端返回时包含所有权限编码
4. **权限缓存** 存储在 localStorage 中，退出登录时会自动清除

## 🔄 权限更新流程

当用户权限变更时：

```typescript
import { useLoginStore } from '@/auth/store';

// 更新用户信息（包含新的 roles 和 permissions）
const { setUserInfo } = useLoginStore();
setUserInfo({
  ...userInfo,
  roles: ['ADMIN'],
  permissions: ['USER_VIEW', 'USER_CREATE']
});
```

## 📚 API 参考

### PermissionChecker 类

- `hasRole(role)` - 检查是否有指定角色（任意一个）
- `hasAllRoles(roles)` - 检查是否有所有指定角色
- `hasPermission(permission)` - 检查是否有指定权限（任意一个）
- `hasAllPermissions(permissions)` - 检查是否有所有指定权限
- `hasRoleOrPermission(role, permission)` - 检查是否有角色或权限
- `hasRoleAndPermission(role, permission)` - 检查是否同时有角色和权限
- `isSuperAdmin()` - 是否是超级管理员

### Hooks

- `usePermissionChecker()` - 获取权限检查器实例
- `useHasRole(role)` - 检查角色
- `useHasPermission(permission)` - 检查权限
- `useHasRoleOrPermission(role, permission)` - 检查角色或权限
- `useIsSuperAdmin()` - 是否是超级管理员

### 组件

- `<AuthWrapper>` - 权限包装组件
- `<AuthButton>` - 权限按钮组件
- `<AuthRoute>` - 权限路由组件

