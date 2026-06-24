import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToNumber } from '@/decorators/transform.decorator';

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
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

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
}

export class ReplaceEpisodesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpisodeVideoInputDto)
  episodes: EpisodeVideoInputDto[];
}
