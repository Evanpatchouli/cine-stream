import {
  Controller,
  Get,
  Head,
  Inject,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '@/decorators/auth.decorator';
import { Tag } from '@/decorators/tag.decorator';
import { CineService, VideoResponseInfo } from './cine.service';
import { RangeNotSatisfiableException } from './video-stream.util';

@Tag('媒体资源')
@Controller('media/videos')
export class MediaController {
  constructor(@Inject() private readonly cineService: CineService) {}

  @Public()
  @Get(':episodeId')
  async streamEpisode(
    @Param('episodeId') episodeId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const video = await this.cineService.createEpisodeVideoStream(
        episodeId,
        req.headers.range,
      );
      let responseFinished = false;

      this.applyVideoHeaders(res, video);

      video.stream.on('error', (error) => {
        if (!res.headersSent) {
          res.status(500).end();
          return;
        }
        res.destroy(error);
      });

      res.on('finish', () => {
        responseFinished = true;
      });

      res.on('close', () => {
        if (!responseFinished && !video.stream.destroyed) {
          video.stream.destroy();
        }
      });

      video.stream.pipe(res);
    } catch (error) {
      this.applyRangeErrorHeaders(res, error);
      throw error;
    }
  }

  @Public()
  @Head(':episodeId')
  async headEpisode(
    @Param('episodeId') episodeId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const video = await this.cineService.getEpisodeVideoResponseInfo(
        episodeId,
        req.headers.range,
      );

      this.applyVideoHeaders(res, video);
      res.end();
    } catch (error) {
      this.applyRangeErrorHeaders(res, error);
      throw error;
    }
  }

  private applyVideoHeaders(res: Response, video: VideoResponseInfo): void {
    res.status(video.partial ? 206 : 200);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', video.contentType);
    res.setHeader('Content-Length', video.contentLength);
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('ETag', video.etag);
    res.setHeader('Last-Modified', video.lastModified);

    if (video.partial) {
      res.setHeader(
        'Content-Range',
        `bytes ${video.start}-${video.end}/${video.size}`,
      );
    }
  }

  private applyRangeErrorHeaders(res: Response, error: unknown): void {
    if (error instanceof RangeNotSatisfiableException) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', `bytes */${error.size}`);
    }
  }
}
