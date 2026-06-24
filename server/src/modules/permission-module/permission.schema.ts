import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Exclude, Transform } from 'class-transformer';

export type PermissionDocument = HydratedDocument<Permission>;

export enum PermissionType {
  MENU = 1, // 菜单
  BUTTON = 2, // 按钮
  API = 3, // 接口
  DATA = 4, // 数据权限
}

export enum PermissionStatus {
  DISABLED = 0,
  ENABLED = 1,
}

export enum ApiMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  ALL = '*',
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => Date.now(), // 存储为时间戳（毫秒）
  },
  collection: 'permissions',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: true,
})
export class Permission {
  @Transform(({ value }) => value?.toString())
  _id?: Types.ObjectId;

  @Prop({
    type: String,
    required: [true, '权限编码不能为空'],
    unique: true,
    trim: true,
    uppercase: true, // 统一转为大写
    maxlength: [100, '权限编码长度不能超过100个字符'],
    match: [/^[A-Z_]+$/, '权限编码只能包含大写字母和下划线'],
  })
  perm_code: string;

  @Prop({
    type: String,
    required: [true, '权限名称不能为空'],
    trim: true,
    maxlength: [50, '权限名称长度不能超过50个字符'],
  })
  perm_name: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [255, '描述长度不能超过255个字符'],
    default: '',
  })
  description: string;

  @Prop({
    type: Number,
    enum: PermissionType,
    required: [true, '权限类型不能为空'],
    comment: '1-菜单，2-按钮，3-接口，4-数据',
  })
  type: PermissionType;

  @Prop({
    type: Types.ObjectId,
    ref: 'Permission',
    default: null,
    index: true,
  })
  parent_id: Types.ObjectId;

  @Prop({
    type: String,
    trim: true,
    maxlength: [100, '图标名称长度不能超过100个字符'],
    default: '',
  })
  icon: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [255, '路径长度不能超过255个字符'],
    default: '',
  })
  path: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [255, '组件路径长度不能超过255个字符'],
    default: '',
  })
  component: string;

  @Prop({
    type: String,
    enum: ApiMethod,
    default: null,
  })
  api_method: ApiMethod;

  @Prop({
    type: String,
    trim: true,
    maxlength: [255, 'API路径长度不能超过255个字符'],
    default: '',
  })
  api_path: string;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    comment: '排序，数字越小越靠前',
  })
  sort_order: number;

  @Prop({
    type: Number,
    enum: PermissionStatus,
    default: PermissionStatus.ENABLED,
    comment: '状态：0-禁用，1-启用',
  })
  status: PermissionStatus;

  @Prop({
    type: Boolean,
    default: true,
    comment: '是否显示在菜单中',
  })
  is_visible: boolean;

  @Prop({
    type: Boolean,
    default: false,
    comment: '是否为外部链接',
  })
  is_external: boolean;

  @Prop({
    type: String,
    default: '',
    comment: '外部链接地址',
  })
  external_url: string;

  @Prop({
    type: Boolean,
    default: false,
    comment: '是否缓存组件',
  })
  keep_alive: boolean;

  @Prop({
    type: Boolean,
    default: false,
    comment: '是否为系统内置权限',
  })
  is_system: boolean;

  @Prop({
    type: String,
    default: '',
    comment: '权限标签，用于分类',
  })
  tag: string;

  @Prop({
    type: Date,
    default: null,
  })
  deleted_at: Date;

  // 虚拟字段：子权限列表
  children?: Permission[];

  // 虚拟字段：父权限
  parent?: Permission;

  // 虚拟字段：是否有子权限
  has_children?: boolean;

  // 自动生成字段
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // 实例方法
  isMenu(): boolean {
    return this.type === PermissionType.MENU;
  }

  isButton(): boolean {
    return this.type === PermissionType.BUTTON;
  }

  isApi(): boolean {
    return this.type === PermissionType.API;
  }

  isData(): boolean {
    return this.type === PermissionType.DATA;
  }

  isActive(): boolean {
    return this.status === PermissionStatus.ENABLED;
  }

  getFullPath(): string {
    if (this.isApi() && this.api_path) {
      return `${this.api_method || 'ALL'} ${this.api_path}`;
    }
    return this.path || '';
  }
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// 创建索引
PermissionSchema.index({ type: 1 });
PermissionSchema.index({ status: 1 });
PermissionSchema.index({ sort_order: 1 });
PermissionSchema.index({ tag: 1 });
PermissionSchema.index({ deleted_at: 1 });
// 复合索引
PermissionSchema.index({ type: 1, status: 1 });
PermissionSchema.index({ parent_id: 1, status: 1 });
PermissionSchema.index({ parent_id: 1, sort_order: 1 });

