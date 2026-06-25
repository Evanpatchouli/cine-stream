import {
  IsIn,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToNumber } from '@/decorators/transform.decorator';
import { HLS_PROFILE_VALUES } from './hls.util';

export class QueryCinePageDto {
  @IsNotEmpty()
  @ToNumber()
  page: number;

  @IsNotEmpty()
  @ToNumber()
  size: number;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class EpisodeVideoInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsNotEmpty()
  @IsString()
  file_path: string;

  @IsOptional()
  @IsString()
  file_url?: string;
}

export class CreateCineDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genre?: string[];

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  season?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsString()
  backdrop?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  meta?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cast?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpisodeVideoInputDto)
  episodes?: EpisodeVideoInputDto[];
}

export class UpdateCineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genre?: string[];

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  season?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsString()
  backdrop?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  meta?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cast?: string[];
}

export class ReplaceEpisodesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpisodeVideoInputDto)
  episodes: EpisodeVideoInputDto[];
}

export class UpdateMediaRootDto {
  @IsNotEmpty()
  @IsString()
  root: string;
}

export class BuildEpisodeHlsDto {
  @IsOptional()
  @IsString()
  @IsIn(HLS_PROFILE_VALUES)
  profile?: string;
}
