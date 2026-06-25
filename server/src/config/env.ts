// src/config/env.ts
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { Maybe } from '@cine-stream/common';

// 根据环境加载不同的 .env 文件
const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env';

// {project_root}/.env
const envPath = path.resolve(process.cwd(), envFile);

// 检查文件是否存在
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ 环境变量文件 ${envFile} 已加载`);
} else {
  console.warn(`⚠️  环境变量文件 ${envFile} 不存在，使用系统环境变量`);
}

// 定义环境变量接口（增强类型提示）
export interface EnvConfig {
  // 数据库配置
  DB_MONGO_CONNECTION: Maybe<string>;
  DB_MONGO_USERNAME: Maybe<string>;
  DB_MONGO_PASSWORD: Maybe<string>;

  // 数据迁移配置
  MIGRATE_ON_START: boolean;

  JWT_SECRET: string;

  // 应用配置
  APP_PORT: Maybe<number>;
  APP_HOST: Maybe<string>;
  APP_ENV: 'development' | 'production' | 'test';
  APP_SECRET: string;
  CORS_ORIGIN?: string;

  SESSION_SECRET: string;

  // 可选配置
  LOG_LEVEL?: string;
  DEBUG?: boolean;
  SMTP_HOST?: string;
  SMTP_SECURE?: boolean;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  VIDEO_LIBRARY_ROOT?: string;
  FFMPEG_PATH?: string;
  FFPROBE_PATH?: string;
  MEDIA_THUMBNAIL_TEMP_DIR?: string;
  ALI_OSS_SERVER_BASE_URL?: string;
  ALI_OSS_CLIENT_ID?: string;
  ALI_OSS_CLIENT_SECRET?: string;
  ALI_OSS_TOKEN_REFRESH_INTERVAL_MS?: number;
  ALI_OSS_UPLOAD_OBJECT_PREFIX?: string;
  ALI_OSS_IMAGE_MAX_SIZE_MB?: number;
}

// 环境变量验证器
class EnvValidator {
  static validate() {
    const requiredVars: Array<keyof EnvConfig> = [
      'DB_MONGO_CONNECTION',
      'JWT_SECRET',
      'APP_SECRET',
      'SESSION_SECRET',
    ];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `❌ 缺少必要的环境变量: ${missingVars.join(', ')}\n` +
        `请检查 ${envFile} 文件或系统环境变量`,
      );
    }
  }
}

// 类型安全的获取环境变量函数
export function getEnv<T = any>(key: keyof EnvConfig, defaultValue?: T): T {
  const value = process.env[key];

  if (value === undefined && defaultValue === undefined) {
    throw new Error(`环境变量 ${key} 未设置且无默认值`);
  }

  if (value === undefined) {
    return defaultValue as T;
  }

  // 类型转换
  if (typeof defaultValue === 'number') {
    return parseInt(value, 10) as T;
  }

  if (typeof defaultValue === 'boolean') {
    return (value === 'true') as T;
  }

  if (Array.isArray(defaultValue)) {
    return value.split(',') as T;
  }

  return value as T;
}

// 环境变量配置对象（推荐使用这个）
export const env: EnvConfig = {
  APP_PORT: getEnv('APP_PORT', null),
  APP_HOST: getEnv('APP_HOST', null),
  // 数据库
  DB_MONGO_CONNECTION: getEnv('DB_MONGO_CONNECTION', null),
  DB_MONGO_USERNAME: getEnv('DB_MONGO_USERNAME', null),
  DB_MONGO_PASSWORD: getEnv('DB_MONGO_PASSWORD', null),

  // 数据迁移
  MIGRATE_ON_START: getEnv('MIGRATE_ON_START', false),

  // 应用
  APP_ENV: getEnv('APP_ENV', 'development') as
    | 'development'
    | 'production'
    | 'test',
  APP_SECRET: getEnv('APP_SECRET', 'your-secret-key-change-in-production'),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5210,http://localhost:5211'),

  // JWT
  JWT_SECRET: getEnv('JWT_SECRET'),

  // SESSION
  SESSION_SECRET: getEnv('SESSION_SECRET'),

  // 可选
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
  DEBUG: getEnv('DEBUG', false),
  SMTP_HOST: getEnv('SMTP_HOST', ''),
  SMTP_SECURE: getEnv('SMTP_SECURE', false),
  SMTP_PORT: getEnv('SMTP_PORT', 465),
  SMTP_USER: getEnv('SMTP_USER', ''),
  SMTP_PASS: getEnv('SMTP_PASS', ''),
  VIDEO_LIBRARY_ROOT: getEnv('VIDEO_LIBRARY_ROOT', './media'),
  FFMPEG_PATH: getEnv('FFMPEG_PATH', ''),
  FFPROBE_PATH: getEnv('FFPROBE_PATH', ''),
  MEDIA_THUMBNAIL_TEMP_DIR: getEnv(
    'MEDIA_THUMBNAIL_TEMP_DIR',
    './storage/media-thumbnails',
  ),
  ALI_OSS_SERVER_BASE_URL: getEnv(
    'ALI_OSS_SERVER_BASE_URL',
    'http://localhost:3000',
  ),
  ALI_OSS_CLIENT_ID: getEnv('ALI_OSS_CLIENT_ID', ''),
  ALI_OSS_CLIENT_SECRET: getEnv('ALI_OSS_CLIENT_SECRET', ''),
  ALI_OSS_TOKEN_REFRESH_INTERVAL_MS: getEnv(
    'ALI_OSS_TOKEN_REFRESH_INTERVAL_MS',
    55 * 60 * 1000,
  ),
  ALI_OSS_UPLOAD_OBJECT_PREFIX: getEnv(
    'ALI_OSS_UPLOAD_OBJECT_PREFIX',
    'cinestream/images',
  ),
  ALI_OSS_IMAGE_MAX_SIZE_MB: getEnv('ALI_OSS_IMAGE_MAX_SIZE_MB', 10),
};

// 启动时验证环境变量
EnvValidator.validate();

// 导出类型守卫
export function isProduction(): boolean {
  return env.APP_ENV === 'production';
}

export function isDevelopment(): boolean {
  return env.APP_ENV === 'development';
}

export function isTest(): boolean {
  return env.APP_ENV === 'test';
}
