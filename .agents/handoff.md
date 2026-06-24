# 交接记录

## 当前状态

- 已基于模板搭建 `cine-stream` monorepo。
- 已实现管理端用户新增、影视管理、剧集配置和服务器视频文件选择。
- 已实现后端影视/剧集模型、管理端 API、客户端 API、视频静态访问和手机号密码登录。
- 已实现移动端客户端登录、首页、收藏、历史、个人空间和播放页。
- 已补齐各包 `.env`，并为前端与后端补齐 `.env.production`。
- 本机开发的 `server/.env` 使用 `mongodb://127.0.0.1:27017/cine-stream`，避免 Windows 主机无法解析 Docker 服务名 `mongodb`。
- 生产/Docker 的 `server/.env.production` 保留 `mongodb://mongodb:27017/cine-stream`。
- 已补 `docker-compose.dev.yml` 和 `pnpm dev:mongo`，用于在本机暴露 MongoDB 的 `27017` 端口。
- 启动迁移已改为显式连接 MongoDB，不再在 Nest 应用创建前复用尚未建立的 mongoose 连接。
- `common` 已补 `"type": "module"`，并将 CJS 产物调整为 `.cjs`，同时补齐 `constants` 和 `utils` 子路径 JS 产物。
- 客户端开发服务已启动，可访问 `http://localhost:5173/#/login`。
- 管理端开发服务已启动，可访问 `http://localhost:5174/`。

## 验证结果

- `pnpm run build` 通过。
- Playwright 已完成 Chromium 移动视口截图验证：
  - `output/playwright/client-login.png`
  - `output/playwright/client-hall.png`
  - `output/playwright/client-collection.png`
  - `output/playwright/client-playback.png`

## 注意事项

- 前端仍有 Vite chunk size 警告，属于体积优化提醒，不影响构建产物。
- 默认迁移会创建根管理员，运行 `pnpm --filter @cine-stream/server migrate` 后可用种子账户登录管理端。
