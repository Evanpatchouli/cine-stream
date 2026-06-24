import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoginLogDocument = HydratedDocument<LoginLog>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => Date.now(), // 存储为时间戳（毫秒）
  }, // 自动管理 createdAt 和 updatedAt
})
export class LoginLog {
  @Prop({
    type: String,
    required: [true, '登录时间不能为空'],
  })
  login_at: number;

  @Prop({
    type: String,
    default: '',
    comment: '最后登录IP',
  })
  login_ip: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'user_id不能为空'],
  })
  user_id: Types.ObjectId;

  // 自动生成字段
  id: string; // MongoDB 的 _id 会映射为 id
  createdAt: Date; // 来自 timestamps
  updatedAt: Date; // 来自 timestamps
}

export const LoginLogSchema = SchemaFactory.createForClass(LoginLog);
