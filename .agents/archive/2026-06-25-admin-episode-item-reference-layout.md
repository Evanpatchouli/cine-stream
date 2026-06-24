# 管理端剧集列表项参考布局

## 目标

将管理端“配置剧集”弹窗中的剧集列表项调整为用户参考图布局。

## 改动

- 顶部字段调整为“名称 + 时长”横排。
- 名称输入框前通过 `Space.Compact + Space.Addon` 展示自动生成的 `【01】` 顺序前缀。
- 顺序前缀仅为视觉展示，不写入 `record.name`。
- 名称输入框的值原样展示管理员保存的剧集名称，不自动剥离或追加编号。
- 底部调整为左侧缩略图上传，右侧“简介 + 视频文件”上下排列。
- 保留右侧上移、下移、删除操作。
- 保留现有图片上传、视频文件选择、时长和缩略图自动读取逻辑。

## 验证

- `pnpm --filter @cine-stream/admin build` 通过。
- `admin/src/views/cine/index.tsx`、`.agents/current-task.md`、`.agents/handoff.md`、`.agents/lessons.md` 均检查无 UTF-8 BOM。
- 使用开发管理员 token 调用 `GET /api/admin/cines?page=1&size=10` 成功，返回 1 个影视和 5 个剧集。

## 限制

- 内置 Browser 无现成管理端登录态，页面脚本作用域不暴露 `localStorage`，且 `javascript:` 导航写入登录态被安全策略拦截；本轮未能自动截取配置剧集弹窗截图。
