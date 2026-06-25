import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import type { FileHandle } from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { PaginatedResult } from '@cine-stream/common';
import AppConfig from '@/app.config';
import {
  getVideoRootSetting,
  updateVideoRootSetting,
} from '@/config/media-root';
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
import { AliOssSdk } from '../oss-module/ali-oss.sdk';
import { buildVideoEtag, resolveByteRange } from './video-stream.util';

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

const execFileAsync = promisify(execFile);

export interface MediaFileItem {
  name: string;
  type: 'directory' | 'file';
  relative_path: string;
  absolute_path: string;
  file_url?: string;
}

export interface MediaInfo {
  relative_path: string;
  duration: string;
  duration_seconds: number;
  thumbnail: string;
}

export interface VideoStreamInfo {
  absolutePath: string;
  size: number;
  start: number;
  end: number;
  contentLength: number;
  contentType: string;
  partial: boolean;
  etag: string;
  lastModified: string;
  stream: ReturnType<typeof createReadStream>;
}

export interface VideoResponseInfo {
  absolutePath: string;
  size: number;
  start: number;
  end: number;
  contentLength: number;
  contentType: string;
  partial: boolean;
  etag: string;
  lastModified: string;
}

@Injectable()
export class CineService {
  constructor(
    @InjectModel(Cine.name) private readonly cineModel: Model<CineDocument>,
    @InjectModel(EpisodeVideo.name)
    private readonly episodeModel: Model<EpisodeVideoDocument>,
    private readonly aliOssSdk: AliOssSdk,
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
      genre: dto.genre || [],
      year: dto.year || '',
      season: dto.season || '',
      rating: dto.rating || '',
      poster: dto.poster || '',
      backdrop: dto.backdrop || '',
      badge: dto.badge || '',
      meta: dto.meta || '',
      cast: dto.cast || [],
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
        { returnDocument: 'after' },
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
      await Promise.all(
        episodes.map(async (episode, index) => {
          const media = await this.readVideoMetadata(episode.file_path, {
            extractThumbnail: !episode.thumbnail,
          });
          return {
            cine_id: cine._id,
            name: episode.name,
            description: episode.description || '',
            duration: media.duration,
            thumbnail: episode.thumbnail || media.thumbnail,
            file_path: episode.file_path,
            file_url: episode.file_url || '',
            sort_order: index,
            created_at: Date.now(),
            updated_at: Date.now(),
          };
        }),
      ),
    );

    cine.episode_ids = docs.map((doc) => doc._id as Types.ObjectId);
    cine.updated_at = Date.now();
    await cine.save();

