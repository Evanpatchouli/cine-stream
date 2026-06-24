# 构建阶段
FROM node:24-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 workspace 配置和根 package.json
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# 复制所有 workspace 包（包括 common 和 server）
COPY common ./common/
COPY server ./server/

# 安装依赖（在根目录执行，识别 workspace）
RUN pnpm install --frozen-lockfile

# 切换到 server 目录运行 migrate 脚本
WORKDIR /app/server
CMD ["pnpm", "run", "migrate"]