import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import AppConfig from '@/app.config';
import { createLogger } from '@/common/logger';
import { CineService } from './cine.service';

interface EpisodeHlsBuildJob {
  episodeId: string;
  profile?: string;
}

type EpisodeHlsJobName = 'build';

@Injectable()
export class EpisodeHlsJobService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = createLogger(EpisodeHlsJobService.name);
  private readonly queueName = AppConfig.HlsQueue.NAME;
  private readonly queueConnection = {
    url: AppConfig.Redis.URL,
  };
  private readonly workerConnection = {
    url: AppConfig.Redis.URL,
    maxRetriesPerRequest: null as null,
  };
  private readonly queue = new Queue<
    EpisodeHlsBuildJob,
    void,
    EpisodeHlsJobName
  >(this.queueName, {
    connection: this.queueConnection,
  });
  private readonly worker = new Worker<
    EpisodeHlsBuildJob,
    void,
    EpisodeHlsJobName
  >(
    this.queueName,
    async (job) => {
      await this.runJob(job);
    },
    {
      connection: this.workerConnection,
      concurrency: 1,
    },
  );

  constructor(private readonly cineService: CineService) {
    this.worker.on('error', (error) => {
      this.logger.error('BullMQ Worker 异常', error);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.cineService.reconcileEpisodeHlsProcessingState((episodeId) =>
        this.isJobAlive(episodeId),
      );
    } catch (error) {
      this.logger.error('HLS 队列启动对账失败，已跳过本次 processing 状态核对', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.worker.close(), this.queue.close()]);
  }

  async enqueueBuild(
    episodeId: string,
    profile?: string,
  ): Promise<Record<string, any>> {
    const episode = await this.cineService.prepareEpisodeHlsBuild(
      episodeId,
      profile,
    );
    const jobId = this.getJobId(episodeId);

    try {
      await this.removeTerminalJob(jobId);
      await this.queue.add(
        'build',
        {
          episodeId,
          profile,
        },
        {
          jobId,
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      );

      return episode;
    } catch (error) {
      const message = this.readError(error);
      await this.cineService.markEpisodeHlsEnqueueFailed(
        episodeId,
        `HLS 队列入队失败：${message}`,
      );
      throw new ServiceUnavailableException('HLS 队列暂不可用，请稍后重试');
    }
  }

  private async runJob(
    job: Job<EpisodeHlsBuildJob, void, EpisodeHlsJobName>,
  ): Promise<void> {
    const profileLabel = job.data.profile || 'default';
    this.logger.info(
      `开始处理 HLS 任务: episodeId=${job.data.episodeId}, profile=${profileLabel}`,
    );

    try {
      await this.cineService.runEpisodeHlsBuild(
        job.data.episodeId,
        job.data.profile,
      );
      this.logger.info(
        `HLS 任务完成: episodeId=${job.data.episodeId}, profile=${profileLabel}`,
      );
    } catch (error) {
      this.logger.error(
        `HLS 任务失败: episodeId=${job.data.episodeId}, profile=${profileLabel}`,
        error,
      );
      throw error;
    }
  }

  private async isJobAlive(episodeId: string): Promise<boolean> {
    const job = await this.queue.getJob(this.getJobId(episodeId));
    if (!job) {
      return false;
    }

    const state = await job.getState();
    return ['active', 'waiting', 'delayed', 'prioritized', 'waiting-children'].includes(
      state,
    );
  }

  private async removeTerminalJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return;
    }

    const state = await job.getState();
    if (['completed', 'failed'].includes(state)) {
      await job.remove();
    }
  }

  private getJobId(episodeId: string): string {
    return `episode-hls-${episodeId}`;
  }

  private readError(error: unknown): string {
    return error instanceof Error ? error.message : '未知错误';
  }
}
