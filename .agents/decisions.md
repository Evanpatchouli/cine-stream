# 决策记录

## 项目命名

- 项目统一命名为 `cine-stream`。
- 包名统一使用 `@cine-stream/*`。
- 旧项目名和模板名不进入包名、运行时配置或交付文档。

## 三端结构

- 保留模板管理端目录 `admin`。
- 新增客户端目录 `client`，使用 Vite + TailwindCSS + MUI + Zustand。
- 后端继续使用 NestJS 和 MongoDB/Mongoose。

## RBAC

- 删除模板里和原领域强绑定的角色/权限。
- 当前角色为 `SUPER_ADMIN`、`CONTENT_ADMIN`、`OPERATOR`、`NORMAL_USER`。
- 管理端影视和用户管理权限由新 RBAC 种子数据维护。

## 视频文件

- 视频文件不上传，管理端从 `VIDEO_LIBRARY_ROOT` 浏览服务器磁盘文件。
- 后端只返回根目录内的相对路径、绝对路径和 `/media-files/*` 静态访问地址。
- 路径解析会阻止跳出视频根目录。

## 环境变量

- 各包均提供 `.env`。
- `admin`、`client`、`server` 提供 `.env.production`。
- 后端 MongoDB 统一使用 `mongodb://mongodb:27017/cine-stream`。
- MongoDB 用户名/密码为可选，连接串不带认证时不传 `user/pass`。

## 客户端素材

- Stitch 提供的远程图片在本地验证时不稳定。
- 客户端改为使用 `client/public/media` 下的本地 PNG 素材，保证离线和构建后可稳定渲染。
