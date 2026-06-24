# 客户端播放页自动连播

## 目标

播放页增加可开关的自动连播能力，并在播放结束后先展示提示，5 秒后再播放下一集。

## 改动

- `client/src/pages/PlaybackPage.tsx` 增加“自动连播”开关。
- 开关默认开启，并通过 `localStorage` 记忆用户选择。
- 视频 `onEnded` 时，如果存在下一集且开关开启，展示“即将播放下一集”提示层。
- 提示层 5 秒倒计时后跳转到下一集播放路径。
- 提示层支持“立即播放”和“取消”。
- 手动切换剧集时会清除待跳转倒计时。
- 最后一集结束时不循环。

## 验证

- `pnpm --filter @cine-stream/client build` 通过。
- `client/src/pages/PlaybackPage.tsx` 和 `.agents/current-task.md` 已检查无 UTF-8 BOM。
- 浏览器验证客户端实际运行在 `http://localhost:5174/#/play/...`，播放页“自动连播”开关渲染正常、可切换、控制台无相关错误。

## 限制

- 未等待真实视频播放到片尾触发 ended；倒计时跳转后续适合用短视频夹具或测试入口做完整自动化覆盖。