    return this.withEpisodes(cine);
  }

  async listVideoFiles(dir = ''): Promise<{
    root: string;
    configured_root: string;
    current: string;
    items: MediaFileItem[];
  }> {
    const { root, configured_root: configuredRoot } =
      await getVideoRootSetting();
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
      configured_root: configuredRoot,
      current: this.normalizeRelativePath(path.relative(root, current)),
      items,
    };
  }

  async getMediaRoot(): Promise<{ root: string; configured_root: string }> {
    return getVideoRootSetting();
  }

  async getMediaInfo(relativePath: string): Promise<MediaInfo> {
    if (!relativePath.trim()) {
      throw new BadRequestException('请选择视频文件');
    }

    const media = await this.readVideoMetadata(relativePath);
    return {
      relative_path: this.normalizeRelativePath(relativePath),
      duration: media.duration,
      duration_seconds: media.duration_seconds,
      thumbnail: media.thumbnail,
    };
  }

  async updateMediaRoot(
    root: string,
  ): Promise<{ root: string; configured_root: string }> {
    if (!root.trim()) {
      throw new BadRequestException('请输入视频资源目录');
    }
    return updateVideoRootSetting(root);
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
      .map((episode) => ({
        ...episode,
        file_url: this.toEpisodeStreamUrl(episode.id),
      }))
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

  private async readVideoMetadata(
    relativePath: string,
    options: { extractThumbnail?: boolean } = {},
  ): Promise<MediaInfo> {
    const { root } = await getVideoRootSetting();
    const absolutePath = this.resolveInsideRoot(root, relativePath);
    const stat = await fs.stat(absolutePath).catch(() => null);
    if (!stat?.isFile()) {
      throw new NotFoundException('视频文件不存在');
    }

    const duration =
      (await this.readDurationByFfprobe(absolutePath)) ??
      (await this.readMp4Duration(absolutePath));
    const durationSeconds =
      duration && Number.isFinite(duration) ? Math.round(duration) : 0;
    const thumbnail =
      options.extractThumbnail === false
        ? ''
        : await this.extractAndUploadVideoThumbnail(
            absolutePath,
            durationSeconds,
          );

    return {
      relative_path: this.normalizeRelativePath(relativePath),
      duration: this.formatDuration(durationSeconds),
      duration_seconds: durationSeconds,
      thumbnail,
    };
  }

  private async extractAndUploadVideoThumbnail(
    filePath: string,
    durationSeconds: number,
  ): Promise<string> {
    await fs.mkdir(AppConfig.Media.THUMBNAIL_TEMP_DIR, { recursive: true });
    const outputPath = path.join(
      AppConfig.Media.THUMBNAIL_TEMP_DIR,
      `${Date.now()}-${randomUUID()}.jpg`,
    );

    const attempts = this.buildThumbnailSeekAttempts(durationSeconds);
    for (const seek of attempts) {
      const ok = await this.runFfmpegThumbnail(filePath, outputPath, seek);
      if (ok) {
        try {
          const buffer = await fs.readFile(outputPath);
          const result = await this.aliOssSdk.uploadImage({
            buffer,
            originalname: `${path.basename(filePath, path.extname(filePath))}.jpg`,
            mimetype: 'image/jpeg',
          });
          return result.url;
        } catch {
          return '';
        } finally {
          await fs.rm(outputPath, { force: true }).catch(() => undefined);
        }
      }
    }

    await fs.rm(outputPath, { force: true }).catch(() => undefined);
    return '';
  }

  private buildThumbnailSeekAttempts(durationSeconds: number): string[] {
    const attempts = new Set<string>();

    if (durationSeconds > 2) {
      const start = durationSeconds >= 10 ? Math.floor(durationSeconds * 0.1) : 1;
      const end =
        durationSeconds >= 10
          ? Math.ceil(durationSeconds * 0.9)
          : durationSeconds - 1;
      const seek = this.randomInteger(start, Math.max(start, end));
      attempts.add(String(seek));
    }

    attempts.add('1');
    attempts.add('0');

    return [...attempts];
  }

  private randomInteger(min: number, max: number): number {
    const lower = Math.ceil(min);
    const upper = Math.floor(max);
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
  }

  private async runFfmpegThumbnail(
    filePath: string,
    outputPath: string,
    seek: string,
  ): Promise<boolean> {
    try {
      await execFileAsync(
        AppConfig.Media.FFMPEG_PATH,
        [
          '-y',
          '-ss',
          seek,
          '-i',
          filePath,
          '-frames:v',
          '1',
          '-q:v',
          '3',
          '-vf',
          'scale=480:-2',
          outputPath,
        ],
        { windowsHide: true },
      );
      const stat = await fs.stat(outputPath).catch(() => null);
      return Boolean(stat?.isFile() && stat.size > 0);
    } catch {
      await fs.rm(outputPath, { force: true }).catch(() => undefined);
      return false;
    }
  }

  private async readDurationByFfprobe(filePath: string): Promise<number | null> {
    try {
      const { stdout } = await execFileAsync(
        AppConfig.Media.FFPROBE_PATH,
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          filePath,
        ],
        { windowsHide: true },
      );
      const duration = Number(stdout.trim());
      return Number.isFinite(duration) && duration > 0 ? duration : null;
    } catch {
      return null;
    }
  }

  private async readMp4Duration(filePath: string): Promise<number | null> {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.mp4', '.m4v', '.mov'].includes(ext)) {
      return null;
    }

    const file = await fs.open(filePath, 'r');
    try {
      const stat = await file.stat();
      return this.findMvhdDuration(file, 0, stat.size);
    } finally {
      await file.close();
    }
  }

  private async findMvhdDuration(
    file: FileHandle,
    start: number,
    end: number,
  ): Promise<number | null> {
    let offset = start;
    const header = Buffer.alloc(16);

    while (offset + 8 <= end) {
      await file.read(header, 0, 8, offset);
      const size32 = header.readUInt32BE(0);
      const type = header.toString('ascii', 4, 8);
      let headerSize = 8;
      let atomSize = size32;

      if (size32 === 1) {
        await file.read(header, 8, 8, offset + 8);
        atomSize = Number(header.readBigUInt64BE(8));
        headerSize = 16;
      } else if (size32 === 0) {
        atomSize = end - offset;
      }

      if (atomSize < headerSize) {
        break;
      }

      const contentStart = offset + headerSize;
      const contentEnd = Math.min(offset + atomSize, end);

      if (type === 'mvhd') {
        return this.readMvhdDuration(file, contentStart, contentEnd);
      }

      if (['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'udta'].includes(type)) {
        const duration = await this.findMvhdDuration(
          file,
          contentStart,
          contentEnd,
        );
        if (duration !== null) {
          return duration;
        }
      }

      offset += atomSize;
    }

    return null;
  }

  private async readMvhdDuration(
    file: FileHandle,
    start: number,
    end: number,
  ): Promise<number | null> {
    const size = Math.min(32, end - start);
    if (size < 20) {
      return null;
    }

    const buffer = Buffer.alloc(size);
    await file.read(buffer, 0, size, start);
    const version = buffer.readUInt8(0);

    if (version === 1) {
      if (size < 32) {
        return null;
      }
      const timescale = buffer.readUInt32BE(20);
      const duration = Number(buffer.readBigUInt64BE(24));
      return timescale ? duration / timescale : null;
    }

    const timescale = buffer.readUInt32BE(12);
    const duration = buffer.readUInt32BE(16);
    return timescale ? duration / timescale : null;
  }

  private formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) {
      return '';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    const pad = (value: number) => value.toString().padStart(2, '0');

    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(rest)}`
      : `${minutes}:${pad(rest)}`;
  }

  async createEpisodeVideoStream(
    episodeId: string,
    range?: string,
  ): Promise<VideoStreamInfo> {
    const info = await this.getEpisodeVideoResponseInfo(episodeId, range);
    return {
      ...info,
      stream: createReadStream(info.absolutePath, {
        start: info.start,
        end: info.end,
      }),
    };
  }

  async getEpisodeVideoResponseInfo(
    episodeId: string,
    range?: string,
  ): Promise<VideoResponseInfo> {
    const episode = await this.episodeModel.findById(episodeId).exec();
    if (!episode) {
      throw new NotFoundException('剧集不存在');
    }

    const { root } = await getVideoRootSetting();
    const absolutePath = this.resolveInsideRoot(root, episode.file_path);
    const stat = await fs.stat(absolutePath).catch(() => null);
    if (!stat?.isFile()) {
      throw new NotFoundException('视频文件不存在');
    }

    const size = stat.size;
    const { start, end, partial } = resolveByteRange(range, size);

    return {
      absolutePath,
      size,
      start,
      end,
      contentLength: end - start + 1,
      contentType: this.getVideoContentType(absolutePath),
      partial,
      etag: buildVideoEtag(size, stat.mtimeMs),
      lastModified: stat.mtime.toUTCString(),
    };
  }

  private getVideoContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.m4v': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.flv': 'video/x-flv',
      '.wmv': 'video/x-ms-wmv',
    };
    return map[ext] || 'application/octet-stream';
  }

  private toEpisodeStreamUrl(episodeId: string): string {
    return `/media/videos/${episodeId}`;
  }
}
