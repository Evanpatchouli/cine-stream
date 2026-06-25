<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## CineStream 配置

### CORS

前端请求携带 credentials 时，后端不能返回 `Access-Control-Allow-Origin: *`。本项目通过 `CORS_ORIGIN` 配置允许的前端源，多个地址用英文逗号分隔。

```env
CORS_ORIGIN=http://localhost:5210,http://localhost:5211
```

### Ali OSS 图片上传

管理端影视海报、背景图和剧集缩略图通过独立的 `ali-oss-server` 服务上传。后端会用 `ALI_OSS_CLIENT_ID` 和 `ALI_OSS_CLIENT_SECRET` 换取 token，并按配置间隔自动刷新。

```env
ALI_OSS_SERVER_BASE_URL=http://localhost:3000
ALI_OSS_CLIENT_ID=
ALI_OSS_CLIENT_SECRET=
ALI_OSS_TOKEN_REFRESH_INTERVAL_MS=3300000
ALI_OSS_UPLOAD_OBJECT_PREFIX=cinestream/images
ALI_OSS_IMAGE_MAX_SIZE_MB=10
```

`ALI_OSS_TOKEN_REFRESH_INTERVAL_MS` 默认是 55 分钟。上传接口为 `POST /api/admin/cines/images`，仅接受图片文件。

### 视频元信息与默认封面

管理端配置剧集时，后端会用 ffprobe 读取视频时长，并用 ffmpeg 抽取一帧作为默认缩略图。项目已内置 `@ffmpeg-installer/ffmpeg` 和 `@ffprobe-installer/ffprobe`，也可以通过环境变量覆盖为系统安装路径。

```env
FFMPEG_PATH=
FFPROBE_PATH=
MEDIA_THUMBNAIL_TEMP_DIR=./storage/media-thumbnails
MEDIA_HLS_ROOT=./storage/hls
REDIS_URL=redis://127.0.0.1:6379
```

生成的默认封面会先落到 `MEDIA_THUMBNAIL_TEMP_DIR` 临时目录，再通过现有 Ali OSS SDK 上传；剧集保存的是 OSS 返回的图片访问链接。

### 媒体播放

剧集视频统一通过公开地址 `/media/videos/:episodeId` 播放，不再走 `/api` 前缀。该接口会根据剧集 `file_path` 从视频资源根目录读取文件，并返回支持 HTTP Range 的流式响应，包含：

- `Accept-Ranges: bytes`
- `Content-Length`
- `Content-Type`
- `ETag`
- `Last-Modified`
- `Cache-Control`

带 `Range` 请求头时会返回 `206 Partial Content`；无效范围会返回 `416 Requested Range Not Satisfiable`，同时带 `Content-Range: bytes */total`。

### HLS

管理端可以对单集手动生成 HLS：

- `POST /api/admin/cines/episodes/:episodeId/hls/build`
- `DELETE /api/admin/cines/episodes/:episodeId/hls`

其中 `build` 接口现在返回 `202 Accepted`，表示任务已加入基于 Redis + BullMQ 的后台 HLS 队列；真正的 ffmpeg 转码会在请求返回后异步执行。管理端会根据 `hls_status` 轮询刷新状态。

请求不带 `profile` 时，后端会默认优先生成 `720p`；如果源视频高度不足，会自动降到可用的默认档位。也可以显式指定：

- `1080p`
- `720p`
- `360p`

生成后的公开播放地址：

- master playlist: `/media/hls/:episodeId/master.m3u8`
- variant playlist / segment: `/media/hls/:episodeId/:profile/:fileName`

当前 HLS 文件默认落在 `MEDIA_HLS_ROOT` 对应目录下的 `./storage/hls/<episodeId>/`，不修改原视频目录结构。

当前后台任务模型是“Redis + BullMQ 单 worker 队列”：

- 当前仅 HLS 转码队列使用 Redis；项目内其他 `cache` 相关能力保持原实现，不一起迁移
- 同一时间串行执行 HLS 转码，避免多路 ffmpeg 抢占机器资源
- 任务元数据落在 Redis 中，服务重启后待处理任务仍可继续由 BullMQ 接手；启动时也会对遗留 `processing` 状态做一次对账自愈
- 当剧集 HLS 处于 `processing` 时，后端会阻止删除 HLS、删除影视，或更换该剧集的视频文件，避免转码与写盘互相冲突

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
