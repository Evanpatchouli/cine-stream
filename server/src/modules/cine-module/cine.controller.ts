import { Controller, Get, Inject, Param } from '@nestjs/common';
import Resp from '@/common/models/Resp';
import { Auth } from '@/decorators/auth.decorator';
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
}
