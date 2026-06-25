import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Readable } from 'stream';
import { App } from 'supertest/types';
import { CineService, VideoResponseInfo, VideoStreamInfo } from './cine.service';
import { MediaController } from './media.controller';
import { RangeNotSatisfiableException } from './video-stream.util';

describe('MediaController', () => {
  let app: INestApplication<App>;

  const videoInfo: VideoResponseInfo = {
    absolutePath: 'E:/videos/demo.mp4',
    size: 4096,
    start: 0,
    end: 4095,
    contentLength: 4096,
    contentType: 'video/mp4',
    partial: false,
    etag: 'W/"1000-2000"',
    lastModified: 'Thu, 26 Jun 2026 00:00:00 GMT',
  };

  const cineService = {
    createEpisodeVideoStream: jest.fn<
      Promise<VideoStreamInfo>,
      [string, string | undefined]
    >(),
    getEpisodeVideoResponseInfo: jest.fn<
      Promise<VideoResponseInfo>,
      [string, string | undefined]
    >(),
  } satisfies Partial<CineService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: CineService,
          useValue: cineService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /media/videos/:episodeId 返回流式响应头', async () => {
    cineService.createEpisodeVideoStream.mockResolvedValue({
      ...videoInfo,
      stream: Readable.from(Buffer.alloc(videoInfo.contentLength, 1)),
    });

    await request(app.getHttpServer())
      .get('/media/videos/episode-1')
      .expect(200)
      .expect('Accept-Ranges', 'bytes')
      .expect('Content-Type', 'video/mp4')
      .expect('ETag', videoInfo.etag)
      .expect('Last-Modified', videoInfo.lastModified)
      .expect('Cache-Control', 'public, max-age=0, must-revalidate');
  });

  it('HEAD /media/videos/:episodeId 返回响应头不下发实体', async () => {
    cineService.getEpisodeVideoResponseInfo.mockResolvedValue(videoInfo);

    const response = await request(app.getHttpServer())
      .head('/media/videos/episode-1')
      .expect(200)
      .expect('Accept-Ranges', 'bytes')
      .expect('Content-Type', 'video/mp4');

    expect(response.text).toBeUndefined();
  });

  it('Range 无效时返回 416 并附带 Content-Range', async () => {
    cineService.createEpisodeVideoStream.mockRejectedValue(
      new RangeNotSatisfiableException(4096),
    );

    await request(app.getHttpServer())
      .get('/media/videos/episode-1')
      .set('Range', 'bytes=9999-10000')
      .expect(416)
      .expect('Content-Range', 'bytes */4096')
      .expect('Accept-Ranges', 'bytes');
  });
});
