import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { RoleSchema } from '../modules/role-module/role.schema';
import { UserSchema } from '../modules/user-module/user.schema';
import {
  ApiMethod,
  PermissionSchema,
  PermissionStatus,
  PermissionType,
} from '../modules/permission-module/permission.schema';
import { ADMIN_USER_ID } from '@/constants/user';

interface PermissionSeed {
  temp_id: string;
  perm_code: string;
  perm_name: string;
  type: PermissionType;
  parent_temp_id?: string | null;
  icon?: string;
  path?: string;
  component?: string;
  api_method?: ApiMethod;
  api_path?: string;
  description?: string;
  sort_order: number;
  is_system: boolean;
  is_visible?: boolean;
  tag?: string;
}

interface RoleSeed {
  role_code: string;
  role_name: string;
  description: string;
  is_system: boolean;
  sort_order: number;
  permission_codes: string[];
}

const permissions: PermissionSeed[] = [
  {
    temp_id: 'SYSTEM',
    perm_code: 'SYSTEM',
    perm_name: '系统管理',
    type: PermissionType.MENU,
    parent_temp_id: null,
    icon: 'setting',
    path: '/system',
    component: 'Layout',
    sort_order: 100,
    is_system: true,
    tag: 'system',
  },
  {
    temp_id: 'SYSTEM_USER',
    perm_code: 'SYSTEM_USER',
    perm_name: '用户管理',
    type: PermissionType.MENU,
    parent_temp_id: 'SYSTEM',
    icon: 'user',
    path: '/system/user',
    component: 'system/user/index',
    sort_order: 1,
    is_system: true,
    tag: 'system',
  },
  {
    temp_id: 'SYSTEM_USER_VIEW',
    perm_code: 'SYSTEM_USER_VIEW',
    perm_name: '查看用户',
    type: PermissionType.BUTTON,
    parent_temp_id: 'SYSTEM_USER',
    sort_order: 1,
    is_system: true,
    tag: 'system',
  },
  {
    temp_id: 'SYSTEM_USER_CREATE',
    perm_code: 'SYSTEM_USER_CREATE',
    perm_name: '新增用户',
    type: PermissionType.BUTTON,
    parent_temp_id: 'SYSTEM_USER',
    sort_order: 2,
    is_system: true,
    tag: 'system',
  },
  {
    temp_id: 'SYSTEM_USER_EDIT',
    perm_code: 'SYSTEM_USER_EDIT',
    perm_name: '编辑用户',
    type: PermissionType.BUTTON,
    parent_temp_id: 'SYSTEM_USER',
    sort_order: 3,
    is_system: true,
    tag: 'system',
  },
  {
    temp_id: 'SYSTEM_USER_DISABLE',
    perm_code: 'SYSTEM_USER_DISABLE',
    perm_name: '禁用用户',
    type: PermissionType.BUTTON,
    parent_temp_id: 'SYSTEM_USER',
    sort_order: 4,
    is_system: true,
    tag: 'system',
  },
  {
    temp_id: 'API_SYSTEM_USER_LIST',
    perm_code: 'API_SYSTEM_USER_LIST',
    perm_name: '查询用户列表',
    type: PermissionType.API,
    api_method: ApiMethod.GET,
    api_path: '/api/admin/user-manage',
    parent_temp_id: 'SYSTEM_USER_VIEW',
    sort_order: 1,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'API_SYSTEM_USER_CREATE',
    perm_code: 'API_SYSTEM_USER_CREATE',
    perm_name: '新增用户',
    type: PermissionType.API,
    api_method: ApiMethod.POST,
    api_path: '/api/admin/user-manage',
    parent_temp_id: 'SYSTEM_USER_CREATE',
    sort_order: 2,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'API_SYSTEM_USER_UPDATE',
    perm_code: 'API_SYSTEM_USER_UPDATE',
    perm_name: '更新用户',
    type: PermissionType.API,
    api_method: ApiMethod.PUT,
    api_path: '/api/admin/user-manage/:id',
    parent_temp_id: 'SYSTEM_USER_EDIT',
    sort_order: 3,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'CINE',
    perm_code: 'CINE',
    perm_name: '影视资源',
    type: PermissionType.MENU,
    parent_temp_id: null,
    icon: 'video-camera',
    path: '/cine',
    component: 'cine/index',
    sort_order: 200,
    is_system: true,
    tag: 'cine',
  },
  {
    temp_id: 'CINE_MANAGE',
    perm_code: 'CINE_MANAGE',
    perm_name: '影视管理',
    type: PermissionType.MENU,
    parent_temp_id: 'CINE',
    icon: 'video-camera',
    path: '/cine',
    component: 'cine/index',
    sort_order: 1,
    is_system: true,
    tag: 'cine',
  },
  {
    temp_id: 'CINE_VIEW',
    perm_code: 'CINE_VIEW',
    perm_name: '查看影视',
    type: PermissionType.BUTTON,
    parent_temp_id: 'CINE_MANAGE',
    sort_order: 1,
    is_system: true,
    tag: 'cine',
  },
  {
    temp_id: 'CINE_CREATE',
    perm_code: 'CINE_CREATE',
    perm_name: '新增影视',
    type: PermissionType.BUTTON,
    parent_temp_id: 'CINE_MANAGE',
    sort_order: 2,
    is_system: true,
    tag: 'cine',
  },
  {
    temp_id: 'CINE_EDIT',
    perm_code: 'CINE_EDIT',
    perm_name: '编辑影视',
    type: PermissionType.BUTTON,
    parent_temp_id: 'CINE_MANAGE',
    sort_order: 3,
    is_system: true,
    tag: 'cine',
  },
  {
    temp_id: 'CINE_DELETE',
    perm_code: 'CINE_DELETE',
    perm_name: '删除影视',
    type: PermissionType.BUTTON,
    parent_temp_id: 'CINE_MANAGE',
    sort_order: 4,
    is_system: true,
    tag: 'cine',
  },
  {
    temp_id: 'CINE_EPISODE_CONFIG',
    perm_code: 'CINE_EPISODE_CONFIG',
    perm_name: '配置剧集',
    type: PermissionType.BUTTON,
    parent_temp_id: 'CINE_MANAGE',
    sort_order: 5,
    is_system: true,
    tag: 'cine',
  },
  {
    temp_id: 'API_CINE_LIST',
    perm_code: 'API_CINE_LIST',
    perm_name: '查询影视',
    type: PermissionType.API,
    api_method: ApiMethod.GET,
    api_path: '/api/admin/cines',
    parent_temp_id: 'CINE_VIEW',
    sort_order: 1,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'API_CINE_CREATE',
    perm_code: 'API_CINE_CREATE',
    perm_name: '创建影视',
    type: PermissionType.API,
    api_method: ApiMethod.POST,
    api_path: '/api/admin/cines',
    parent_temp_id: 'CINE_CREATE',
    sort_order: 2,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'API_CINE_UPDATE',
    perm_code: 'API_CINE_UPDATE',
    perm_name: '更新影视',
    type: PermissionType.API,
    api_method: ApiMethod.PUT,
    api_path: '/api/admin/cines/:id',
    parent_temp_id: 'CINE_EDIT',
    sort_order: 3,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'API_CINE_DELETE',
    perm_code: 'API_CINE_DELETE',
    perm_name: '删除影视',
    type: PermissionType.API,
    api_method: ApiMethod.DELETE,
    api_path: '/api/admin/cines/:id',
    parent_temp_id: 'CINE_DELETE',
    sort_order: 4,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'API_CINE_EPISODE_CONFIG',
    perm_code: 'API_CINE_EPISODE_CONFIG',
    perm_name: '配置剧集',
    type: PermissionType.API,
    api_method: ApiMethod.PUT,
    api_path: '/api/admin/cines/:id/episodes',
    parent_temp_id: 'CINE_EPISODE_CONFIG',
    sort_order: 5,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'API_CINE_MEDIA_FILES',
    perm_code: 'API_CINE_MEDIA_FILES',
    perm_name: '选择服务器视频文件',
    type: PermissionType.API,
    api_method: ApiMethod.GET,
    api_path: '/api/admin/cines/media/files',
    parent_temp_id: 'CINE_EPISODE_CONFIG',
    sort_order: 6,
    is_system: true,
    tag: 'api',
  },
  {
    temp_id: 'APP_CINE_VIEW',
    perm_code: 'APP_CINE_VIEW',
    perm_name: '客户端查看影视',
    type: PermissionType.BUTTON,
    parent_temp_id: null,
    sort_order: 1000,
    is_system: false,
    tag: 'app',
  },
  {
    temp_id: 'APP_CINE_PLAY',
    perm_code: 'APP_CINE_PLAY',
    perm_name: '客户端播放影视',
    type: PermissionType.BUTTON,
    parent_temp_id: 'APP_CINE_VIEW',
    sort_order: 1001,
    is_system: false,
    tag: 'app',
  },
];

