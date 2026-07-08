import {
  IsIn,
  IsMongoId,
  IsOptional,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
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

export class QueryWatchHistoryPageDto {
  @IsOptional()
  @ToNumber(1)
  @IsNumber()
  page?: number;

  @IsOptional()
  @ToNumber(20)
  @IsNumber()
  size?: number;
}

export class QueryCollectionPageDto {
  @IsOptional()
  @ToNumber(1)
  @IsNumber()
  page?: number;

  @IsOptional()
  @ToNumber(100)
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  @IsIn(['downloaded', 'watching'])
  status?: 'downloaded' | 'watching';
}
