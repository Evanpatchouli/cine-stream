import { Auth, Public, RoleIn, Roles } from '@decorators/auth.decorator';
import { Controller, Get, Inject, Post, Query, Req } from '@nestjs/common';
import Resp from '../../common/models/Resp';
import type { Request } from 'express';
import { UserService } from '../user-module/user.service';
import { RoleDocument } from '../role-module/role.schema';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { RoleService } from '../role-module/role.service';
import { buildPermissionTree } from '../permission-module/permission.schema';
import { ToBoolean } from '../../decorators/transform.decorator';
import { Tag } from '../../decorators/tag.decorator';
import { Todo } from '../../decorators/todo.decorator';
import cache, { CacheInfo } from '@/cache';

@Auth()
@Tag('缓存管理')
@Controller('admin/cache')
export class CacheController {
  constructor() {}

  @RoleIn('SUPER_ADMIN')
  @Post('/persist')
  @Tag('执行缓存持久化')
  persist(): Resp<void> {
    cache.persist();
    return Resp.success();
  }

  @RoleIn('SUPER_ADMIN')
  @Get()
  @Tag('查询缓存情况')
  query(): Resp<CacheInfo> {
    return Resp.success(cache.getInfo());
  }
}
