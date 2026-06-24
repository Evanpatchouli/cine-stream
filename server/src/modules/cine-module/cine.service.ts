import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import AppConfig from '@/app.config';
import { PaginatedResult } from '@cine-stream/common';
import {
  Cine,
  CineDocument,
  EpisodeVideo,
  EpisodeVideoDocument,
} from './cine.schema';
import {
  CreateCineDto,
  EpisodeVideoInputDto,
  UpdateCineDto,
} from './dto';

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.m4v',
  '.webm',
  '.mov',
  '.mkv',
  '.avi',
  '.flv',
  '.wmv',
]);

export interface MediaFileItem {
  name: string;
  type: 'directory' | 'file';
  relative_path: string;
  absolute_path: string;
  file_url?: string;
}

@Injectable()
export class CineService {
  constructor(
    @InjectModel(Cine.name) private readonly cineModel: Model<CineDocument>,
    @InjectModel(EpisodeVideo.name)
    private readonly episodeModel: Model<EpisodeVideoDocument>,
  ) {}

  async findPage(
    page: number,
    size: number,
    keyword?: string,
  ): Promise<PaginatedResult<Record<string, any>>> {
    const filter = keyword
      ? { name: { $regex: keyword.trim(), $options: 'i' } }
      : {};
    const [list, total] = await Promise.all([
      this.cineModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .exec(),
      this.cineModel.countDocuments(filter).exec(),
    ]);

    const result = await Promise.all(list.map((cine) => this.withEpisodes(cine)));

    return {
      list: result,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findAll(): Promise<Record<string, any>[]> {
    const cines = await this.cineModel.find().sort({ created_at: -1 }).exec();
    return Promise.all(cines.map((cine) => this.withEpisodes(cine)));
  }

  async getDetail(id: string): Promise<Record<string, any>> {
    const cine = await this.cineModel.findById(id).exec();
    if (!cine) {
      throw new NotFoundException('影视不存在');
    }
    return this.withEpisodes(cine);
  }

  async create(dto: CreateCineDto): Promise<Record<string, any>> {
    const cine = await this.cineModel.create({
      name: dto.name,
      description: dto.description || '',
      episode_ids: [],
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    if (dto.episodes?.length) {
      return this.replaceEpisodes(cine.id, dto.episodes);
    }

    return this.withEpisodes(cine);
  }

  async update(id: string, dto: UpdateCineDto): Promise<Record<string, any>> {
    const cine = await this.cineModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          updated_at: Date.now(),
        },
        { new: true },
      )
      .exec();

    if (!cine) {
      throw new NotFoundException('影视不存在');
    }

    return this.withEpisodes(cine);
  }

  async delete(id: string): Promise<void> {
    const cine = await this.cineModel.findById(id).exec();
    if (!cine) {
      throw new NotFoundException('影视不存在');
    }

    await Promise.all([
      this.episodeModel.deleteMany({ cine_id: cine._id }).exec(),
      this.cineModel.deleteOne({ _id: cine._id }).exec(),
    ]);
  }

  async replaceEpisodes(
    cineId: string,
    episodes: EpisodeVideoInputDto[],
  ): Promise<Record<string, any>> {
    const cine = await this.cineModel.findById(cineId).exec();
    if (!cine) {
      throw new NotFoundException('影视不存在');
    }

    await this.episodeModel.deleteMany({ cine_id: cine._id }).exec();

    const docs = await this.episodeModel.insertMany(
      episodes.map((episode, index) => ({
        cine_id: cine._id,
        name: episode.name,
        description: episode.description || '',
        file_path: episode.file_path,
        file_url: episode.file_url || this.toMediaUrl(episode.file_path),
        sort_order: index,
        created_at: Date.now(),
        updated_at: Date.now(),
      })),
    );

    cine.episode_ids = docs.map((doc) => doc._id as Types.ObjectId);
    cine.updated_at = Date.now();
    await cine.save();

    return this.withEpisodes(cine);
  }

  async listVideoFiles(dir = ''): Promise<{
    root: string;
    current: string;
    items: MediaFileItem[];
  }> {
    const root = path.resolve(
      AppConfig.Process.ROOT,
      AppConfig.Media.VIDEO_LIBRARY_ROOT,
    );
    const current = this.resolveInsideRoot(root, dir);

    await fs.mkdir(root, { recursive: true });
    const entries = await fs.readdir(current, { withFileTypes: true });
    const items = entries
      .filter((entry) => {
        if (entry.isDirectory()) {
          return true;
        }
        return VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
      })
      .map((entry) => {
        const absolutePath = path.join(current, entry.name);
        const relativePath = this.normalizeRelativePath(
          path.relative(root, absolutePath),
        );
        const type = entry.isDirectory() ? 'directory' : 'file';
        return {
          name: entry.name,
          type,
          relative_path: relativePath,
          absolute_path: absolutePath,
          file_url: type === 'file' ? this.toMediaUrl(relativePath) : undefined,
        } satisfies MediaFileItem;
      })
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    return {
      root,
      current: this.normalizeRelativePath(path.relative(root, current)),
      items,
    };
  }

  private async withEpisodes(cine: CineDocument): Promise<Record<string, any>> {
    const episodeIds = (cine.episode_ids || []).map((id) => id.toString());
    const episodes = episodeIds.length
      ? await this.episodeModel
          .find({
            _id: { $in: episodeIds },
            cine_id: cine._id,
          })
          .exec()
      : [];
    const sortMap = new Map(episodeIds.map((id, index) => [id, index]));
    const orderedEpisodes = episodes
      .map((episode) => episode.toJSON())
      .sort((a, b) => {
        return (sortMap.get(a.id) || 0) - (sortMap.get(b.id) || 0);
      });

    return {
      ...cine.toJSON(),
      episodes: orderedEpisodes,
    };
  }

  private resolveInsideRoot(root: string, dir: string): string {
    const target = path.resolve(root, dir || '.');
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new BadRequestException('目录超出视频库根目录');
    }
    return target;
  }

  private normalizeRelativePath(input: string): string {
    return input.split(path.sep).filter(Boolean).join('/');
  }

  private toMediaUrl(filePath: string): string {
    const relative = this.normalizeRelativePath(filePath);
    return `/media-files/${encodeURI(relative)}`;
  }
}
