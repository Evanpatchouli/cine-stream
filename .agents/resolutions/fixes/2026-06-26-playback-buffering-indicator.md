# 修复方案：播放页缺少视频阻塞/首帧加载中的中央 loading 提示

## 问题

播放页在视频首帧未就绪或网络等待缓冲时，没有统一的中央 loading 提示，用户会误以为播放器失效或点击无响应。

## 根因

- 当前播放器只维护播放状态和控制条显隐，没有独立建模“视频正在缓冲”这一状态。
- HLS 与直链共用同一个 `<video>` 元素，但没有统一消费 `loadstart`、`waiting`、`stalled`、`seeking` 等媒体事件。
- 移动端场景下，不能把“用户主动拖动进度条 seek”和“真实网络缓冲”混为一谈；否则 loading 遮罩和连续 seek 会打断 touch 手势。

## 方案

- 在 `PlaybackPage` 中增加独立的 `isVideoBuffering` 状态。
- 源切换时默认进入缓冲态，直到视频具备可播放数据后退出。
- 统一监听视频事件：
  - 进入 loading：`loadstart`、`waiting`、`stalled`
  - 退出 loading：`loadeddata`、`canplay`、`playing`、`seeked`、`pause`、`ended`、`error`
- 通过 `readyState + paused + seeking` 区分“用户主动暂停”和“播放中断缓冲”，避免暂停时误显示转圈。
- 对进度条引入独立 `scrubbing` 状态，拖动时只预览位置、松手后再真正提交 seek，并在 scrubbing 期间抑制中央 loading。
- UI 采用播放器中央悬浮的半透明圆形遮罩，不影响现有控制层和 HLS / 直链切换逻辑。

## 适用场景

- 首次进入播放页等待首帧加载
- 播放过程中网络抖动导致 `waiting/stalled`
- 用户拖动进度条后松手触发 seek，如目标位置需要继续加载，再展示缓冲提示
