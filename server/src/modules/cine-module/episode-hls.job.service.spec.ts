import { ServiceUnavailableException } from '@nestjs/common';
import { Job } from 'bullmq';
import { EpisodeHlsJobService } from './episode-hls.job.service';

const queueAdd = jest.fn();
const queueGetJob = jest.fn();
const queueClose = jest.fn();
const workerOn = jest.fn();
const workerClose = jest.fn();

let workerProcessor:
  | ((job: Job<{ episodeId: string; profile?: string }>) => Promise<void>)
  | null = null;

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: queueAdd,
    getJob: queueGetJob,
    close: queueClose,
  })),
  Worker: jest.fn().mockImplementation((_name: string, processor: any) => {
    workerProcessor = processor;
    return {
      on: workerOn,
      close: workerClose,
    };
  }),
}));

describe('EpisodeHlsJobService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    workerProcessor = null;
    queueAdd.mockResolvedValue(undefined);
    queueGetJob.mockResolvedValue(null);
    queueClose.mockResolvedValue(undefined);
    workerClose.mockResolvedValue(undefined);
  });

  it('启动时会按 Redis 队列状态对账 processing 剧集', async () => {
    const cineService = {
      reconcileEpisodeHlsProcessingState: jest
        .fn()
        .mockImplementation(async (isJobAlive: (episodeId: string) => Promise<boolean>) => {
          await expect(isJobAlive('episode-1')).resolves.toBe(true);
        }),
    } as any;
    queueGetJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('waiting'),
    });
    const service = new EpisodeHlsJobService(cineService);

    await service.onModuleInit();

    expect(cineService.reconcileEpisodeHlsProcessingState).toHaveBeenCalledTimes(
      1,
    );
    expect(queueGetJob).toHaveBeenCalledWith('episode-hls-episode-1');
  });

  it('入队时会先准备状态，再写入 BullMQ', async () => {
    const cineService = {
      prepareEpisodeHlsBuild: jest
        .fn()
        .mockResolvedValue({ id: 'episode-1', hls_status: 'processing' }),
      markEpisodeHlsEnqueueFailed: jest.fn(),
      runEpisodeHlsBuild: jest.fn(),
      reconcileEpisodeHlsProcessingState: jest.fn(),
    } as any;
    const service = new EpisodeHlsJobService(cineService);

    const result = await service.enqueueBuild('episode-1', '720p');

    expect(result).toEqual({ id: 'episode-1', hls_status: 'processing' });
    expect(cineService.prepareEpisodeHlsBuild).toHaveBeenCalledWith(
      'episode-1',
      '720p',
    );
    expect(queueAdd).toHaveBeenCalledWith(
      'build',
      {
        episodeId: 'episode-1',
        profile: '720p',
      },
      expect.objectContaining({
        jobId: 'episode-hls-episode-1',
      }),
    );
  });

  it('队列入队失败时会回滚剧集状态并抛出 503', async () => {
    const cineService = {
      prepareEpisodeHlsBuild: jest
        .fn()
        .mockResolvedValue({ id: 'episode-1', hls_status: 'processing' }),
      markEpisodeHlsEnqueueFailed: jest.fn().mockResolvedValue(undefined),
      runEpisodeHlsBuild: jest.fn(),
      reconcileEpisodeHlsProcessingState: jest.fn(),
    } as any;
    queueAdd.mockRejectedValue(new Error('redis down'));
    const service = new EpisodeHlsJobService(cineService);

    await expect(service.enqueueBuild('episode-1', '720p')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    expect(cineService.markEpisodeHlsEnqueueFailed).toHaveBeenCalledWith(
      'episode-1',
      expect.stringContaining('redis down'),
    );
  });

  it('worker 会把任务转交给 CineService 执行', async () => {
    const cineService = {
      prepareEpisodeHlsBuild: jest.fn(),
      markEpisodeHlsEnqueueFailed: jest.fn(),
      runEpisodeHlsBuild: jest.fn().mockResolvedValue(undefined),
      reconcileEpisodeHlsProcessingState: jest.fn(),
    } as any;
    new EpisodeHlsJobService(cineService);

    await workerProcessor?.({
      data: {
        episodeId: 'episode-1',
        profile: '1080p',
      },
    } as Job<{ episodeId: string; profile?: string }>);

    expect(cineService.runEpisodeHlsBuild).toHaveBeenCalledWith(
      'episode-1',
      '1080p',
    );
  });
});
