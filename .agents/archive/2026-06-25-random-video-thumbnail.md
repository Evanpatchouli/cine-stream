# 随机抽取视频缩略图

## 目标

后端生成剧集缩略图时随机抽取视频帧，不再固定抽第 1 秒。

## 改动

- `readVideoMetadata` 将视频时长传给缩略图抽取逻辑。
- `extractAndUploadVideoThumbnail` 优先使用随机 seek 秒数抽帧。
- 长视频在 10% 到 90% 区间随机选秒。
- 短视频在可用秒数内随机选秒。
- 随机抽帧失败时继续兜底尝试 `1s` 和 `0s`。

## 验证

- `pnpm --filter @cine-stream/server build` 通过。
- 使用 `C:\Apps\ffmpeg\bin\ffmpeg.exe` 对同一视频随机 seek 抽帧 3 次，均成功生成 jpg。
- `server/src/modules/cine-module/cine.service.ts` 和 `.agents/current-task.md` 已检查无 UTF-8 BOM。
