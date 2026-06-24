# 隐藏原生视频全屏按钮

## 背景

用户希望直接隐藏原生视频控件中的全屏按钮，而不是通过 `controlsList="nofullscreen"` 处理。

## 改动

- 移除播放页 video 上的 `controlsList="nofullscreen"`。
- 新增 `.cine-player video::-webkit-media-controls-fullscreen-button` 样式，隐藏 Chromium/WebKit 原生媒体控件中的全屏按钮。
- 保留页面自定义“全屏播放”按钮，继续对播放器容器全屏，确保自动连播提示层可见。

## 验证

- `pnpm --filter @cine-stream/client build` 通过。
- 静态检查确认播放页不再包含 `controlsList`，CSS 隐藏规则已存在。
- 本次触碰文件已检查无 UTF-8 BOM。

## 注意

Firefox 等不开放原生视频控件细粒度样式的浏览器，可能无法通过该 CSS 隐藏原生全屏按钮。若需要全浏览器完全一致，应改成自定义视频控制条。
