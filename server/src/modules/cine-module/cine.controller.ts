import { Controller, Get, Header, Inject, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import Resp from '@/common/models/Resp';
import { Auth, Public } from '@/decorators/auth.decorator';
import { Tag } from '@/decorators/tag.decorator';
import { CineService } from './cine.service';

@Auth()
@Tag('客户端影视')
@Controller('cines')
export class CineController {
  constructor(@Inject() private readonly cineService: CineService) {}

  @Get()
  async findAll(): Promise<Resp<Record<string, any>[]>> {
    const cines = await this.cineService.findAll();
    return Resp.success(cines);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<Resp<Record<string, any>>> {
    const cine = await this.cineService.getDetail(id);
    return Resp.success(cine);
  }

  @Public()
  @Get('episodes/:episodeId/stream')
  @Header('Accept-Ranges', 'bytes')
  async streamEpisode(
    @Param('episodeId') episodeId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const video = await this.cineService.createEpisodeVideoStream(
      episodeId,
      req.headers.range,
    );

    res.status(video.partial ? 206 : 200);
    res.setHeader('Content-Type', video.contentType);
    res.setHeader('Content-Length', video.contentLength);
    res.setHeader('Accept-Ranges', 'bytes');
    if (video.partial) {
      res.setHeader(
        'Content-Range',
        `bytes ${video.start}-${video.end}/${video.size}`,
      );
    }

    video.stream.pipe(res);
  }
}
