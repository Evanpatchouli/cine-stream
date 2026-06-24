# 归档任务：图片上传框与视频默认缩略图回显

## 目标

管理端所有图片表单项改为矩形图片上传框，不再展示 URL 输入框；选择视频后后端抽帧上传 OSS，管理端用返回的图片地址直接回显缩略图。

## 完成情况

- [x] `ImageUploadInput` 改为 Antd `Upload` 的 `picture-card` 单图受控模式。
- [x] 影视海报、背景图、剧集缩略图统一使用图片上传卡片。
- [x] 选择视频后使用 `media/info` 返回的 `thumbnail` 直接覆盖展示。
- [x] 后端保存剧集时，如果已有缩略图 URL，则不重复抽帧上传 OSS。
- [x] `pnpm --filter @cine-stream/admin build` 通过。
- [x] `pnpm --filter @cine-stream/server build` 通过。
- [x] 本次触碰文本文件 BOM 检查通过。

## 参考

- Ant Design Upload 文档：`listType="picture-card"`、`maxCount={1}` 和受控 `fileList`。
