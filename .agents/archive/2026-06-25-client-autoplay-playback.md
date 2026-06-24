# 归档任务：播放页进入后自动播放

## 目标

播放页拿到剧集视频地址后自动开始播放，避免用户进入播放页还需要再手动点击播放。

## 完成情况

- [x] 播放页视频元素开启 `autoPlay`、`muted`、`playsInline` 和 `preload="auto"`。
- [x] 视频元素按 `videoUrl` 设置 `key`，切换剧集时重新加载播放。
- [x] `pnpm --filter @cine-stream/client build` 通过。
- [x] 本次触碰文本文件 BOM 检查通过。
