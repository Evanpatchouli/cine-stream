# 播放器全屏显示连播提示

## 背景

全屏播放时看不到自动连播倒计时提示层。原因是用户点击原生 video 全屏入口时，浏览器只把 `<video>` 元素放入 fullscreen tree，React 外层提示层不会一起显示。

## 改动

- 客户端播放页新增播放器容器 `.cine-player`，全屏入口改为对该容器调用 Fullscreen API。
- 播放器右上角新增“全屏播放”按钮。
- 通过 `.cine-player video::-webkit-media-controls-fullscreen-button` 隐藏 Chromium/WebKit 原生 video 全屏入口。
- fullscreen CSS 让 `.cine-player` 铺满屏幕，并在全屏下使用 `object-fit: contain` 展示视频。
- 自动连播提示层提升为 `z-20`，确保覆盖在播放器内容上方。

## 验证

- `pnpm --filter @cine-stream/client build` 通过。
- 内置 Browser 打开播放页，验证“全屏播放”按钮唯一可见、页面非空白、无框架错误、控制台无相关错误。

## 注意

内置 Browser 未实际进入 fullscreen，疑似测试容器限制。真实浏览器中需通过页面内“全屏播放 / 切换到影院视图”入口进入全屏，才能保证连播提示层随播放器容器一起显示。原生视频全屏按钮的 CSS 隐藏规则主要覆盖 Chromium / WebKit。
