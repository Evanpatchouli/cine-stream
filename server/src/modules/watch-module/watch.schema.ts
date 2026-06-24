import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { HydratedDocument, Types } from 'mongoose';

export type WatchHistoryDocument = HydratedDocument<WatchHistory>;
export type CineCollectionDocument = HydratedDocument<CineCollection>;

@Schema({
  collection: 'watch_histories',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class WatchHistory {
  @Transform(({ value }) => value?.toString())
  _id?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Cine',
    required: true,
    index: true,
  })
  cine_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'EpisodeVideo',
    default: null,
  })
  episode_id: Types.ObjectId | null;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  })
  progress: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  position_seconds: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  duration_seconds: number;

  @Prop({
    type: Number,
    default: () => Date.now(),
    index: true,
  })
  last_watched_at: number;

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
  collection: 'cine_collections',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class CineCollection {
  @Transform(({ value }) => value?.toString())
  _id?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Cine',
    required: true,
    index: true,
  })
  cine_id: Types.ObjectId;

  @Prop({
    type: Number,
    default: () => Date.now(),
    index: true,
  })
  created_at: number;

  @Prop({
    type: Number,
    default: () => Date.now(),
  })
  updated_at: number;

  id: string;
}

export const WatchHistorySchema = SchemaFactory.createForClass(WatchHistory);
export const CineCollectionSchema = SchemaFactory.createForClass(CineCollection);

function normalizeId(_: unknown, ret: Record<string, any>) {
  ret.id = ret._id.toString();
  const { _id, __v, ...rest } = ret;
  return rest;
}

WatchHistorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: normalizeId,
});

CineCollectionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: normalizeId,
});

WatchHistorySchema.index(
  { user_id: 1, cine_id: 1, episode_id: 1 },
  { unique: true },
);
CineCollectionSchema.index({ user_id: 1, cine_id: 1 }, { unique: true });
