import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '@/decorators/auth.decorator';
import { Tag } from '@/decorators/tag.decorator';
import { CineService } from './cine.service';

@Tag('HLS 媒体资源')
@Controller('media/hls')
export class MediaHlsController {
  constructor(@Inject() private readonly cineService: CineService) {}

  @Public()
  @Get(':episodeId/master.m3u8')
  async getMasterPlaylist(
    @Param('episodeId') episodeId: string,
    @Res() res: Response,
  ): Promise<void> {
    const asset = await this.cineService.createEpisodeHlsAssetStream(
      episodeId,
      'master.m3u8',
    );

    res.status(200);
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Content-Length', asset.contentLength);
    res.setHeader('Cache-Control', asset.cacheControl);
    res.setHeader('ETag', asset.etag);
    res.setHeader('Last-Modified', asset.lastModified);

    asset.stream.on('error', (error) => {
      if (!res.headersSent) {
        res.status(500).end();
        return;
      }
      res.destroy(error);
    });

    asset.stream.pipe(res);
  }

  @Public()
  @Get(':episodeId/:profile/:fileName')
  async getVariantAsset(
    @Param('episodeId') episodeId: string,
    @Param('profile') profile: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<void> {
    const asset = await this.cineService.createEpisodeHlsAssetStream(
      episodeId,
      `${profile}/${fileName}`,
    );

    res.status(200);
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Content-Length', asset.contentLength);
    res.setHeader('Cache-Control', asset.cacheControl);
    res.setHeader('ETag', asset.etag);
    res.setHeader('Last-Modified', asset.lastModified);

    asset.stream.on('error', (error) => {
      if (!res.headersSent) {
        res.status(500).end();
        return;
      }
      res.destroy(error);
    });

    asset.stream.pipe(res);
  }
}
