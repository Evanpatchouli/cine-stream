# 修复方案：真机续播先跳到历史位置又回到开头

## 问题

真机播放页进入后，进度条会先显示为上次观看位置，但视频很快又从开头开始播放，最终续播失败。

## 根因

- 前端最近引入了后端 `duration_seconds` 兜底后，续播恢复 effect 会比原来更早触发。
- 对原生 HLS 来说，时长可用不代表媒体已经真正可 seek。
- 旧实现里一旦执行 `video.currentTime = resumeAt`，就立刻把该剧集标记为“已恢复”，同时更新 UI 进度。
- 真机浏览器随后如果把播放位置回退到 `0`，前端不会再补一次恢复，形成“假成功”。

## 方案

- 续播恢复继续保留独立 `useEffect`，但把“恢复成功”判定改为基于真实媒体位置，而不是基于一次赋值动作。
- 只有当媒体满足可 seek 条件后，才尝试设置 `video.currentTime`：
  - 原生 HLS 优先检查 `video.seekable`
  - 直链视频可在 `HAVE_CURRENT_DATA` 及以上时兜底尝试
- 不再在发起恢复时立刻 `setCurrentTime(resumeAt)` 或立即写入“已恢复”标记。
- 只有当后续事件和媒体状态表明确实到达目标位置后，才把该集标记为恢复完成。
- 使用 `loadedmetadata / durationchange / loadeddata / canplay / seeked` 作为恢复重试检查点，覆盖真机原生 HLS 的时序差异。

## 适用场景

- Android / iOS 真机浏览器播放原生 HLS
- 播放器已经拿到历史记录和时长，但媒体 seek 能力晚于时长可用
