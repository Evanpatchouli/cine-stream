import { Auth, Public, RoleIn, Roles } from '@decorators/auth.decorator';
import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import Resp from '@/common/models/Resp';
import type { Request } from 'express';
import { UserService } from '../user-module/user.service';
import { Role, RoleDocument } from '../role-module/role.schema';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { RoleService } from '../role-module/role.service';
import {
  buildPermissionTree,
  PermissionDocument,
} from '../permission-module/permission.schema';
import { ToBoolean, ToNumber } from '@/decorators/transform.decorator';
import { Tag } from '@/decorators/tag.decorator';
import { Todo } from '@/decorators/todo.decorator';
import { PaginatedResult } from '@cine-stream/common';
import { Deprecated } from '@/decorators/deprecated.decorator';

class QueryUserRoleParams {
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @ToBoolean()
  withPermission?: boolean; // 是否联查权限

  @IsOptional()
  @ToBoolean()
  withPermissionTree?: boolean; // 是否返回权限树
}

class QueryAllRolesParams {
  @IsOptional()
  @ToBoolean()
  withPermission?: boolean; // 是否联查权限
  @IsOptional()
  @ToBoolean()
  simplify?: boolean; // 是否简化返回结果
}

class QueryRolePageParams {
  @IsNotEmpty()
  @ToNumber()
  page: number;
  @IsNotEmpty()
  @ToNumber()
  size: number;
}

@Auth()
@Tag('角色管理')
@Controller('admin/role')
export class RoleController {
  constructor(
    @Inject()
    private userService: UserService,
    @Inject()
    private roleService: RoleService,
  ) { }

  @Public()
  @Get("/all")
  @Tag('查询所有角色')
  async queryAll(
    @Query() params: QueryAllRolesParams,
  ): Promise<Resp<Record<string, any>[]>> {
    const result = await (params.withPermission ? this.roleService.findAllWithPermissionCodes() : this.roleService.findAll());
    if (!params.simplify || !params.withPermission) {
      return Resp.success(result);
    }
    return Resp.success(result.map(simplifyRole));
  }


  @RoleIn('SUPER_ADMIN')
  @Get('/')
  async queryRolePage(
    @Query() params: QueryRolePageParams,
  ): Promise<Resp<PaginatedResult<SimplifiedRole>>> {
    const { list, ...result } = await this.roleService.findPage(params.page, params.size);
    return Resp.success({
      list: list.map(simplifyRole),
      ...result,
    });
  }

  @Deprecated('应当放到 user 模块')
  @Tag('查询用户角色')
  @Get('/queryUserRole')
  async queryUserRole(
    @Query() params: QueryUserRoleParams,
    @Req() req: Request,
  ): Promise<Resp<{ roles: RoleDocument[]; permission_tree?: any[] }>> {
    const { id: user_id, withPermission, withPermissionTree } = params;

    const result: RoleDocument[] | string = await this.userService.getRoles(
      user_id,
      { withPermission },
    );
    if (typeof result === 'string') {
      return Resp.badRequest(result);
    }
    const permission_tree =
      withPermission && withPermissionTree
        ? buildPermissionTree(result.map((item) => item.permissions).flat())
        : void 0;

    return Resp.success({
      roles: result,
      permission_tree,
    });
  }
}

type SimplifiedRole = Pick<Role, 'id' | 'role_code' | 'role_name' | 'description'> & {
  permissions: Pick<PermissionDocument, 'id' | 'perm_code' | 'perm_name' | 'description'>[]
};

function simplifyRole(
  role: RoleDocument & { permissions: PermissionDocument[] },
): SimplifiedRole {
  return {
    id: role.id,
    role_code: role.role_code,
    role_name: role.role_name,
    description: role.description,
    permissions: role.permissions.map((permission) => ({
      id: permission.id,
      perm_code: permission.perm_code,
      perm_name: permission.perm_name,
      description: permission.description,
    })),
  };
}
