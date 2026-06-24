import { Body, Controller, Delete, Get, Inject, Param, Post } from '@nestjs/common';
import type { AuthTokenPayload } from '@/auth/jwt';
import Resp from '@/common/models/Resp';
import { Auth } from '@/decorators/auth.decorator';
import { CurrentUser } from '@/decorators/request-meta.decorator';
import { Tag } from '@/decorators/tag.decorator';
import { RecordWatchHistoryDto } from './dto';
import { WatchService } from './watch.service';

@Auth()
@Tag('客户端观看数据')
@Controller('watch')
export class WatchController {
  constructor(@Inject() private readonly watchService: WatchService) {}

  @Get('history')
  async listHistory(
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<Resp<Record<string, any>[]>> {
    const result = await this.watchService.listHistory(user.id);
    return Resp.success(result);
  }

  @Post('history')
  async recordHistory(
    @CurrentUser() user: AuthTokenPayload,
    @Body() dto: RecordWatchHistoryDto,
  ): Promise<Resp<Record<string, any>>> {
    const result = await this.watchService.recordHistory(user.id, dto);
    return Resp.success(result);
  }

  @Get('collections')
  async listCollections(
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<Resp<Record<string, any>[]>> {
    const result = await this.watchService.listCollections(user.id);
    return Resp.success(result);
  }

  @Post('collections/:cineId')
  async addCollection(
    @CurrentUser() user: AuthTokenPayload,
    @Param('cineId') cineId: string,
  ): Promise<Resp<Record<string, any>>> {
    const result = await this.watchService.addCollection(user.id, cineId);
    return Resp.success(result);
  }

  @Delete('collections/:cineId')
  async removeCollection(
    @CurrentUser() user: AuthTokenPayload,
    @Param('cineId') cineId: string,
  ): Promise<Resp<void>> {
    await this.watchService.removeCollection(user.id, cineId);
    return Resp.success();
  }

  @Get('overview')
  async getOverview(
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<Resp<{ watched_count: number; saved_count: number }>> {
    const result = await this.watchService.getOverview(user.id);
    return Resp.success(result);
  }
}
