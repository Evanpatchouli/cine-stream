import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Permission } from '../permission-module/permission.schema';

export type RoleDocument = HydratedDocument<Role>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => Date.now(), // 存储为时间戳（毫秒）
  }, // 自动管理 createdAt 和 updatedAt
  collection: 'roles', // 明确指定集合名
  toJSON: { virtuals: true }, // 启用虚拟字段的JSON序列化
  toObject: { virtuals: true },
})
export class Role {
  @Prop({
    type: String,
    required: [true, '角色编码不能为空'],
    unique: true,
    trim: true,
    maxlength: [50, '角色编码长度不能超过50个字符'],
  })
  role_code: string;

  @Prop({
    type: String,
    required: [true, '角色名称不能为空'],
    trim: true,
    maxlength: [50, '角色名称长度不能超过50个字符'],
  })
  role_name: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [255, '描述长度不能超过255个字符'],
    default: '',
  })
  description: string;

  @Prop({
    type: Number,
    enum: [0, 1],
    default: 1,
    comment: '状态：0-禁用，1-启用',
  })
  status: number;

  @Prop({
    type: Boolean,
    default: false,
    comment: '是否为系统角色：true-是，false-否',
  })
  is_system: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    comment: '排序，数字越小越靠前',
  })
  sort_order: number;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Permission',
    default: [],
  })
  permission_ids: Types.ObjectId[];

  // 软删除字段
  @Prop({
    type: Date,
    default: null,
  })
  deleted_at: Date;

  // 虚拟字段：关联的权限列表
  permissions?: Permission[];

  // 虚拟字段：关联的用户数量（如果需要）
  @Prop({
    type: Number,
    default: 0,
    select: false, // 默认不查询此字段
  })
  user_count?: number;

  // 自动生成字段
  id: string; // MongoDB 的 _id 会映射为 id
  createdAt: Date; // 来自 timestamps
  updatedAt: Date; // 来自 timestamps

  // 自定义方法
  isActive(): boolean {
    return this.status === 1;
  }

  isSystemRole(): boolean {
    return this.is_system;
  }

  hasPermission(permissionId: string | Types.ObjectId): boolean {
    return this.permission_ids.some(
      (id) => id.toString() === permissionId.toString(),
    );
  }
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// 创建索引
RoleSchema.index({ status: 1 });
RoleSchema.index({ is_system: 1 });
RoleSchema.index({ sort_order: 1 });
RoleSchema.index({ deleted_at: 1 });

// 软删除查询中间件
RoleSchema.pre('find', function () {
  this.where({ deleted_at: null });
});

RoleSchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

RoleSchema.pre('findOneAndUpdate', function () {
  this.where({ deleted_at: null });
});

// 虚拟字段：关联的权限列表
RoleSchema.virtual('permissions', {
  ref: 'Permission',
  localField: 'permission_ids',
  foreignField: '_id',
  justOne: false,
});

// 在转换为JSON时，将 _id 转换为 id
RoleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    const { _id, __v, ...rest } = ret;
    return rest;
  },
});

// 静态方法
RoleSchema.statics.findByRoleCode = function (roleCode: string) {
  return this.findOne({ role_code: roleCode, deleted_at: null });
};

RoleSchema.statics.findActiveRoles = function () {
  return this.find({ status: 1, deleted_at: null }).sort({ sort_order: 1 });
};

RoleSchema.statics.findSystemRoles = function () {
  return this.find({ is_system: true, deleted_at: null });
};

RoleSchema.statics.softDelete = function (id: string | Types.ObjectId) {
  return this.findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true });
};