const roles: RoleSeed[] = [
  {
    role_code: 'SUPER_ADMIN',
    role_name: '超级管理员',
    description: '系统最高权限，拥有所有权限',
    is_system: true,
    sort_order: 1,
    permission_codes: permissions.map((permission) => permission.perm_code),
  },
  {
    role_code: 'CONTENT_ADMIN',
    role_name: '内容管理员',
    description: '负责影视资源和剧集维护',
    is_system: true,
    sort_order: 2,
    permission_codes: [
      'CINE',
      'CINE_MANAGE',
      'CINE_VIEW',
      'CINE_CREATE',
      'CINE_EDIT',
      'CINE_DELETE',
      'CINE_EPISODE_CONFIG',
      'API_CINE_LIST',
      'API_CINE_CREATE',
      'API_CINE_UPDATE',
      'API_CINE_DELETE',
      'API_CINE_EPISODE_CONFIG',
      'API_CINE_MEDIA_FILES',
    ],
  },
  {
    role_code: 'OPERATOR',
    role_name: '运营专员',
    description: '负责日常影视录入和剧集配置',
    is_system: true,
    sort_order: 3,
    permission_codes: [
      'CINE',
      'CINE_MANAGE',
      'CINE_VIEW',
      'CINE_CREATE',
      'CINE_EDIT',
      'CINE_EPISODE_CONFIG',
      'API_CINE_LIST',
      'API_CINE_CREATE',
      'API_CINE_UPDATE',
      'API_CINE_EPISODE_CONFIG',
      'API_CINE_MEDIA_FILES',
    ],
  },
  {
    role_code: 'NORMAL_USER',
    role_name: '普通用户',
    description: '客户端观看用户',
    is_system: false,
    sort_order: 10,
    permission_codes: ['APP_CINE_VIEW', 'APP_CINE_PLAY'],
  },
];

