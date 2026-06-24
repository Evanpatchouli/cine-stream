import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { Role } from '../role-module/role.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => Date.now(),
  },
  collection: 'users',
  toJSON: { virtuals: true }, // 启用虚拟字段的JSON序列化
  toObject: { virtuals: true },
})
export class User {
  @Transform(({ value }) => value?.toString())
  _id?: Types.ObjectId;

  @Prop({
    type: String,
    trim: true,
    maxlength: [100, 'openid长度不能超过100个字符'],
  })
  openid: string;

  @Prop({
    type: String,
    sparse: true,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入正确的手机号码'],
  })
  phone: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [100, '用户名长度不能超过100个字符'],
  })
  username: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [100, '密码长度不能超过100个字符'],
  })
  password: string;

  @Prop({
    type: String,
    trim: true,
    match: [
      /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/,
      '请输入正确的邮箱地址',
    ],
  })
  email: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [100, '昵称长度不能超过100个字符'],
  })
  nickname: string;

  @Prop({
    type: Number,
    enum: [0, 1],
    default: 1,
    comment: '状态：0-禁用，1-启用',
  })
  status: number;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Role',
    default: [],
  })
  role_ids: Types.ObjectId[];

  @Prop({
    type: Number,
    default: null,
  })
  register_at: number;

  @Prop({
    type: Number,
    default: null,
  })
  deleted_at: number;

  // 手动定义时间戳字段
  @Prop({
    type: Number,
    default: () => Date.now(),
  })
  created_at: number;

  @Prop({
    type: Number,
    default: () => Date.now(),
  })
  updated_at: number;

  // 自动映射的字段
  id: string;

  roles?: Role[];

  // 转换为 Date 对象的方法

  getRegisterAtDate(): Date | null {
    return this.register_at ? new Date(this.register_at * 1000) : null;
  }
  getCreatedAtDate(): Date {
    return new Date(this.created_at * 1000);
  }

  getUpdatedAtDate(): Date {
    return new Date(this.updated_at * 1000);
  }

  getDeletedAtDate(): Date | null {
    return this.deleted_at ? new Date(this.deleted_at * 1000) : null;
  }

  // 实例方法
  isActive(): boolean {
    return this.status === 1;
  }

  isDeleted(): boolean {
    return this.deleted_at !== null;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// 虚拟字段：关联的权限列表
UserSchema.virtual('roles', {
  ref: 'Role',
  localField: 'role_ids',
  foreignField: '_id',
  justOne: false,
});

// 在转换为JSON时，将 _id 转换为 id
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    const { _id, __v, ...rest } = ret;
    return rest;
  },
});

// 创建索引
UserSchema.index({ status: 1 });
UserSchema.index({ deleted_at: 1 });
UserSchema.index({ created_at: -1 });
UserSchema.index({ updated_at: -1 });
UserSchema.index({ last_login_at: -1 });

// 软删除查询中间件
UserSchema.pre('find', function () {
  this.where({ deleted_at: null });
});

UserSchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

UserSchema.pre('findOneAndUpdate', function () {
  this.where({ deleted_at: null });
});

UserSchema.pre('countDocuments', function () {
  this.where({ deleted_at: null });
});

// 静态方法
UserSchema.statics.findByOpenid = function (openid: string) {
  return this.findOne({ openid, deleted_at: null });
};

UserSchema.statics.findByPhone = function (phone: string) {
  return this.findOne({ phone, deleted_at: null });
};

UserSchema.statics.findActiveUsers = function () {
  return this.find({ status: 1, deleted_at: null }).sort({ created_at: -1 });
};

UserSchema.statics.softDelete = function (id: string | Types.ObjectId) {
  return this.findByIdAndUpdate(
    id,
    {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    },
    { new: true },
  );
};
