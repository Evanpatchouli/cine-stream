# 客户端真实观看进度与续播恢复

## 目标

把继续观看、观看历史、播放页剧集列表中的伪进度替换为真实进度，并支持重新进入播放页时从上次观看位置续播。

## 改动

- 后端新增 `server/src/modules/watch-module/watch-progress.ts`，统一按 `position_seconds` 和 `duration_seconds` 归一化观看进度。
- 后端 `recordHistory` 和 `listHistory` 改为使用归一化后的真实进度，避免前端传入固定百分比污染数据。
- 后端新增 `GET /api/watch/cines/:cineId/history`，用于播放页查询当前影视下各剧集的个人观看记录。
- 客户端播放页改为持续上报真实播放位置，并在暂停、拖动、切集、离页时强制 flush。
- 客户端播放页续播恢复从 `onLoadedMetadata` 中拆出，改为等待“历史已加载 + 元数据已就绪”后再执行，修复历史晚于视频返回时从头播放的问题。
- 客户端首页继续观看、观看历史、播放页剧集列表统一展示真实进度；继续观看仅保留未看完记录。
- 后端新增 `watch-progress.spec.ts`，覆盖按秒数计算进度、片尾视为看完、无总时长回退到显式百分比的场景。

## 验证

- `pnpm --filter @cine-stream/server test -- watch-progress.spec.ts` 通过。
- `pnpm --filter @cine-stream/server build` 通过。
- `pnpm --filter @cine-stream/client build` 通过。
- 人工测试确认：重新进入播放页时可按上次观看位置正常续播。

## 注意

- 当前“已看完”判定为观看比例达到 98% 或剩余时长不超过 3 秒；满足条件的记录不会再从片尾附近续播。
- 播放页写回历史时已加基础节流，避免 `timeupdate` 过于频繁地触发请求。
