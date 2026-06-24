import * as path from 'path';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { env } from './config/env';

export default class AppConfig {
  public static readonly Process = {
    ROOT: process.cwd(),
  };
  public static readonly Server = {
    HOST: env.APP_HOST || '0.0.0.0',
    PORT: env.APP_PORT || 8793,
    CORS_ORIGINS: (env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };

  public static readonly DataBase = {
    Mongo: {
      CONNECTION: env.DB_MONGO_CONNECTION as string,
      USERNAME: env.DB_MONGO_USERNAME as string,
      PASSWORD: env.DB_MONGO_PASSWORD as string,
    } as const,
  };

  public static readonly Migrator = {
    on: env.MIGRATE_ON_START,
    waitAfter: 1000,
  };

  public static readonly Jwt = {
    SK: env.JWT_SECRET,
    TTL: '7d',
  } as const;

  public static readonly Log4js = {
    level: env.LOG_LEVEL || 'info',
    path: './logs',
    prefix: '',
    // prefix: '【萌宠空间】'
  } as const;

  public static readonly Session = {
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  };

  public static readonly SMTP = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  };

  public static readonly Media = {
    VIDEO_LIBRARY_ROOT: env.VIDEO_LIBRARY_ROOT || './media',
    FFMPEG_PATH: env.FFMPEG_PATH || ffmpegInstaller.path || 'ffmpeg',
    FFPROBE_PATH: env.FFPROBE_PATH || ffprobeInstaller.path || 'ffprobe',
    THUMBNAIL_TEMP_DIR: path.resolve(
      process.cwd(),
      env.MEDIA_THUMBNAIL_TEMP_DIR || './storage/media-thumbnails',
    ),
  };

  public static readonly AliOss = {
    SERVER_BASE_URL: env.ALI_OSS_SERVER_BASE_URL || 'http://localhost:3000',
    CLIENT_ID: env.ALI_OSS_CLIENT_ID || '',
    CLIENT_SECRET: env.ALI_OSS_CLIENT_SECRET || '',
    TOKEN_REFRESH_INTERVAL_MS:
      env.ALI_OSS_TOKEN_REFRESH_INTERVAL_MS || 55 * 60 * 1000,
    UPLOAD_OBJECT_PREFIX:
      env.ALI_OSS_UPLOAD_OBJECT_PREFIX || 'cinestream/images',
    IMAGE_MAX_SIZE_MB: env.ALI_OSS_IMAGE_MAX_SIZE_MB || 10,
  };
}
