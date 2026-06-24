import { Model, QueryFilter } from 'mongoose';
import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { UserIdentity } from '@/types/user';
import { orNull } from '@/utils/value';
import { PaginatedResult } from '@cine-stream/common';

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserModel {
  constructor(private model: Model<User>) {
    this.model = model;
  }

  getModel() {
    return this.model;
  }

  async create(
    identity: Partial<UserIdentity> & { password?: string },
    ip: string,
    visit_at: number,
  ) {
    const created = new this.model({
      openid: orNull(identity.openid),
      phone: orNull(identity.phone),
      username: orNull(identity.username),
      email: orNull(identity.email),
      password: orNull(identity.password),
      last_login_ip: ip,
      last_login_at: visit_at,
      register_at: visit_at,
    });
    return await created.save();
  }

  async findAll() {
    return this.model.find().exec();
  }

  async findById(id: string) {
    return this.model.findById(id).exec();
  }

  async findByOpenid(openid: string) {
    return this.model.findOne({ openid }).exec();
  }

  async findByPhone(phone: string) {
    return this.model.findOne({ phone }).exec();
  }

  async findByPhoneAndPassword(phone: string, password: string) {
    return this.model.findOne({ phone, password }).exec();
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }

  async pushRole(openid: string, role_id: string) {
    return this.model
      .findOneAndUpdate({ openid }, { $push: { role_ids: role_id } })
      .exec();
  }

  async findByUsername(username: string) {
    return this.model.findOne({ username }).exec();
  }

  async findByUsernameAndPassword(username: string, password: string) {
    return this.model.findOne({ username, password }).exec();
  }

  async findPage(
    page: number,
    size: number,
    filter?: QueryFilter<User>,
  ): Promise<PaginatedResult<User>> {
    const [list, total] = await Promise.all([
      this.model
        .find(filter)
        .skip((page - 1) * size)
        .limit(size)
        .populate('roles')
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

  async updateById(id: string, data: Partial<User>) {
    return this.model.findByIdAndUpdate(id, data).exec();
  }
}
