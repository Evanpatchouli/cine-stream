export enum PermissionType {
  MENU = 1,
  BUTTON = 2,
  API = 3,
  DATA = 4,
}

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CONTENT_ADMIN: 'CONTENT_ADMIN',
  OPERATOR: 'OPERATOR',
  NORMAL_USER: 'NORMAL_USER',
} as const;

export const PERMISSIONS = {
  SYSTEM: 'SYSTEM',
  SYSTEM_USER: 'SYSTEM_USER',
  SYSTEM_USER_VIEW: 'SYSTEM_USER_VIEW',
  SYSTEM_USER_CREATE: 'SYSTEM_USER_CREATE',
  SYSTEM_USER_EDIT: 'SYSTEM_USER_EDIT',
  SYSTEM_USER_DISABLE: 'SYSTEM_USER_DISABLE',

  CINE: 'CINE',
  CINE_MANAGE: 'CINE_MANAGE',
  CINE_VIEW: 'CINE_VIEW',
  CINE_CREATE: 'CINE_CREATE',
  CINE_EDIT: 'CINE_EDIT',
  CINE_DELETE: 'CINE_DELETE',
  CINE_EPISODE_CONFIG: 'CINE_EPISODE_CONFIG',

  API_SYSTEM_USER_LIST: 'API_SYSTEM_USER_LIST',
  API_SYSTEM_USER_CREATE: 'API_SYSTEM_USER_CREATE',
  API_SYSTEM_USER_UPDATE: 'API_SYSTEM_USER_UPDATE',
  API_CINE_LIST: 'API_CINE_LIST',
  API_CINE_CREATE: 'API_CINE_CREATE',
  API_CINE_UPDATE: 'API_CINE_UPDATE',
  API_CINE_DELETE: 'API_CINE_DELETE',
  API_CINE_EPISODE_CONFIG: 'API_CINE_EPISODE_CONFIG',
  API_CINE_MEDIA_FILES: 'API_CINE_MEDIA_FILES',

  APP_CINE_VIEW: 'APP_CINE_VIEW',
  APP_CINE_PLAY: 'APP_CINE_PLAY',
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];
export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_TAGS = {
  SYSTEM: 'system',
  CINE: 'cine',
  API: 'api',
  APP: 'app',
} as const;

export const ROLE_PERMISSIONS_MAP = {
  [ROLES.SUPER_ADMIN]: {
    label: '超级管理员',
    description: '系统最高权限，拥有所有后台能力',
    scope: '用户管理、影视管理、剧集配置',
    color: '#ff4d4f',
  },
  [ROLES.CONTENT_ADMIN]: {
    label: '内容管理员',
    description: '负责影视资源和剧集维护',
    scope: '影视管理、剧集配置',
    color: '#1677ff',
  },
  [ROLES.OPERATOR]: {
    label: '运营专员',
    description: '负责日常资源录入和配置',
    scope: '影视查看、创建、编辑、剧集配置',
    color: '#722ed1',
  },
  [ROLES.NORMAL_USER]: {
    label: '普通用户',
    description: '客户端观看用户',
    scope: '客户端浏览和播放',
    color: '#666666',
  },
} as const;

export const ROLE_HIERARCHY = [
  ROLES.SUPER_ADMIN,
  ROLES.CONTENT_ADMIN,
  ROLES.OPERATOR,
  ROLES.NORMAL_USER,
] as const;

export const PERMISSION_GROUPS = [
  {
    key: 'system',
    label: '系统管理',
    icon: 'setting',
    permissions: [
      PERMISSIONS.SYSTEM,
      PERMISSIONS.SYSTEM_USER,
      PERMISSIONS.SYSTEM_USER_VIEW,
      PERMISSIONS.SYSTEM_USER_CREATE,
      PERMISSIONS.SYSTEM_USER_EDIT,
      PERMISSIONS.SYSTEM_USER_DISABLE,
    ],
  },
  {
    key: 'cine',
    label: '影视管理',
    icon: 'video-camera',
    permissions: [
      PERMISSIONS.CINE,
      PERMISSIONS.CINE_MANAGE,
      PERMISSIONS.CINE_VIEW,
      PERMISSIONS.CINE_CREATE,
      PERMISSIONS.CINE_EDIT,
      PERMISSIONS.CINE_DELETE,
      PERMISSIONS.CINE_EPISODE_CONFIG,
    ],
  },
  {
    key: 'app',
    label: '客户端功能',
    icon: 'mobile',
    permissions: [PERMISSIONS.APP_CINE_VIEW, PERMISSIONS.APP_CINE_PLAY],
  },
] as const;

export function isAdminRole(roleCode: RoleCode): boolean {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.CONTENT_ADMIN,
    ROLES.OPERATOR,
  ].includes(roleCode as any);
}

export function isAppRole(roleCode: RoleCode): boolean {
  return [ROLES.NORMAL_USER].includes(roleCode as any);
}

export function getRoleScope(roleCode: RoleCode): string {
  return ROLE_PERMISSIONS_MAP[roleCode]?.scope || '未知';
}

export function canDelete(roleCode: RoleCode): boolean {
  return [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN].includes(roleCode as any);
}

export function canEdit(roleCode: RoleCode): boolean {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.CONTENT_ADMIN,
    ROLES.OPERATOR,
  ].includes(roleCode as any);
}
