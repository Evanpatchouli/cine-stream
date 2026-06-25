# CineStream

CineStream 是一个 pnpm monorepo 视频集播放器项目，包含管理端、移动端客户端、后端和共享包。

## 技术栈

- `admin`: Vite + React + Ant Design
- `client`: Vite + React + TailwindCSS + MUI + Zustand
- `server`: NestJS + MongoDB/Mongoose
- `common`: 三端共享常量、类型和工具

## 目录

- `admin`: 网页管理端
- `client`: 移动端网页客户端
- `server`: 后端 API
- `common`: 共享包
- `docs/stitch`: PRD 和 Stitch 视觉材料

## 启动

```bash
pnpm install
pnpm dev:mongo
pnpm dev:common
pnpm dev:server
pnpm dev:admin
pnpm dev:client
```

常用地址：

- 客户端：`http://localhost:5210/#/login`
- 管理端：Vite 默认地址，通常为 `http://localhost:5211`
- 后端：默认 `http://localhost:3000/api`

## 环境变量

后端本地开发读取 `server/.env`，关键项：

- `DB_MONGO_CONNECTION`: MongoDB 连接地址，本机直接运行后端时使用 `mongodb://127.0.0.1:27017/cine-stream`
- `MONGODB_URI`: 迁移脚本使用的 MongoDB 地址，本机直接运行后端时同样使用 `mongodb://127.0.0.1:27017/cine-stream`
- `JWT_SECRET`: JWT 签名密钥
- `APP_PORT`: 后端端口，当前为 `8793`
- `VIDEO_LIBRARY_ROOT`: 服务器视频文件根目录，管理端配置剧集时从这里浏览文件

`server/.env.production` 保留 Docker 网络服务名 `mongodb://mongodb:27017/cine-stream`。该地址只在后端同样运行在 Docker 网络内时可解析；如果在 Windows 主机直接运行 `pnpm dev:server`，必须使用 `127.0.0.1` 或 `localhost`。

视频资源目录也可以在管理端“影视管理 -> 配置资源目录”中修改。修改后会写入 `server/storage/media-root.json`，文件浏览接口和 `/media-files/*` 视频访问都会读取这个配置。

客户端参考 `client/.env.example`：

- `VITE_APP_API_BASE_URL`: 后端 API 地址

管理端参考 `admin/.env.example`：

- `VITE_APP_API_BASE_URL`: 管理端请求 base path
- `VITE_APP_API_TARGET_URL`: Vite 开发代理目标

## 功能

管理端：

- 添加用户，填写手机号和初始密码
- 管理影视 `cine` 资源，支持新增、编辑、删除
- 管理剧集视频资源，支持选择服务器磁盘文件、填写集名称/简介、删除、上移、下移
- 删除影视时硬删除关联剧集资源记录

客户端：

- 强制登录
- 首页、收藏、历史、个人空间、播放页
- 播放页按影视剧集顺序连续选择观看
- 移动端优先，基于 Stitch 页面视觉复刻

## 构建

```bash
pnpm run build
```

构建会依次编译 `common`、`admin`、`client`、`server`。
