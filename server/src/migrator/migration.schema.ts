import { Schema, model, Document } from 'mongoose';

export interface IMigration extends Document {
  version: string;
  name: string;
  executed_at: number;
  execution_time: number; // 执行耗时（毫秒）
  status: 'success' | 'failed';
  error_message?: string;
}

const migrationSchema = new Schema<IMigration>(
  {
    version: {
      type: String,
      required: true,
      unique: true,  // 这里已经创建了索引
      comment: '迁移版本号，如 v1, v2',
    },
    name: {
      type: String,
      required: true,
      comment: '迁移名称描述',
    },
    executed_at: {
      type: Number,
      required: true,
      comment: '执行时间戳（秒）',
    },
    execution_time: {
      type: Number,
      required: true,
      comment: '执行耗时（毫秒）',
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
      comment: '执行状态',
    },
    error_message: {
      type: String,
      comment: '错误信息（如果失败）',
    },
  },
  {
    collection: 'migrations',
    timestamps: false,
  },
);

// 创建索引（version 已通过 unique: true 创建索引，无需重复）
migrationSchema.index({ executed_at: -1 });

export const MigrationModel = model<IMigration>('Migration', migrationSchema);
