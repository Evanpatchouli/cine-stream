export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CONTENT_ADMIN: 'CONTENT_ADMIN',
  OPERATOR: 'OPERATOR',
  NORMAL_USER: 'NORMAL_USER',
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_METADATA = {
  [ROLES.SUPER_ADMIN]: {
    label: '超级管理员',
    description: '系统最高权限',
    color: '#ff4d4f',
    level: 0,
  },
  [ROLES.CONTENT_ADMIN]: {
    label: '内容管理员',
    description: '负责影视资源管理',
    color: '#1677ff',
    level: 1,
  },
  [ROLES.OPERATOR]: {
    label: '运营专员',
    description: '日常影视录入和剧集配置',
    color: '#722ed1',
    level: 2,
  },
  [ROLES.NORMAL_USER]: {
    label: '普通用户',
    description: '客户端观看用户',
    color: '#666666',
    level: 10,
  },
} as const;
