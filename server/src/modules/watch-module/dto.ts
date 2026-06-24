import { IsMongoId, IsOptional, IsNumber, Max, Min } from 'class-validator';
import { ToNumber } from '@/decorators/transform.decorator';

export class RecordWatchHistoryDto {
  @IsMongoId()
  cine_id: string;

  @IsOptional()
  @IsMongoId()
  episode_id?: string;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  position_seconds?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  duration_seconds?: number;
}
