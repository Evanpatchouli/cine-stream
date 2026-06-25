# 当前任务

## 进行中

- 2026-06-26：视频访问性能优化
  - 目标：把剧集播放入口从 `/api/cines/episodes/:id/stream` 迁移到 `/media/videos/:id`，并加固 HTTP Range、HEAD 与缓存友好响应头。
  - 范围：
    - 后端新增/调整公开媒体路由
    - 服务端 Range 异常语义与响应头完善
    - 客户端媒体 URL 解析适配 `/media/*`
    - 补充测试与 README
  - 非目标：
    - 不实现 HLS
    - 不实现 Nginx 缓存
    - 不改动视频目录结构
  - 当前进度：
    - 阶段 1 已完成
    - 阶段 2 HLS 与阶段 3 Nginx 缓存尚未开始

### 最近完成

- 2026-06-25：客户端真实观看进度与续播恢复，已归档到 `.agents/archive/2026-06-25-client-real-watch-progress.md`。

### 状态

- 阶段 1 已完成，等待是否继续进入 HLS 实施。
