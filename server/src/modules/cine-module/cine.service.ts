import {
  BadRequestException,
  ConflictException,
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
  EpisodeHlsVariant,
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
import {
  buildHlsMasterPlaylist,
  computeScaledWidth,
  getHlsCacheControl,
  getHlsContentType,
  HLS_PROFILE_PRESETS,
  HLS_PROFILE_VALUES,
  HlsProfile,
  resolveAutoHlsProfiles,
  resolveAutoHlsProfile,
} from './hls.util';

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

export interface StaticAssetStreamInfo {
  absolutePath: string;
  contentLength: number;
  contentType: string;
  cacheControl: string;
  etag: string;
  lastModified: string;
  stream: ReturnType<typeof createReadStream>;
}

interface HlsBuildFailure {
  error: unknown;
  message: string;
  profile: HlsProfile;
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
    const filter = await this.buildKeywordFilter(keyword);
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

  async findAll(keyword?: string): Promise<Record<string, any>[]> {
    const filter = await this.buildKeywordFilter(keyword);
    const cines = await this.cineModel
      .find(filter)
      .sort({ created_at: -1 })
      .exec();
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

    const episodes = await this.episodeModel.find({ cine_id: cine._id }).exec();
    if (episodes.some((episode) => episode.hls_status === 'processing')) {
      throw new ConflictException('存在 HLS 生成中的剧集，暂不能删除影视');
    }

    await Promise.all(
      episodes.map((episode) => this.deleteEpisodeHlsFiles(episode.id)),
    );

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

    const existingEpisodes = await this.episodeModel
      .find({ cine_id: cine._id })
      .exec();
    const existingMap = new Map(
      existingEpisodes.map((episode) => [episode.id, episode] as const),
    );
    const nextDocs: EpisodeVideoDocument[] = [];
    const nextInputIds = new Set(
      episodes.map((episode) => episode.id).filter(Boolean) as string[],
    );
    const removedEpisodes = existingEpisodes.filter(
      (episode) => !nextInputIds.has(episode.id),
    );

    if (removedEpisodes.some((episode) => episode.hls_status === 'processing')) {
      throw new ConflictException('存在 HLS 生成中的剧集，暂不能删除');
    }

    for (const episodeInput of episodes) {
      const existingEpisode = episodeInput.id
        ? existingMap.get(episodeInput.id)
        : undefined;
      const sourceChanged = Boolean(
        existingEpisode && existingEpisode.file_path !== episodeInput.file_path,
      );

      if (existingEpisode?.hls_status === 'processing' && sourceChanged) {
        throw new ConflictException('剧集 HLS 生成中，暂不能更换视频文件');
      }
    }

    for (const [index, episodeInput] of episodes.entries()) {
      const media = await this.readVideoMetadata(episodeInput.file_path, {
        extractThumbnail: !episodeInput.thumbnail,
      });
      const existingEpisode = episodeInput.id
        ? existingMap.get(episodeInput.id)
        : undefined;
      const sourceChanged = Boolean(
        existingEpisode && existingEpisode.file_path !== episodeInput.file_path,
      );
      const episode =
        existingEpisode ||
        new this.episodeModel({
          cine_id: cine._id,
          created_at: Date.now(),
        });

      episode.cine_id = cine._id;
      episode.name = episodeInput.name;
      episode.description = episodeInput.description || '';
      episode.duration = media.duration;
      episode.duration_seconds = media.duration_seconds;
      episode.thumbnail = episodeInput.thumbnail || media.thumbnail;
      episode.file_path = episodeInput.file_path;
      episode.file_url = episodeInput.file_url || '';
      episode.sort_order = index;
      episode.updated_at = Date.now();

      if (sourceChanged) {
        await this.deleteEpisodeHlsFiles(episode.id);
        this.resetEpisodeHlsState(episode);
      }

      await episode.save();
      nextDocs.push(episode);
    }

    await Promise.all(
      removedEpisodes.map(async (episode) => {
        await this.deleteEpisodeHlsFiles(episode.id);
      }),
    );

    if (removedEpisodes.length) {
      await this.episodeModel
        .deleteMany({
          _id: {
            $in: removedEpisodes.map(
              (episode) => episode._id as Types.ObjectId,
            ),
          },
        })
        .exec();
    }

    cine.episode_ids = nextDocs.map((doc) => doc._id as Types.ObjectId);
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

  async prepareEpisodeHlsBuild(
    episodeId: string,
    requestedProfile?: string,
  ): Promise<Record<string, any>> {
    const { episode, absolutePath } = await this.getEpisodeSourceFile(episodeId);

    if (episode.hls_status === 'processing') {
      throw new ConflictException('当前剧集的 HLS 任务正在处理中');
    }

    const dimensions = await this.readVideoDimensionsByFfprobe(absolutePath);
    if (!dimensions) {
      throw new BadRequestException('无法读取视频分辨率，不能生成 HLS');
    }

    this.resolveHlsProfile(requestedProfile, dimensions.height);

    episode.hls_status = 'processing';
    episode.hls_last_error = '';
    episode.updated_at = Date.now();
    await episode.save();

    return this.toEpisodeResponse(episode.toJSON());
  }

  async reconcileEpisodeHlsProcessingState(
    isJobAlive: (episodeId: string) => Promise<boolean>,
  ): Promise<void> {
    const interruptedEpisodes = await this.episodeModel
      .find({ hls_status: 'processing' })
      .exec();

    for (const episode of interruptedEpisodes) {
      const jobAlive = await isJobAlive(episode.id);
      if (jobAlive) {
        continue;
      }

      const hasPlayableAssets = await this.hasPlayableEpisodeHlsFiles(episode);

      if (hasPlayableAssets) {
        episode.hls_status = 'ready';
        episode.hls_last_error =
          'Redis 队列中未找到对应任务，已保留现有可用 HLS。';
        episode.updated_at = Date.now();
        await episode.save();
        continue;
      }

      await this.deleteEpisodeHlsFiles(episode.id);
      this.resetEpisodeHlsState(episode);
      episode.hls_status = 'failed';
      episode.hls_last_error =
        'Redis 队列中未找到对应任务，请重新生成。';
      episode.updated_at = Date.now();
      await episode.save();
    }
  }

  async markEpisodeHlsEnqueueFailed(
    episodeId: string,
    errorMessage: string,
  ): Promise<Record<string, any>> {
    const episode = await this.getEpisodeByIdOrThrow(episodeId);
    const safeMessage = errorMessage.slice(0, 500);

    if (this.hasEpisodeHlsMetadata(episode)) {
      episode.hls_status = 'ready';
      episode.hls_last_error = safeMessage;
      episode.updated_at = Date.now();
      await episode.save();
      return this.toEpisodeResponse(episode.toJSON());
    }

    this.resetEpisodeHlsState(episode);
    episode.hls_status = 'failed';
    episode.hls_last_error = safeMessage;
    episode.updated_at = Date.now();
    await episode.save();
    return this.toEpisodeResponse(episode.toJSON());
  }

  async runEpisodeHlsBuild(
    episodeId: string,
    requestedProfile?: string,
  ): Promise<Record<string, any>> {
    const { episode, absolutePath } = await this.getEpisodeSourceFile(episodeId);
    const previousVariants = [...(episode.hls_variants || [])];
    const episodeRoot = this.getEpisodeHlsRootAbsolutePath(episode.id);

    try {
      const dimensions = await this.readVideoDimensionsByFfprobe(absolutePath);
      if (!dimensions) {
        throw new BadRequestException('无法读取视频分辨率，不能生成 HLS');
      }

      const targetProfiles = requestedProfile
        ? [this.resolveHlsProfile(requestedProfile, dimensions.height)]
        : this.resolveDefaultHlsProfiles(dimensions.height);
      const failures: HlsBuildFailure[] = [];
      let nextVariants = [...previousVariants];

      for (const profile of targetProfiles) {
        try {
          const variant = await this.buildEpisodeHlsVariant(
            absolutePath,
            episodeRoot,
            dimensions,
            profile,
          );
          nextVariants = this.mergeEpisodeHlsVariantList(nextVariants, variant);
        } catch (error) {
          failures.push({
            profile,
            message:
              error instanceof Error ? error.message.slice(0, 500) : 'HLS 生成失败',
            error,
          });
          nextVariants = nextVariants.filter(
            (variant) => variant.profile !== profile,
          );

          if (requestedProfile) {
            break;
          }
        }
      }

      if (!nextVariants.length) {
        await this.deleteEpisodeHlsFiles(episode.id);
        this.resetEpisodeHlsState(episode);
        episode.hls_status = 'failed';
        episode.hls_last_error = this.formatHlsBuildFailures(failures);
        episode.updated_at = Date.now();
        await episode.save();
        throw failures[0]?.error || new BadRequestException('HLS 生成失败');
      }

      episode.hls_status = 'ready';
      episode.hls_output_dir = episode.id;
      episode.hls_master_path = 'master.m3u8';
      episode.hls_variants = nextVariants;
      episode.hls_updated_at = Date.now();
      episode.hls_last_error = failures.length
        ? this.formatHlsBuildFailures(failures)
        : '';
      episode.updated_at = Date.now();

      await this.writeEpisodeHlsMasterPlaylist(episode);
      await episode.save();

      if (requestedProfile && failures.length) {
        throw failures[0].error;
      }

      return this.toEpisodeResponse(episode.toJSON());
    } catch (error) {
      throw error;
    }
  }

  async deleteEpisodeHls(episodeId: string): Promise<Record<string, any>> {
    const episode = await this.getEpisodeByIdOrThrow(episodeId);
    if (episode.hls_status === 'processing') {
      throw new ConflictException('当前剧集的 HLS 任务正在处理中，暂不能删除');
    }
    await this.deleteEpisodeHlsFiles(episode.id);
    this.resetEpisodeHlsState(episode);
    episode.updated_at = Date.now();
    await episode.save();
    return this.toEpisodeResponse(episode.toJSON());
  }

  async createEpisodeHlsAssetStream(
    episodeId: string,
    assetPath: string,
  ): Promise<StaticAssetStreamInfo> {
    const episode = await this.getEpisodeByIdOrThrow(episodeId);
    if (!this.hasEpisodeHlsMetadata(episode)) {
      throw new NotFoundException('HLS 资源不存在');
    }

    const rootDir = this.getEpisodeHlsRootAbsolutePath(episode.id);
    const normalizedPath = this.normalizeRelativePath(assetPath);
    const absolutePath = this.resolveInsideDirectory(rootDir, normalizedPath);
    const stat = await fs.stat(absolutePath).catch(() => null);
    if (!stat?.isFile()) {
      throw new NotFoundException('HLS 资源不存在');
    }

    return {
      absolutePath,
      contentLength: Number(stat.size),
      contentType: getHlsContentType(normalizedPath),
      cacheControl: getHlsCacheControl(normalizedPath),
      etag: buildVideoEtag(Number(stat.size), Number(stat.mtimeMs)),
      lastModified: stat.mtime.toUTCString(),
      stream: createReadStream(absolutePath),
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
      .map((episode) => this.toEpisodeResponse(episode.toJSON()))
      .sort((a, b) => {
        return (sortMap.get(a.id) || 0) - (sortMap.get(b.id) || 0);
      });

    return {
      ...cine.toJSON(),
      episodes: orderedEpisodes,
    };
  }

  private async buildKeywordFilter(
    keyword?: string,
  ): Promise<Record<string, any>> {
    const text = keyword?.trim();
    if (!text) {
      return {};
    }

    const regex = new RegExp(this.escapeRegExp(text), 'i');
    const matchedEpisodes = await this.episodeModel
      .find({
        $or: [{ name: regex }, { description: regex }],
      })
      .select('cine_id')
      .exec();
    const matchedCineIds = matchedEpisodes
      .map((episode) => episode.cine_id)
      .filter(Boolean);

    return {
      $or: [
        { name: regex },
        { description: regex },
        { genre: regex },
        { year: regex },
        { season: regex },
        { rating: regex },
        { badge: regex },
        { meta: regex },
        { cast: regex },
        ...(matchedCineIds.length ? [{ _id: { $in: matchedCineIds } }] : []),
      ],
    };
  }

  private escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private resolveInsideRoot(root: string, dir: string): string {
    const target = path.resolve(root, dir || '.');
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new BadRequestException('目录超出视频库根目录');
    }
    return target;
  }

  private resolveInsideDirectory(root: string, relativePath: string): string {
    return this.resolveInsideRoot(root, relativePath);
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
      return Boolean(stat?.isFile() && Number(stat.size) > 0);
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

  private async readVideoDimensionsByFfprobe(
    filePath: string,
  ): Promise<{ width: number; height: number } | null> {
    try {
      const { stdout } = await execFileAsync(
        AppConfig.Media.FFPROBE_PATH,
        [
          '-v',
          'error',
          '-select_streams',
          'v:0',
          '-show_entries',
          'stream=width,height',
          '-of',
          'json',
          filePath,
        ],
        { windowsHide: true },
      );
      const payload = JSON.parse(stdout) as {
        streams?: Array<{ width?: number; height?: number }>;
      };
      const stream = payload.streams?.[0];
      if (!stream?.width || !stream?.height) {
        return null;
      }
      return {
        width: stream.width,
        height: stream.height,
      };
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
      return this.findMvhdDuration(file, 0, Number(stat.size));
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

      if (
        ['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'udta'].includes(type)
      ) {
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
    const { absolutePath, stat } = await this.getEpisodeSourceFile(episodeId);
    const size = Number(stat.size);
    const { start, end, partial } = resolveByteRange(range, size);

    return {
      absolutePath,
      size,
      start,
      end,
      contentLength: end - start + 1,
      contentType: this.getVideoContentType(absolutePath),
      partial,
      etag: buildVideoEtag(size, Number(stat.mtimeMs)),
      lastModified: stat.mtime.toUTCString(),
    };
  }

  private async getEpisodeSourceFile(
    episodeId: string,
  ): Promise<{
    episode: EpisodeVideoDocument;
    absolutePath: string;
    stat: Awaited<ReturnType<typeof fs.stat>>;
  }> {
    const episode = await this.getEpisodeByIdOrThrow(episodeId);
    const { root } = await getVideoRootSetting();
    const absolutePath = this.resolveInsideRoot(root, episode.file_path);
    const stat = await fs.stat(absolutePath).catch(() => null);
    if (!stat?.isFile()) {
      throw new NotFoundException('视频文件不存在');
    }

    return { episode, absolutePath, stat };
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

  private async getEpisodeByIdOrThrow(
    episodeId: string,
  ): Promise<EpisodeVideoDocument> {
    const episode = await this.episodeModel.findById(episodeId).exec();
    if (!episode) {
      throw new NotFoundException('剧集不存在');
    }
    return episode;
  }

  private toEpisodeResponse(rawEpisode: Record<string, any>): Record<string, any> {
    const streamUrl = this.toEpisodeStreamUrl(rawEpisode.id);
    const hlsUrl =
      this.hasEpisodeHlsMetadata(rawEpisode)
        ? `${this.toEpisodeHlsMasterUrl(rawEpisode.id)}?v=${
            rawEpisode.hls_updated_at || rawEpisode.updated_at || Date.now()
          }`
        : '';

    return {
      ...rawEpisode,
      stream_url: streamUrl,
      file_url: streamUrl,
      hls_url: hlsUrl,
      hls_profiles: (rawEpisode.hls_variants || []).map(
        (variant: EpisodeHlsVariant) => variant.profile,
      ),
    };
  }

  private toEpisodeStreamUrl(episodeId: string): string {
    return `/media/videos/${episodeId}`;
  }

  private toEpisodeHlsMasterUrl(episodeId: string): string {
    return `/media/hls/${episodeId}/master.m3u8`;
  }

  private hasEpisodeHlsMetadata(
    episode: Pick<
      EpisodeVideoDocument,
      'hls_output_dir' | 'hls_master_path' | 'hls_variants'
    > | Record<string, any>,
  ): boolean {
    return Boolean(
      episode.hls_output_dir &&
        episode.hls_master_path &&
        Array.isArray(episode.hls_variants) &&
        episode.hls_variants.length,
    );
  }

  private async hasPlayableEpisodeHlsFiles(
    episode: EpisodeVideoDocument,
  ): Promise<boolean> {
    if (!this.hasEpisodeHlsMetadata(episode)) {
      return false;
    }

    const rootDir = this.getEpisodeHlsRootAbsolutePath(episode.id);
    const files = [
      path.join(rootDir, episode.hls_master_path),
      ...(episode.hls_variants || []).map((variant) =>
        path.join(rootDir, variant.playlist_path),
      ),
    ];
    const stats = await Promise.all(
      files.map((filePath) => fs.stat(filePath).catch(() => null)),
    );
    return stats.every((stat) => stat?.isFile());
  }

  private resolveHlsProfile(
    requestedProfile: string | undefined,
    sourceHeight: number,
  ): HlsProfile {
    if (requestedProfile) {
      if (!HLS_PROFILE_VALUES.includes(requestedProfile as HlsProfile)) {
        throw new BadRequestException('不支持的 HLS 档位');
      }

      const profile = requestedProfile as HlsProfile;
      if (sourceHeight < HLS_PROFILE_PRESETS[profile].height) {
        throw new BadRequestException(
          `源视频高度不足，不能生成 ${profile} HLS`,
        );
      }

      return profile;
    }

    const autoProfile = resolveAutoHlsProfile(sourceHeight);
    if (!autoProfile) {
      throw new BadRequestException('源视频分辨率过低，不能生成默认 HLS');
    }

    return autoProfile;
  }

  private resolveDefaultHlsProfiles(sourceHeight: number): HlsProfile[] {
    const profiles = resolveAutoHlsProfiles(sourceHeight);
    if (!profiles.length) {
      throw new BadRequestException('源视频分辨率过低，不能生成默认 HLS');
    }
    return profiles;
  }

  private getEpisodeHlsRootAbsolutePath(episodeId: string): string {
    return path.join(AppConfig.Media.HLS_ROOT, episodeId);
  }

  private resetEpisodeHlsState(episode: EpisodeVideoDocument): void {
    episode.hls_status = 'none';
    episode.hls_output_dir = '';
    episode.hls_master_path = '';
    episode.hls_variants = [];
    episode.hls_updated_at = 0;
    episode.hls_last_error = '';
  }

  private mergeEpisodeHlsVariant(
    episode: EpisodeVideoDocument,
    nextVariant: EpisodeHlsVariant,
  ): void {
    episode.hls_variants = this.mergeEpisodeHlsVariantList(
      episode.hls_variants || [],
      nextVariant,
    );
  }

  private mergeEpisodeHlsVariantList(
    variants: EpisodeHlsVariant[],
    nextVariant: EpisodeHlsVariant,
  ): EpisodeHlsVariant[] {
    const merged = variants.filter(
      (variant) => variant.profile !== nextVariant.profile,
    );
    merged.push(nextVariant);
    return merged.sort((left, right) => right.height - left.height);
  }

  private async writeEpisodeHlsMasterPlaylist(
    episode: EpisodeVideoDocument,
  ): Promise<void> {
    const rootDir = this.getEpisodeHlsRootAbsolutePath(episode.id);
    await fs.mkdir(rootDir, { recursive: true });
    const content = buildHlsMasterPlaylist(episode.hls_variants || []);
    await fs.writeFile(path.join(rootDir, 'master.m3u8'), content, 'utf8');
  }

  private async deleteEpisodeHlsFiles(episodeId: string): Promise<void> {
    const rootDir = this.getEpisodeHlsRootAbsolutePath(episodeId);
    await fs.rm(rootDir, { recursive: true, force: true }).catch(() => undefined);
  }

  private async buildEpisodeHlsVariant(
    absolutePath: string,
    episodeRoot: string,
    dimensions: { width: number; height: number },
    profile: HlsProfile,
  ): Promise<EpisodeHlsVariant> {
    const preset = HLS_PROFILE_PRESETS[profile];
    const profileDir = path.join(episodeRoot, profile);
    const playlistAbsolutePath = path.join(profileDir, 'index.m3u8');
    const segmentPattern = path.join(profileDir, 'segment_%03d.ts');
    const scaledWidth = computeScaledWidth(
      dimensions.width,
      dimensions.height,
      preset.height,
    );

    try {
      await fs.mkdir(profileDir, { recursive: true });
      await execFileAsync(
        AppConfig.Media.FFMPEG_PATH,
        [
          '-y',
          '-i',
          absolutePath,
          '-map',
          '0:v:0',
          '-map',
          '0:a:0?',
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          String(preset.crf),
          '-vf',
          `scale=-2:${preset.height}`,
          '-c:a',
          'aac',
          '-b:a',
          preset.audioBitrate,
          '-ac',
          '2',
          '-start_number',
          '0',
          '-hls_time',
          '6',
          '-hls_playlist_type',
          'vod',
          '-hls_flags',
          'independent_segments',
          '-hls_segment_filename',
          segmentPattern,
          playlistAbsolutePath,
        ],
        { windowsHide: true },
      );

      const playlistStat = await fs
        .stat(playlistAbsolutePath)
        .catch(() => null);
      if (!playlistStat?.isFile()) {
        throw new BadRequestException('HLS 清单文件生成失败');
      }

      return {
        profile,
        width: scaledWidth,
        height: preset.height,
        bandwidth: preset.bandwidth,
        playlist_path: `${profile}/index.m3u8`,
      };
    } catch (error) {
      await fs
        .rm(profileDir, { recursive: true, force: true })
        .catch(() => undefined);
      throw error;
    }
  }

  private formatHlsBuildFailures(failures: HlsBuildFailure[]): string {
    return failures
      .map((failure) => `${failure.profile}：${failure.message}`)
      .join('；')
      .slice(0, 500);
  }
}
