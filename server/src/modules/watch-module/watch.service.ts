import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResult } from '@cine-stream/common';
import {
  Cine,
  CineDocument,
  EpisodeVideo,
  EpisodeVideoDocument,
} from '../cine-module/cine.schema';
import { QueryCollectionPageDto, RecordWatchHistoryDto } from './dto';
import {
  CineCollection,
  CineCollectionDocument,
  WatchHistory,
  WatchHistoryDocument,
} from './watch.schema';
import { normalizeWatchProgressPayload } from './watch-progress';

@Injectable()
export class WatchService {
  constructor(
    @InjectModel(WatchHistory.name)
    private readonly historyModel: Model<WatchHistoryDocument>,
    @InjectModel(CineCollection.name)
    private readonly collectionModel: Model<CineCollectionDocument>,
    @InjectModel(Cine.name)
    private readonly cineModel: Model<CineDocument>,
    @InjectModel(EpisodeVideo.name)
    private readonly episodeModel: Model<EpisodeVideoDocument>,
  ) {}

  async listHistory(
    userId: string,
    pageInput?: number,
    sizeInput?: number,
  ): Promise<PaginatedResult<Record<string, any>>> {
    const userObjectId = this.toObjectId(userId, '用户 id 无效');
    const { page, size } = this.resolvePageParams(pageInput, sizeInput, 20, 50);
    const filter = { user_id: userObjectId };
    const [histories, total] = await Promise.all([
      this.historyModel
        .find(filter)
        .sort({ last_watched_at: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .exec(),
      this.historyModel.countDocuments(filter).exec(),
    ]);

    return {
      list: await this.hydrateWatchItems(histories),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async listHistoryByCine(
    userId: string,
    cineId: string,
  ): Promise<Record<string, any>[]> {
    const userObjectId = this.toObjectId(userId, '用户 id 无效');
    const cineObjectId = this.toObjectId(cineId, '影视 id 无效');
    await this.assertCine(cineObjectId);

    const histories = await this.historyModel
      .find({
        user_id: userObjectId,
        cine_id: cineObjectId,
      })
      .sort({ last_watched_at: -1 })
      .limit(500)
      .exec();

    return this.hydrateWatchItems(histories);
  }

  async recordHistory(
    userId: string,
    dto: RecordWatchHistoryDto,
  ): Promise<Record<string, any>> {
    const userObjectId = this.toObjectId(userId, '用户 id 无效');
    const cineObjectId = this.toObjectId(dto.cine_id, '影视 id 无效');
    const episodeObjectId = dto.episode_id
      ? this.toObjectId(dto.episode_id, '剧集 id 无效')
      : null;

    await this.assertCine(cineObjectId);
    if (episodeObjectId) {
      await this.assertEpisode(cineObjectId, episodeObjectId);
    }

    const now = Date.now();
    const normalized = normalizeWatchProgressPayload(dto);
    const history = await this.historyModel
      .findOneAndUpdate(
        {
          user_id: userObjectId,
          cine_id: cineObjectId,
          episode_id: episodeObjectId,
        },
        {
          $set: {
            progress: normalized.progress,
            position_seconds: normalized.position_seconds,
            duration_seconds: normalized.duration_seconds,
            last_watched_at: now,
            updated_at: now,
          },
          $setOnInsert: {
            created_at: now,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();

    const [result] = await this.hydrateWatchItems([history]);
    return result;
  }

  async removeHistory(userId: string, historyId: string): Promise<void> {
    const userObjectId = this.toObjectId(userId, '用户 id 无效');
    const historyObjectId = this.toObjectId(historyId, '观看记录 id 无效');
    await this.historyModel
      .deleteOne({ _id: historyObjectId, user_id: userObjectId })
      .exec();
  }

  async listCollections(
    userId: string,
    query: QueryCollectionPageDto = {},
  ): Promise<PaginatedResult<Record<string, any>>> {
    const userObjectId = this.toObjectId(userId, '用户 id 无效');
    const { page, size } = this.resolvePageParams(
      query.page,
      query.size,
      100,
      100,
    );
    const cineIds = await this.resolveCollectionCineIds(userObjectId, query);

    if (cineIds && cineIds.length === 0) {
      return {
        list: [],
        total: 0,
        page,
        size,
        totalPages: 0,
      };
    }

    const filter: Record<string, any> = { user_id: userObjectId };
    if (cineIds) {
      filter.cine_id = { $in: cineIds };
    }

    const [collections, total] = await Promise.all([
      this.collectionModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .exec(),
      this.collectionModel.countDocuments(filter).exec(),
    ]);

    return {
      list: await this.hydrateCollectionItems(collections),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async addCollection(
    userId: string,
    cineId: string,
  ): Promise<Record<string, any>> {
    const userObjectId = this.toObjectId(userId, '用户 id 无效');
    const cineObjectId = this.toObjectId(cineId, '影视 id 无效');
    await this.assertCine(cineObjectId);

    const now = Date.now();
    const collection = await this.collectionModel
      .findOneAndUpdate(
        { user_id: userObjectId, cine_id: cineObjectId },
        {
          $set: { updated_at: now },
          $setOnInsert: { created_at: now },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();

    const [result] = await this.hydrateCollectionItems([collection]);
    return result;
  }

  async removeCollection(userId: string, cineId: string): Promise<void> {
    const userObjectId = this.toObjectId(userId, '用户 id 无效');
    const cineObjectId = this.toObjectId(cineId, '影视 id 无效');
    await this.collectionModel
      .deleteOne({ user_id: userObjectId, cine_id: cineObjectId })
      .exec();
  }

  async getOverview(userId: string): Promise<{
    watched_count: number;
    saved_count: number;
  }> {
    const userObjectId = this.toObjectId(userId, '用户 id 无效');
    const [watchedCount, savedCount] = await Promise.all([
      this.historyModel.countDocuments({ user_id: userObjectId }).exec(),
      this.collectionModel.countDocuments({ user_id: userObjectId }).exec(),
    ]);

    return {
      watched_count: watchedCount,
      saved_count: savedCount,
    };
  }

  private async hydrateWatchItems(
    histories: WatchHistoryDocument[],
  ): Promise<Record<string, any>[]> {
    const cineMap = await this.getCineMap(
      histories.map((item) => item.cine_id),
    );
    const episodeMap = await this.getEpisodeMap(
      histories
        .map((item) => item.episode_id)
        .filter((id): id is Types.ObjectId => Boolean(id)),
    );

    return histories.map((item) => {
      const data = item.toJSON();
      const normalized = normalizeWatchProgressPayload(data);
      const cineId = item.cine_id.toString();
      const episodeId = item.episode_id?.toString() || null;
      return {
        ...data,
        progress: normalized.progress,
        position_seconds: normalized.position_seconds,
        duration_seconds: normalized.duration_seconds,
        user_id: item.user_id.toString(),
        cine_id: cineId,
        episode_id: episodeId,
        cine: cineMap.get(cineId) || null,
        episode: episodeId ? episodeMap.get(episodeId) || null : null,
      };
    });
  }

  private async hydrateCollectionItems(
    collections: CineCollectionDocument[],
  ): Promise<Record<string, any>[]> {
    const cineMap = await this.getCineMap(
      collections.map((item) => item.cine_id),
    );

    return collections.map((item) => {
      const data = item.toJSON();
      const cineId = item.cine_id.toString();
      return {
        ...data,
        user_id: item.user_id.toString(),
        cine_id: cineId,
        cine: cineMap.get(cineId) || null,
      };
    });
  }

  private async resolveCollectionCineIds(
    userObjectId: Types.ObjectId,
    query: QueryCollectionPageDto,
  ): Promise<Types.ObjectId[] | null> {
    const filters: Array<Set<string>> = [];
    const cineFilter: Record<string, any> = {};
    const genre = query.genre?.trim();

    if (genre) {
      cineFilter.genre = genre;
    }

    if (query.status === 'downloaded') {
      cineFilter.badge = '已下载';
    }

    if (Object.keys(cineFilter).length) {
      const cines = await this.cineModel.find(cineFilter, { _id: 1 }).exec();
      filters.push(new Set(cines.map((cine) => cine.id)));
    }

    if (query.status === 'watching') {
      const histories = await this.historyModel
        .find(
          {
            user_id: userObjectId,
            progress: { $gt: 0, $lt: 100 },
          },
          { cine_id: 1 },
        )
        .exec();
      filters.push(
        new Set(histories.map((history) => history.cine_id.toString())),
      );
    }

    if (!filters.length) {
      return null;
    }

    const first = filters[0]!;
    const rest = filters.slice(1);
    const matchedIds = [...first].filter((id) =>
      rest.every((filter) => filter.has(id)),
    );
    return matchedIds.map((id) => Types.ObjectId.createFromHexString(id));
  }

  private async getCineMap(ids: Types.ObjectId[]) {
    const uniqueIds = this.uniqueIds(ids);
    const cines = uniqueIds.length
      ? await this.cineModel.find({ _id: { $in: uniqueIds } }).exec()
      : [];
    return new Map(cines.map((cine) => [cine.id, cine.toJSON()]));
  }

  private async getEpisodeMap(ids: Types.ObjectId[]) {
    const uniqueIds = this.uniqueIds(ids);
    const episodes = uniqueIds.length
      ? await this.episodeModel.find({ _id: { $in: uniqueIds } }).exec()
      : [];
    return new Map(episodes.map((episode) => [episode.id, episode.toJSON()]));
  }

  private uniqueIds(ids: Types.ObjectId[]): Types.ObjectId[] {
    const map = new Map(ids.map((id) => [id.toString(), id]));
    return [...map.values()];
  }

  private resolvePageParams(
    pageInput: number | undefined,
    sizeInput: number | undefined,
    defaultSize: number,
    maxSize: number,
  ) {
    const page = Math.max(1, Math.floor(Number(pageInput) || 1));
    const size = Math.min(
      maxSize,
      Math.max(1, Math.floor(Number(sizeInput) || defaultSize)),
    );
    return { page, size };
  }

  private async assertCine(cineId: Types.ObjectId): Promise<void> {
    const exists = await this.cineModel.exists({ _id: cineId }).exec();
    if (!exists) {
      throw new NotFoundException('影视不存在');
    }
  }

  private async assertEpisode(
    cineId: Types.ObjectId,
    episodeId: Types.ObjectId,
  ): Promise<void> {
    const exists = await this.episodeModel
      .exists({ _id: episodeId, cine_id: cineId })
      .exec();
    if (!exists) {
      throw new NotFoundException('剧集不存在');
    }
  }

  private toObjectId(value: string, message: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(message);
    }
    return Types.ObjectId.createFromHexString(value);
  }
}
