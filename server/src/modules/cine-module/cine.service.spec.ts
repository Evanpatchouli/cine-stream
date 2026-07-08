import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import { Types } from 'mongoose';
import { CineService } from './cine.service';

jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  readFile: jest.fn(),
  readdir: jest.fn(),
  rm: jest.fn(),
  stat: jest.fn(),
  writeFile: jest.fn(),
}));

describe('CineService', () => {
  const mockedExecFile = execFile as jest.MockedFunction<typeof execFile>;
  const mockedFs = fs as jest.Mocked<typeof fs>;

  const createExecResult = (value?: unknown) => ({
    exec: jest.fn().mockResolvedValue(value),
  });

  const createEpisodeDoc = (overrides: Record<string, any> = {}) => {
    const base = {
      id: 'episode-1',
      _id: new Types.ObjectId(),
      cine_id: new Types.ObjectId(),
      name: '第 1 集',
      description: '',
      duration: '00:42:00',
      duration_seconds: 2520,
      thumbnail: '',
      file_path: 'demo.mp4',
      file_url: '',
      hls_status: 'ready',
      hls_output_dir: 'episode-1',
      hls_master_path: 'master.m3u8',
      hls_variants: [
        {
          profile: '720p',
          width: 1280,
          height: 720,
          bandwidth: 2_800_000,
          playlist_path: '720p/index.m3u8',
        },
      ],
      hls_updated_at: 1_717_000_000_000,
      hls_last_error: '',
      sort_order: 0,
      created_at: 1_717_000_000_000,
      updated_at: 1_717_000_000_000,
      save: jest.fn().mockResolvedValue(undefined),
      toJSON() {
        return {
          id: this.id,
          name: this.name,
          description: this.description,
          duration: this.duration,
          duration_seconds: this.duration_seconds,
          thumbnail: this.thumbnail,
          file_path: this.file_path,
          file_url: this.file_url,
          hls_status: this.hls_status,
          hls_output_dir: this.hls_output_dir,
          hls_master_path: this.hls_master_path,
          hls_variants: this.hls_variants,
          hls_updated_at: this.hls_updated_at,
          hls_last_error: this.hls_last_error,
          sort_order: this.sort_order,
          created_at: this.created_at,
          updated_at: this.updated_at,
        };
      },
    };

    return {
      ...base,
      ...overrides,
    };
  };

  const createService = (options: {
    cineModel?: Record<string, any>;
    episodeModel?: Record<string, any>;
  } = {}) =>
    new CineService(
      (options.cineModel || {}) as any,
      (options.episodeModel || {}) as any,
      {} as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.rm.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);
    mockedFs.stat.mockResolvedValue({
      isFile: () => true,
      size: 1024,
      mtimeMs: 1_717_000_000_000,
      mtime: new Date('2026-06-26T00:00:00.000Z'),
    } as any);
  });

  it('删除影视时会先清理关联剧集的 HLS 目录', async () => {
    const cineId = new Types.ObjectId();
    const episodeA = createEpisodeDoc({ id: 'episode-a' });
    const episodeB = createEpisodeDoc({ id: 'episode-b' });
    const cineModel = {
      findById: jest.fn().mockReturnValue(createExecResult({ _id: cineId })),
      deleteOne: jest.fn().mockReturnValue(createExecResult(undefined)),
    };
    const episodeModel = {
      find: jest.fn().mockReturnValue(createExecResult([episodeA, episodeB])),
      deleteMany: jest.fn().mockReturnValue(createExecResult(undefined)),
    };
    const service = createService({ cineModel, episodeModel });
    const deleteEpisodeHlsFiles = jest
      .spyOn<any, any>(service as any, 'deleteEpisodeHlsFiles')
      .mockResolvedValue(undefined);

    await service.delete(cineId.toString());

    expect(episodeModel.find).toHaveBeenCalledWith({ cine_id: cineId });
    expect(deleteEpisodeHlsFiles).toHaveBeenNthCalledWith(1, 'episode-a');
    expect(deleteEpisodeHlsFiles).toHaveBeenNthCalledWith(2, 'episode-b');
    expect(episodeModel.deleteMany).toHaveBeenCalledWith({ cine_id: cineId });
    expect(cineModel.deleteOne).toHaveBeenCalledWith({ _id: cineId });
  });

  it('已有可用 HLS 时，进入 processing 后仍保留可播放地址', async () => {
    const episode = createEpisodeDoc();
    const service = createService();

    jest
      .spyOn<any, any>(service as any, 'getEpisodeSourceFile')
      .mockResolvedValue({
        episode,
        absolutePath: 'E:/videos/demo.mp4',
      });
    jest
      .spyOn<any, any>(service as any, 'readVideoDimensionsByFfprobe')
      .mockResolvedValue({ width: 1920, height: 1080 });

    const result = await service.prepareEpisodeHlsBuild('episode-1', '1080p');

    expect(result.hls_status).toBe('processing');
    expect(result.hls_url).toContain('/media/hls/episode-1/master.m3u8');
    expect(episode.save).toHaveBeenCalledTimes(1);
  });

  it('影视列表筛选会组合关键字和类型条件', async () => {
    const cineId = new Types.ObjectId();
    const matchedEpisode = createEpisodeDoc({ cine_id: cineId });
    const episodeModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(createExecResult([matchedEpisode])),
      }),
    };
    const service = createService({ episodeModel });

    const filter = await (service as any).buildCineFilter({
      keyword: '量子',
      genre: '科幻',
    });

    expect(filter).toEqual({
      $and: [
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: expect.any(RegExp) },
            { _id: { $in: [cineId] } },
          ]),
        }),
        { genre: '科幻' },
      ],
    });
  });

  it('Redis 队列中找不到任务时，会把 processing 回退到可用 HLS 状态', async () => {
    const episode = createEpisodeDoc({
      hls_status: 'processing',
    });
    const episodeModel = {
      find: jest.fn().mockReturnValue(createExecResult([episode])),
    };
    const service = createService({ episodeModel });

    await service.reconcileEpisodeHlsProcessingState(async () => false);

    expect(episode.hls_status).toBe('ready');
    expect(episode.hls_last_error).toContain('已保留现有可用 HLS');
    expect(episode.save).toHaveBeenCalledTimes(1);
  });

  it('入队失败时，已有可用 HLS 的剧集会恢复为 ready', async () => {
    const episode = createEpisodeDoc({
      hls_status: 'processing',
      hls_last_error: '',
    });
    const service = createService();

    jest
      .spyOn<any, any>(service as any, 'getEpisodeByIdOrThrow')
      .mockResolvedValue(episode);

    const result = await service.markEpisodeHlsEnqueueFailed(
      'episode-1',
      'HLS 队列入队失败：redis down',
    );

    expect(result.hls_status).toBe('ready');
    expect(result.hls_url).toContain('/media/hls/episode-1/master.m3u8');
    expect(episode.hls_last_error).toContain('redis down');
    expect(episode.save).toHaveBeenCalledTimes(1);
  });

  it('默认生成 HLS 时会按源分辨率依次生成多档', async () => {
    const episode = createEpisodeDoc({
      hls_status: 'processing',
      hls_output_dir: '',
      hls_master_path: '',
      hls_variants: [],
      hls_updated_at: 0,
      hls_last_error: '',
    });
    const service = createService();

    jest
      .spyOn<any, any>(service as any, 'getEpisodeSourceFile')
      .mockResolvedValue({
        episode,
        absolutePath: 'E:/videos/demo.mp4',
      });
    jest
      .spyOn<any, any>(service as any, 'readVideoDimensionsByFfprobe')
      .mockResolvedValue({ width: 1920, height: 1080 });

    mockedExecFile.mockImplementation((...args: any[]) => {
      const callback = args[args.length - 1];
      callback(null, '', '');
      return {} as any;
    });

    const result = await service.runEpisodeHlsBuild('episode-1');

    expect(mockedExecFile).toHaveBeenCalledTimes(3);
    expect(episode.hls_status).toBe('ready');
    expect(episode.hls_variants).toEqual([
      {
        profile: '1080p',
        width: 1920,
        height: 1080,
        bandwidth: 5_000_000,
        playlist_path: '1080p/index.m3u8',
      },
      {
        profile: '720p',
        width: 1280,
        height: 720,
        bandwidth: 2_800_000,
        playlist_path: '720p/index.m3u8',
      },
      {
        profile: '360p',
        width: 640,
        height: 360,
        bandwidth: 800_000,
        playlist_path: '360p/index.m3u8',
      },
    ]);
    expect(episode.hls_last_error).toBe('');
    expect(result.hls_profiles).toEqual(['1080p', '720p', '360p']);
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('master.m3u8'),
      expect.stringContaining('1080p/index.m3u8'),
      'utf8',
    );
  });

  it('默认生成 HLS 时，部分档位失败会保留已成功档位', async () => {
    const episode = createEpisodeDoc({
      hls_status: 'processing',
      hls_output_dir: '',
      hls_master_path: '',
      hls_variants: [],
      hls_updated_at: 0,
      hls_last_error: '',
    });
    const service = createService();
    let buildCount = 0;

    jest
      .spyOn<any, any>(service as any, 'getEpisodeSourceFile')
      .mockResolvedValue({
        episode,
        absolutePath: 'E:/videos/demo.mp4',
      });
    jest
      .spyOn<any, any>(service as any, 'readVideoDimensionsByFfprobe')
      .mockResolvedValue({ width: 1920, height: 1080 });

    mockedExecFile.mockImplementation((...args: any[]) => {
      buildCount += 1;
      const callback = args[args.length - 1];
      if (buildCount === 2) {
        callback(new Error('ffmpeg failed'));
        return {} as any;
      }

      callback(null, '', '');
      return {} as any;
    });

    const result = await service.runEpisodeHlsBuild('episode-1');

    expect(mockedExecFile).toHaveBeenCalledTimes(3);
    expect(episode.hls_status).toBe('ready');
    expect(episode.hls_variants).toEqual([
      {
        profile: '1080p',
        width: 1920,
        height: 1080,
        bandwidth: 5_000_000,
        playlist_path: '1080p/index.m3u8',
      },
      {
        profile: '360p',
        width: 640,
        height: 360,
        bandwidth: 800_000,
        playlist_path: '360p/index.m3u8',
      },
    ]);
    expect(episode.hls_last_error).toContain('720p');
    expect(result.hls_status).toBe('ready');
    expect(result.hls_profiles).toEqual(['1080p', '360p']);
    expect(mockedFs.rm).toHaveBeenCalledWith(
      expect.stringContaining('720p'),
      expect.objectContaining({ recursive: true, force: true }),
    );
  });

  it('已有可用 HLS 时，补生成新档位失败不会误伤旧档位', async () => {
    const episode = createEpisodeDoc();
    const service = createService();

    jest
      .spyOn<any, any>(service as any, 'getEpisodeSourceFile')
      .mockResolvedValue({
        episode,
        absolutePath: 'E:/videos/demo.mp4',
      });
    jest
      .spyOn<any, any>(service as any, 'readVideoDimensionsByFfprobe')
      .mockResolvedValue({ width: 1920, height: 1080 });

    mockedExecFile.mockImplementation((...args: any[]) => {
      const callback = args[args.length - 1];
      callback(new Error('ffmpeg failed'));
      return {} as any;
    });

    await expect(
      service.runEpisodeHlsBuild('episode-1', '1080p'),
    ).rejects.toThrow('ffmpeg failed');

    expect(episode.hls_status).toBe('ready');
    expect(episode.hls_variants).toEqual([
      {
        profile: '720p',
        width: 1280,
        height: 720,
        bandwidth: 2_800_000,
        playlist_path: '720p/index.m3u8',
      },
    ]);
    expect(episode.hls_output_dir).toBe('episode-1');
    expect(episode.hls_master_path).toBe('master.m3u8');
    expect(episode.save).toHaveBeenCalledTimes(1);
    expect(mockedFs.rm).toHaveBeenCalledWith(
      expect.stringContaining('episode-1'),
      expect.objectContaining({ recursive: true, force: true }),
    );
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('master.m3u8'),
      expect.stringContaining('720p/index.m3u8'),
      'utf8',
    );
  });
});
