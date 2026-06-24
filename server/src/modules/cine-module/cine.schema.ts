import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { HydratedDocument, Types } from 'mongoose';

export type CineDocument = HydratedDocument<Cine>;
export type EpisodeVideoDocument = HydratedDocument<EpisodeVideo>;

@Schema({
  collection: 'episode_videos',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class EpisodeVideo {
  @Transform(({ value }) => value?.toString())
  _id?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Cine',
    required: [true, '归属影视不能为空'],
    index: true,
  })
  cine_id: Types.ObjectId;

  @Prop({
    type: String,
    required: [true, '剧集名称不能为空'],
    trim: true,
    maxlength: [100, '剧集名称长度不能超过100个字符'],
  })
  name: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [1000, '简介长度不能超过1000个字符'],
    default: '',
  })
  description: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  duration: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  thumbnail: string;

  @Prop({
    type: String,
    required: [true, '视频文件地址不能为空'],
    trim: true,
  })
  file_path: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  file_url: string;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  sort_order: number;

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

  id: string;
}

@Schema({
  collection: 'cines',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Cine {
  @Transform(({ value }) => value?.toString())
  _id?: Types.ObjectId;

  @Prop({
    type: String,
    required: [true, '影视名称不能为空'],
    trim: true,
    maxlength: [100, '影视名称长度不能超过100个字符'],
    index: true,
  })
  name: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: [2000, '简介长度不能超过2000个字符'],
    default: '',
  })
  description: string;

  @Prop({
    type: [String],
    default: [],
  })
  genre: string[];

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  year: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  season: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  rating: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  poster: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  backdrop: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  badge: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  meta: string;

  @Prop({
    type: [String],
    default: [],
  })
  cast: string[];

  @Prop({
    type: [Types.ObjectId],
    ref: 'EpisodeVideo',
    default: [],
  })
  episode_ids: Types.ObjectId[];

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

  id: string;
  episodes?: EpisodeVideo[];
}

export const CineSchema = SchemaFactory.createForClass(Cine);
export const EpisodeVideoSchema = SchemaFactory.createForClass(EpisodeVideo);

function normalizeId(_: unknown, ret: Record<string, any>) {
  ret.id = ret._id.toString();
  const { _id, __v, ...rest } = ret;
  return rest;
}

CineSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: normalizeId,
});

EpisodeVideoSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: normalizeId,
});

CineSchema.index({ created_at: -1 });
EpisodeVideoSchema.index({ cine_id: 1, sort_order: 1 });
