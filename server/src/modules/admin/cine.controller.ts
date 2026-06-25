import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginatedResult } from '@cine-stream/common';
import Resp from '@/common/models/Resp';
import { Auth, RoleIn } from '@/decorators/auth.decorator';
import { Tag } from '@/decorators/tag.decorator';
import { AliOssSdk, AliOssUploadResult } from '../oss-module/ali-oss.sdk';
import {
  BuildEpisodeHlsDto,
  CreateCineDto,
  QueryCinePageDto,
  ReplaceEpisodesDto,
  UpdateMediaRootDto,
  UpdateCineDto,
} from '../cine-module/dto';
import { EpisodeHlsJobService } from '../cine-module/episode-hls.job.service';
import {
  CineService,
  MediaFileItem,
  MediaInfo,
} from '../cine-module/cine.service';

@Auth()
@Tag('影视管理')
@Controller('admin/cines')
export class AdminCineController {
  constructor(
    @Inject() private readonly cineService: CineService,
    @Inject() private readonly episodeHlsJobService: EpisodeHlsJobService,
    @Inject() private readonly aliOssSdk: AliOssSdk,
  ) {}

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Get()
  async queryPage(
    @Query() query: QueryCinePageDto,
  ): Promise<Resp<PaginatedResult<Record<string, any>>>> {
    const result = await this.cineService.findPage(
      query.page,
      query.size,
      query.keyword,
    );
    return Resp.success(result);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Post()
  async create(@Body() dto: CreateCineDto): Promise<Resp<Record<string, any>>> {
    const cine = await this.cineService.create(dto);
    return Resp.success(cine);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Post('images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file?: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
    },
  ): Promise<Resp<AliOssUploadResult>> {
    if (!file) {
      throw new BadRequestException('请选择图片文件');
    }
    const result = await this.aliOssSdk.uploadImage(file);
    return Resp.success(result);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Get('media/files')
  async listVideoFiles(@Query('dir') dir?: string): Promise<
    Resp<{
      root: string;
      configured_root: string;
      current: string;
      items: MediaFileItem[];
    }>
  > {
    const result = await this.cineService.listVideoFiles(dir);
    return Resp.success(result);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Get('media/info')
  async getMediaInfo(@Query('path') filePath?: string): Promise<Resp<MediaInfo>> {
    if (!filePath) {
      throw new BadRequestException('请选择视频文件');
    }
    const result = await this.cineService.getMediaInfo(filePath);
    return Resp.success(result);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Get('media/root')
  async getMediaRoot(): Promise<
    Resp<{
      root: string;
      configured_root: string;
    }>
  > {
    const result = await this.cineService.getMediaRoot();
    return Resp.success(result);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Put('media/root')
  async updateMediaRoot(
    @Body() dto: UpdateMediaRootDto,
  ): Promise<
    Resp<{
      root: string;
      configured_root: string;
    }>
  > {
    const result = await this.cineService.updateMediaRoot(dto.root);
    return Resp.success(result);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<Resp<Record<string, any>>> {
    const cine = await this.cineService.getDetail(id);
    return Resp.success(cine);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCineDto,
  ): Promise<Resp<Record<string, any>>> {
    const cine = await this.cineService.update(id, dto);
    return Resp.success(cine);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Put(':id/episodes')
  async replaceEpisodes(
    @Param('id') id: string,
    @Body() dto: ReplaceEpisodesDto,
  ): Promise<Resp<Record<string, any>>> {
    const cine = await this.cineService.replaceEpisodes(id, dto.episodes);
    return Resp.success(cine);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Post('episodes/:episodeId/hls/build')
  @HttpCode(202)
  async buildEpisodeHls(
    @Param('episodeId') episodeId: string,
    @Body() dto: BuildEpisodeHlsDto,
  ): Promise<Resp<Record<string, any>>> {
    const episode = await this.episodeHlsJobService.enqueueBuild(
      episodeId,
      dto.profile,
    );
    return Resp.success(episode);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN', 'OPERATOR')
  @Delete('episodes/:episodeId/hls')
  async deleteEpisodeHls(
    @Param('episodeId') episodeId: string,
  ): Promise<Resp<Record<string, any>>> {
    const episode = await this.cineService.deleteEpisodeHls(episodeId);
    return Resp.success(episode);
  }

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN')
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Resp<void>> {
    await this.cineService.delete(id);
    return Resp.success();
  }
}
