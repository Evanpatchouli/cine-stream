# 归档任务：优化剧集配置布局并后端读取媒体信息

## 目标

管理端“配置剧集”弹窗里的剧集列表项改为两行布局，操作栏水平居中；视频时长和默认封面由后端根据视频文件生成。

## 完成情况

- [x] 管理端剧集配置从横向表格改为两行列表项布局。
- [x] 操作按钮移动到列表项右侧并水平居中。
- [x] 管理端图片表单统一改为 Antd `Upload` 图片卡片，不再展示 URL 输入框。
- [x] 剧集时长改为只读展示，不再随保存请求提交。
- [x] 后端新增 `GET /api/admin/cines/media/info`，返回视频时长和默认缩略图 URL。
- [x] 后端保存剧集时用 ffprobe 读取时长，并用 ffmpeg 抽帧生成默认封面。
- [x] 默认封面通过 Ali OSS SDK 上传，剧集保存 OSS 图片 URL。
- [x] 新增 `@ffmpeg-installer/ffmpeg` 和 `@ffprobe-installer/ffprobe` 依赖，并保留 env 路径覆盖。
- [x] `pnpm --filter @cine-stream/server build` 通过。
- [x] `pnpm --filter @cine-stream/admin build` 通过。
- [x] 本次触碰文本文件 BOM 检查通过。

## 边界情况

- 如果 OSS 未配置或上传失败，默认封面会为空；管理端仍可通过图片上传卡片手动上传缩略图。
- 如果 ffprobe 无法读取时长，后端会尝试 MP4/MOV/M4V 容器兜底解析，仍失败则时长为空。
