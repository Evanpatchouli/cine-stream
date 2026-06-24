# 管理端图片上传组件预览

## 目标

补齐管理端通用图片上传组件的预览能力。

## 改动

- `ImageUploadInput` 引入 Antd `Image`。
- Upload `showPreviewIcon` 从 `false` 改为 `true`。
- 新增 `onPreview`，点击预览图标时打开受控 Image preview。
- 保留原有上传和删除逻辑。

## 验证

- `pnpm --filter @cine-stream/admin build` 通过。
- `admin/src/views/cine/index.tsx` 和 `.agents/current-task.md` 已检查无 UTF-8 BOM。
