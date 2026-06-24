import { toString } from '@/utils/mapper';
import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserModel } from './user.model';
import { RoleService } from '../role-module/role.service';
import { RoleDocument } from '../role-module/role.schema';
import { logger } from '@/common/logger';
import CustomError from '@/exception/CustomError';

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserRoleService {
  constructor(
    @Inject() private userModel: UserModel,
    @Inject() private roleService: RoleService,
    @Inject() private emitter: EventEmitter2,
  ) {}

  async pushRole(user_id: string, role_id: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    if (user.role_ids.map((i) => i.toString()).includes(role_id)) {
      throw new CustomError(
        `User(id: ${user_id}) already has this role(id=${role_id})`,
      );
    }
    if (!(await this.roleService.findById(role_id))) {
      throw new CustomError(`Role(id: ${role_id}) not found`);
    }
    await this.userModel.pushRole(user_id, role_id);
  }

  async pushRoleWithCode(user_id: string, role_code: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    const role = await this.roleService.findByRoleCode(role_code);
    if (!role) {
      throw new CustomError(`Role(code: ${role_code}) not found`);
    }
    if (user.role_ids.map((i) => i.toString()).includes(role.id)) {
      throw new CustomError(
        `User(id: ${user_id}) already has this role(code=${role_code})`,
      );
    }
    await this.userModel.pushRole(user_id, role.id);
  }

  async getRoles(
    user_id: string,
    options?: {
      withPermission?: boolean; // 是否联查权限
    },
  ): Promise<RoleDocument[]> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    const role_ids = user.role_ids.map(toString);
    const roles = await this.roleService.findByIds(role_ids, {
      withPermission: options?.withPermission,
    });

    return roles || [];
  }

  async getRoleCodes(user_id: string): Promise<string[]> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      return [];
    }
    const role_ids = user.role_ids.map(toString);
    const roles = await this.roleService.findByIds(role_ids);
    return roles.map((r) => r.role_code);
  }

  async assignNormalUserRole(user_id: string) {
    const role = await this.roleService.findByRoleCode('NORMAL_USER');
    if (!role) {
      throw new CustomError('Role not found');
    }
    await this.pushRole(user_id, role.id);
  }
}
