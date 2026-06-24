export const Roles = {
  SUPER_ADMIN: {
    code: 'SUPER_ADMIN',
    name: '超级管理员',
    description: '系统最高权限管理员，拥有全部后台能力',
    is_system: true,
  },
  CONTENT_ADMIN: {
    code: 'CONTENT_ADMIN',
    name: '内容管理员',
    description: '负责影视资源和剧集维护',
    is_system: true,
  },
  OPERATOR: {
    code: 'OPERATOR',
    name: '运营专员',
    description: '负责日常影视录入和配置',
    is_system: true,
  },
  NORMAL_USER: {
    code: 'NORMAL_USER',
    name: '普通用户',
    description: '客户端观看用户',
    is_system: false,
  },
};

export type RoleCodes = keyof typeof Roles;
