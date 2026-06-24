# 归档任务：修复 Mongoose new 选项弃用警告

## 目标

消除 Mongoose `findOneAndUpdate()` / `findOneAndReplace()` 中 `{ new: true }` 的弃用警告，改用官方推荐的 `returnDocument: 'after'`。

## 完成情况

- [x] 定位 server 内所有 `{ new: true }` 更新选项。
- [x] 替换为 `{ returnDocument: 'after' }`，保留返回更新后文档的语义。
- [x] `pnpm --filter @cine-stream/server build` 通过。
- [x] 本次触碰文本文件 BOM 检查通过。
- [x] 说明手机同 WiFi 访问客户端无法登录的原因。
