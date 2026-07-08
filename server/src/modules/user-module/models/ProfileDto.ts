import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;
}

export class UpdateAvatarDto {
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class PlaybackPreferencesDto {
  @IsOptional()
  @IsBoolean()
  auto_play_next?: boolean;

  @IsOptional()
  @IsBoolean()
  default_muted?: boolean;
}
