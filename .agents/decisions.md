# 决策记录

## 剧集媒体元信息

- 管理端不可编辑剧集时长；时长由后端根据视频资源根目录和剧集 `file_path` 用 ffprobe 解析，并在保存剧集时覆盖写入。
- 后端选择/保存剧集时用 ffmpeg 抽取视频帧作为默认封面，并通过现有 Ali OSS SDK 上传，最终保存 OSS 返回的图片 URL。
- 不新增本地缩略图静态访问接口；本地仅使用 `MEDIA_THUMBNAIL_TEMP_DIR` 作为抽帧上传前的临时目录。
- server 内置 `@ffmpeg-installer/ffmpeg` 和 `@ffprobe-installer/ffprobe`，同时保留 `FFMPEG_PATH`、`FFPROBE_PATH` 环境变量用于部署时覆盖系统二进制路径。

## 播放路由

- 播放页支持 `/play/:id/:episodeId`，当前剧集以路径参数作为状态来源。
- `/play/:id` 作为兼容入口保留，进入后在剧集加载完成时自动补齐到第一集路径。
- 观看历史和继续观看入口优先带上 `episode_id`，普通影视入口不指定剧集，由播放页补齐默认剧集。

## 播放体验

- 客户端播放页默认使用静音自动播放，保证进入播放页后能稳定开始播放；用户仍可通过原生控件手动取消静音。
- 视频元素按 `videoUrl` 设置 `key`，切换剧集时重新加载新的流地址。

## 观看进度

- 观看进度以 `watch_history.position_seconds` 和 `watch_history.duration_seconds` 为事实来源，`progress` 仅作为派生展示字段返回前端。
- 服务端在写入和返回观看历史时统一归一化进度，避免客户端固定百分比或不同页面各算各的造成数据漂移。
- 播放页使用 `GET /api/watch/cines/:cineId/history` 按影视维度读取个人观看记录，用于自动定位上次观看剧集和回填剧集列表进度。
- “继续观看”仅展示真实进度大于 0 且小于 100 的记录；接近片尾的观看记录按已看完处理，不再续播到结尾。

## 影视类型

- 影视类型继续使用字段名 `genre`，但语义改为 `string[]`，避免同时存在 `genre/genres` 两套字段。
- 管理端使用标签式输入，用户可以选择常见类型，也可以直接输入新类型。

## 图片上传

- 管理端影视图片不直接访问 `ali-oss-server`，统一走 cine-stream 后端上传接口，避免前端持有 ali-oss-server 调用凭证。
- ali-oss-server token 获取和刷新封装在后端 SDK 内，调用方只关心上传图片并获得 URL。
- OSS objectKey 由 cine-stream 后端生成，前端不传对象路径，降低覆盖或路径污染风险。
- 管理端图片表单统一使用 Antd `Upload` 的 `picture-card` 单图受控模式，不再提供 URL 文本输入。

## 客户端真实接口化

- 客户端请求封装对齐管理端模式：使用 axios、`createAppRequest`、请求拦截器注入登录 token，响应统一转为 `Resp`。
- 客户端页面不再使用 mock 内容兜底；接口返回空数据时显示空态。
- 观看历史、收藏、个人概览作为独立 `WatchModule` 维护，避免把用户个性化状态塞进影视基础模型。
- 播放页进入影视/剧集时写入观看历史，收藏按钮调用真实收藏接口。

## 项目命名

- 项目统一命名为 `cine-stream`。
- 包名统一使用 `@cine-stream/*`。
- 旧项目名和模板名不进入包名、运行时配置或交付文档。

## 三端结构

- 保留模板管理端目录 `admin`。
- 新增客户端目录 `client`，使用 Vite + TailwindCSS + MUI + Zustand。
- 后端继续使用 NestJS 和 MongoDB/Mongoose。

## RBAC

- 删除模板里和原领域强绑定的角色/权限。
- 当前角色为 `SUPER_ADMIN`、`CONTENT_ADMIN`、`OPERATOR`、`NORMAL_USER`。
- 管理端影视和用户管理权限由新 RBAC 种子数据维护。

## 视频文件

- 视频文件不上传，管理端从 `VIDEO_LIBRARY_ROOT` 浏览服务器磁盘文件。
- 后端只返回根目录内的相对路径、绝对路径；客户端播放使用公开媒体地址 `/media/videos/:episodeId`，不再暴露 `/media-files/*` 静态目录，也不再通过 `/api/cines/episodes/:episodeId/stream` 播放。
- 路径解析会阻止跳出视频根目录。
- Nest 全局前缀继续使用 `/api`，但媒体播放路由显式排除在前缀之外，确保 `/media/*` 可以作为独立缓存边界供后续 Nginx 使用。
- HLS 文件统一写入 `MEDIA_HLS_ROOT`（默认 `./storage/hls`）下的 `episodeId` 子目录，不回写原视频目录。
- 阶段 2A 先做“单集手动生成 HLS”。客户端优先播放 `/media/hls/:episodeId/master.m3u8`，失败后自动回退 `/media/videos/:episodeId`。
- HLS 生成接口改为 Redis + BullMQ 队列：`POST /api/admin/cines/episodes/:episodeId/hls/build` 只负责校验、入队并立即返回 `202`，真正的 ffmpeg 转码在后台串行执行。
- 当前只迁移 HLS 转码队列到 Redis；项目内其他 `cache` 相关能力保持原实现，不与本轮改造绑定。
- `hls_status=processing` 在阶段 2A 异步版中同时表示“已入队 / 正在处理”。管理端通过轮询刷新该状态，不额外引入 `queued` 字段。

## 环境变量

- 各包均提供 `.env`。
- `admin`、`client`、`server` 提供 `.env.production`。
- 后端 MongoDB 统一使用 `mongodb://mongodb:27017/cine-stream`。
- MongoDB 用户名/密码为可选，连接串不带认证时不传 `user/pass`。
- HLS 输出目录通过 `MEDIA_HLS_ROOT` 配置，默认 `./storage/hls`。
- HLS 队列 Redis 连接通过 `REDIS_URL` 配置，默认 `redis://127.0.0.1:6379`。

## 剧集保存

- 管理端保存剧集时不再整批删除重建 episode 文档；若输入携带已有 `episode.id`，后端会尽量复用原文档，保留稳定的 episode id。
- 当 episode 的 `file_path` 变更时，后端会清理该集已有 HLS 产物并重置 HLS 状态，避免新旧源文件混用同一套 HLS 元数据。
- 若 episode 已有可用 HLS，后续补转某个档位失败时，不回滚整集到“完全不可用”；应保留其余可用 variant，并只清理失败档位对应产物。
- 删除影视时要连带清理其全部 episode 的 HLS 目录，避免磁盘残留孤儿转码文件。
- 当 episode 的 HLS 处于 `processing` 时，后端阻止删除 HLS、删除影视，以及更换该剧集的视频源文件，避免后台 ffmpeg 与管理操作冲突。

## 客户端素材

- Stitch 提供的远程图片在本地验证时不稳定。
- 客户端改为使用 `client/public/media` 下的本地 PNG 素材，保证离线和构建后可稳定渲染。
