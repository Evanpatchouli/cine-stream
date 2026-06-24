import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserModel } from './user.model';
import { UserRoleService } from './user.service.role';
import { QueryFilter } from 'mongoose';
import { PaginatedResult } from '@cine-stream/common';
import CustomError from '@/exception/CustomError';
import { RESET_PASSWORD } from '@/constants/user';
import { vofy } from '@/utils/vofy';
import { toObjectId } from '@/utils/mapper';

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserManageService {
  constructor(
    @Inject() private userModel: UserModel,
    @Inject() private emitter: EventEmitter2,
    @Inject() private userRoleService: UserRoleService,
  ) { }

  /**
   * 分页查询
   */
  async findPage(
    page: number,
    pageSize: number,
    filter?: QueryFilter<User>,
  ): Promise<PaginatedResult<User>> {
    const result = await this.userModel.findPage(page, pageSize);
    return result;
  }

  async createUser(dto: {
    phone: string;
    password: string;
    roleIds?: string[];
  }): Promise<User> {
    const exists = await this.userModel.findByPhone(dto.phone);
    if (exists) {
      throw new CustomError('手机号已存在');
    }

    const user = await this.userModel.create(
      {
        phone: dto.phone,
        password: dto.password,
      },
      '',
      Date.now(),
    );

    if (dto.roleIds?.length) {
      await this.userModel.updateById(user.id, {
        role_ids: dto.roleIds.map(toObjectId),
      });
    } else {
      await this.userRoleService.assignNormalUserRole(user.id);
    }

    return this.getUserDetail(user.id);
  }

  async getUserDetail(user_id: string): Promise<User> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    return user;
  }

  async toggleUserStatus(user_id: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    await this.userModel.updateById(user_id, { status: user.status === 1 ? 0 : 1 });
  }

  async updatePhone(user_id: string, phone: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    await this.userModel.updateById(user_id, { phone });
  }

  async updateWchat(user_id: string, openid: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    await this.userModel.updateById(user_id, { openid });
  }

  async updateEmail(user_id: string, email: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    await this.userModel.updateById(user_id, { email });
  }

  async updateRoles(user_id: string, role_ids: string[]): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    await this.userModel.updateById(user_id, { role_ids: role_ids.map(toObjectId) });
  }

  async resetPassword(user_id: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    await this.userModel.updateById(user_id, { password: RESET_PASSWORD });
  }

  async deleteUser(user_id: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    await this.userModel.updateById(user_id, { deleted_at: Date.now() });
  }

  async restoreUser(user_id: string): Promise<void> {
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new CustomError(`User(id: ${user_id}) not found`);
    }
    await this.userModel.updateById(user_id, { deleted_at: null as any });
  }
}
