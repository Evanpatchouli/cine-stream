import { randomUUID } from 'crypto';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import AppConfig from '@/app.config';
import { createLogger } from '@/common/logger';

export interface AliOssUploadResult {
  objectKey: string;
  url: string;
  bucket: string;
}

interface TokenResult {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  expiresAt: string;
  clientId: string;
}

interface UploadImageInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

@Injectable()
export class AliOssSdk implements OnModuleInit, OnModuleDestroy {
  private readonly logger = createLogger(AliOssSdk.name);
  private accessToken = '';
  private expiresAt = 0;
  private refreshPromise: Promise<void> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  onModuleInit() {
    const interval = AppConfig.AliOss.TOKEN_REFRESH_INTERVAL_MS;
    if (!this.isConfigured() || interval <= 0) {
      return;
    }

    this.refreshToken(true).catch((error) => {
      this.logger.warn(`OSS token 初始化刷新失败: ${this.readError(error)}`);
    });

    this.refreshTimer = setInterval(() => {
      this.refreshToken(true)
        .then(() => {
          this.logger.info('OSS token 定时刷新成功');
        })
        .catch((error) => {
          this.logger.warn(`OSS token 定时刷新失败: ${this.readError(error)}`);
        });
    }, interval);
  }

  onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  async uploadImage(input: UploadImageInput): Promise<AliOssUploadResult> {
    this.validateImage(input);
    await this.ensureToken();

    const formData = new FormData();
    const bytes = new Uint8Array(input.buffer.byteLength);
    bytes.set(input.buffer);
    const blob = new Blob([bytes], { type: input.mimetype });
    formData.append('file', blob, input.originalname || 'image');
    formData.append('objectKey', this.buildObjectKey(input.originalname));

    const response = await fetch(this.joinUrl('/api/oss/upload'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    const body = (await response
      .json()
      .catch(() => null)) as Partial<AliOssUploadResult> | null;
    if (!response.ok || !body?.url || !body.objectKey || !body.bucket) {
      throw new BadGatewayException(
        `图片上传失败: ${this.readResponseMessage(body, response.statusText)}`,
      );
    }

    return {
      objectKey: body.objectKey,
      url: body.url,
      bucket: body.bucket,
    };
  }

  private async ensureToken(): Promise<void> {
    this.assertConfigured();
    if (this.accessToken && this.expiresAt - Date.now() > 60_000) {
      return;
    }
    await this.refreshToken(true);
  }

  private async refreshToken(force = false): Promise<void> {
    this.assertConfigured();
    if (!force && this.accessToken && this.expiresAt - Date.now() > 60_000) {
      return;
    }
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.requestToken().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async requestToken(): Promise<void> {
    const response = await fetch(this.joinUrl('/api/auth/token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: AppConfig.AliOss.CLIENT_ID,
        clientSecret: AppConfig.AliOss.CLIENT_SECRET,
      }),
    });

    const body = (await response
      .json()
      .catch(() => null)) as Partial<TokenResult> | null;
    if (!response.ok || !body?.accessToken || !body.expiresAt) {
      throw new BadGatewayException(
        `OSS token 获取失败: ${this.readResponseMessage(body, response.statusText)}`,
      );
    }

    this.accessToken = body.accessToken;
    this.expiresAt = new Date(body.expiresAt).getTime();
  }

  private validateImage(input: UploadImageInput): void {
    if (!input?.buffer?.length) {
      throw new BadRequestException('请选择图片文件');
    }
    if (!IMAGE_MIME_TYPES.has(input.mimetype)) {
      throw new BadRequestException('仅支持 png、jpg、webp、gif 图片');
    }

    const maxBytes = AppConfig.AliOss.IMAGE_MAX_SIZE_MB * 1024 * 1024;
    if (input.buffer.length > maxBytes) {
      throw new BadRequestException(
        `图片大小不能超过 ${AppConfig.AliOss.IMAGE_MAX_SIZE_MB}MB`,
      );
    }
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('OSS 上传服务未配置');
    }
  }

  private isConfigured(): boolean {
    return Boolean(
      AppConfig.AliOss.SERVER_BASE_URL &&
      AppConfig.AliOss.CLIENT_ID &&
      AppConfig.AliOss.CLIENT_SECRET,
    );
  }

  private buildObjectKey(originalname: string): string {
    const now = new Date();
    const dayPath = now.toISOString().slice(0, 10).replaceAll('-', '/');
    const prefix = AppConfig.AliOss.UPLOAD_OBJECT_PREFIX.replace(
      /^\/+|\/+$/g,
      '',
    );
    const filename = this.sanitizeFilename(originalname);
    return `${prefix}/${dayPath}/${Date.now()}-${randomUUID()}-${filename}`;
  }

  private sanitizeFilename(originalname: string): string {
    const filename = originalname?.trim() || 'image';
    const sanitized = filename
      .replace(/[\\/:*?"<>|]+/gu, '-')
      .replace(/[\x00-\x1F\x7F]+/gu, '')
      .trim();
    return (sanitized || 'image').slice(0, 180);
  }

  private joinUrl(path: string): string {
    return `${AppConfig.AliOss.SERVER_BASE_URL.replace(/\/+$/g, '')}${path}`;
  }

  private readResponseMessage(
    body: Record<string, any> | null,
    fallback: string,
  ): string {
    return body?.message || body?.error || fallback || '未知错误';
  }

  private readError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
