import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PaginatedResult } from '@cine-stream/common';
import Resp from '@/common/models/Resp';
import { Auth, RoleIn } from '@/decorators/auth.decorator';
import { Tag } from '@/decorators/tag.decorator';
import {
  CreateCineDto,
  QueryCinePageDto,
  ReplaceEpisodesDto,
  UpdateCineDto,
} from '../cine-module/dto';
import { CineService, MediaFileItem } from '../cine-module/cine.service';

@Auth()
@Tag('影视管理')
@Controller('admin/cines')
export class AdminCineController {
  constructor(@Inject() private readonly cineService: CineService) {}

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
  @Get('media/files')
  async listVideoFiles(@Query('dir') dir?: string): Promise<
    Resp<{
      root: string;
      current: string;
      items: MediaFileItem[];
    }>
  > {
    const result = await this.cineService.listVideoFiles(dir);
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

  @RoleIn('SUPER_ADMIN', 'CONTENT_ADMIN')
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Resp<void>> {
    await this.cineService.delete(id);
    return Resp.success();
  }
}
