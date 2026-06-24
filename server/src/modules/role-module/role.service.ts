import { Maybe } from '@cine-stream/common';
import { DeleteResult, Model, QueryFilter, Types } from 'mongoose';
import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Role } from './role.schema';
import { PaginatedResult } from '@cine-stream/common';

@Injectable()
@Dependencies(getModelToken(Role.name))
export class RoleService {
  constructor(private model: Model<Role>) {
    this.model = model;
  }

  async create(
    role_code: string,
    role_name: string,
    etc?: {
      description: Maybe<string>;
      permission_ids: Maybe<Types.ObjectId[]>;
    },
  ) {
    const created = new this.model({
      role_code,
      role_name,
      ...(etc || {}),
    });
    return await created.save();
  }

  async findAll() {
    return this.model.find().exec();
  }

  async findPage(
    page: number,
    size: number,
    filter?: QueryFilter<Role>,
  ): Promise<PaginatedResult<Role>> {
    const [list, total] = await Promise.all([
      this.model
        .find(filter)
        .skip((page - 1) * size)
        .limit(size)
        .populate('permissions')
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      list,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findById(id: string, options?: { withPermission?: boolean }) {
    const query = this.model.findById(id);
    if (options?.withPermission) {
      query.populate('permissions');
    }
    return await query.exec();
  }

  async findByIds(ids: string[], options?: { withPermission?: boolean }) {
    const query = this.model.find({ _id: { $in: ids } });
    if (options?.withPermission) {
      query.populate('permissions');
    }
    return await query.exec();
  }

  async findByRoleCode(role_code: string) {
    return await this.model.findOne({ role_code }).exec();
  }

  async setPermissions(id: string, permission_ids: Types.ObjectId[]) {
    return this.model.updateOne({ id }, { permission_ids });
  }

  async pushPermission(id: string, permission_id: Types.ObjectId) {
    return this.model.updateOne(
      { id },
      { $push: { permission_ids: permission_id } },
    );
  }

  async removePermission(id: string, permission_id: Types.ObjectId) {
    return this.model.updateOne(
      { id },
      { $pull: { permission_ids: permission_id } },
    );
  }

  async cleanPermissions(id: string) {
    return this.model.updateOne({ id }, { $set: { permission_ids: [] } });
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.model.deleteOne({ id }).exec();
  }

  async findAllWithPermissionCodes() {
    return this.model.find().populate('permissions').exec();
  }
}
