# 管理端缩略图重新抽取按钮

## 目标

在管理端“配置剧集”列表项的“缩略图”标题旁添加刷新图标按钮，Tooltip 提示“重新抽取”。

## 改动

- 新增 `ReloadOutlined` 图标按钮。
- 按钮放在“缩略图”标题旁。
- Tooltip 文案为“重新抽取”。
- 点击后使用当前剧集 `file_path` 调用 `media/info`。
- 成功后更新当前剧集的 `duration` 和 `thumbnail`。
- 未选择视频时提示“请先选择视频文件”。

## 验证

- `pnpm --filter @cine-stream/admin build` 通过。
- `admin/src/views/cine/index.tsx` 和 `.agents/current-task.md` 已检查无 UTF-8 BOM。