function sortByHierarchy(seeds: PermissionSeed[]): PermissionSeed[] {
  const tempIdMap = new Map(seeds.map((seed) => [seed.temp_id, seed]));
  const visited = new Set<string>();
  const result: PermissionSeed[] = [];

  function visit(seed: PermissionSeed) {
    if (visited.has(seed.temp_id)) {
      return;
    }

    if (seed.parent_temp_id && tempIdMap.has(seed.parent_temp_id)) {
      visit(tempIdMap.get(seed.parent_temp_id)!);
    }

    visited.add(seed.temp_id);
    result.push(seed);
  }

  seeds.forEach((seed) => visit(seed));
  return result;
}

async function initializePermissions(permissionModel: any) {
  const tempIdToObjectId = new Map<string, Types.ObjectId>();

  for (const seed of sortByHierarchy(permissions)) {
    const parent_id = seed.parent_temp_id
      ? tempIdToObjectId.get(seed.parent_temp_id) || null
      : null;
    const permission = await permissionModel.create({
      perm_code: seed.perm_code,
      perm_name: seed.perm_name,
      type: seed.type,
      parent_id,
      description: seed.description || '',
      icon: seed.icon || '',
      path: seed.path || '',
      component: seed.component || '',
      api_method: seed.api_method || null,
      api_path: seed.api_path || '',
      sort_order: seed.sort_order,
      status: PermissionStatus.ENABLED,
      is_system: seed.is_system,
      is_visible: seed.is_visible !== false,
      tag: seed.tag || '',
    });

    tempIdToObjectId.set(seed.temp_id, permission._id);
    console.log(`✅ 创建权限: ${seed.perm_code}`);
  }

  return tempIdToObjectId;
}

export async function v1() {
  const PermissionModel = mongoose.model('Permission', PermissionSchema);
  const RoleModel = mongoose.model('Role', RoleSchema);
  const UserModel = mongoose.model('User', UserSchema);

  await PermissionModel.deleteMany({});
  await RoleModel.deleteMany({});
  console.log('🗑️ 已清空现有权限和角色数据');

  const permCodeToId = await initializePermissions(PermissionModel);

  for (const roleData of roles) {
    const permissionIds = roleData.permission_codes
      .map((code) => permCodeToId.get(code))
      .filter((id) => id !== undefined);

    await new RoleModel({
      ...roleData,
      status: 1,
      permission_ids: permissionIds,
      created_at: Date.now(),
      updated_at: Date.now(),
    }).save();

    console.log(`✅ 已创建角色: ${roleData.role_name}`);
  }

  const superAdminRole = await RoleModel.findOne({
    role_code: 'SUPER_ADMIN',
  });
  const defaultAdminUser = await UserModel.findOne({
    _id: ADMIN_USER_ID,
  });

  if (superAdminRole && !defaultAdminUser) {
    await new UserModel({
      _id: ADMIN_USER_ID,
      nickname: '超级管理员',
      phone: '19157691370',
      username: 'root',
      password: 'root',
      status: 1,
      role_ids: [superAdminRole._id],
      register_at: Date.now(),
      created_at: Date.now(),
      updated_at: Date.now(),
    }).save();
    console.log('✅ 已创建默认管理员用户 root/root');
  }

  console.log('\n🎉 CineStream 权限数据初始化完成');
}