// 软删除查询中间件
PermissionSchema.pre('find', function () {
  this.where({ deleted_at: null });
});

PermissionSchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

PermissionSchema.pre('findOneAndUpdate', function () {
  this.where({ deleted_at: null });
});

PermissionSchema.pre('countDocuments', function () {
  this.where({ deleted_at: null });
});

// 虚拟字段：子权限列表
PermissionSchema.virtual('children', {
  ref: 'Permission',
  localField: '_id',
  foreignField: 'parent_id',
  justOne: false,
  options: { sort: { sort_order: 1 } },
});

// 虚拟字段：父权限
PermissionSchema.virtual('parent', {
  ref: 'Permission',
  localField: 'parent_id',
  foreignField: '_id',
  justOne: true,
});

// 虚拟字段：是否有子权限
PermissionSchema.virtual('has_children').get(function () {
  // 这个字段需要在查询时手动填充
  return this.children && this.children.length > 0;
});

// 在转换为JSON时，将 _id 转换为 id
PermissionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    const { _id, __v, ...rest } = ret;
    return rest;
  },
});

// 静态方法
PermissionSchema.statics.findByPermCode = function (permCode: string) {
  return this.findOne({ perm_code: permCode.toUpperCase(), deleted_at: null });
};

PermissionSchema.statics.findMenus = function () {
  return this.find({
    type: PermissionType.MENU,
    status: PermissionStatus.ENABLED,
    deleted_at: null,
  }).sort({ sort_order: 1 });
};

PermissionSchema.statics.findApis = function () {
  return this.find({
    type: PermissionType.API,
    status: PermissionStatus.ENABLED,
    deleted_at: null,
  });
};

PermissionSchema.statics.findByType = function (type: PermissionType) {
  return this.find({
    type,
    status: PermissionStatus.ENABLED,
    deleted_at: null,
  }).sort({ sort_order: 1 });
};

PermissionSchema.statics.findTree = async function () {
  const permissions = await this.find({
    deleted_at: null,
    status: PermissionStatus.ENABLED,
  }).sort({ sort_order: 1, createdAt: 1 });

  return buildPermissionTree(permissions);
};

PermissionSchema.statics.findByParent = function (
  parentId: Types.ObjectId | string | null,
) {
  const queryParentId = parentId
    ? new Types.ObjectId(parentId.toString())
    : null;
  return this.find({
    parent_id: queryParentId,
    status: PermissionStatus.ENABLED,
    deleted_at: null,
  }).sort({ sort_order: 1 });
};

PermissionSchema.statics.softDelete = function (id: string | Types.ObjectId) {
  return this.findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true });
};

// 构建权限树的辅助函数
export function buildPermissionTree(
  permissions: any[],
  parentId: Types.ObjectId | null = null,
): any[] {
  return permissions
    .filter((permission) => {
      if (parentId === null) {
        return !permission.parent_id;
      }
      return (
        permission.parent_id &&
        permission.parent_id.toString() === parentId.toString()
      );
    })
    .map((permission) => {
      const children = buildPermissionTree(permissions, permission._id);
      return {
        ...permission.toObject(),
        children: children.length > 0 ? children : void 0,
        has_children: children.length > 0,
      };
    });
}
