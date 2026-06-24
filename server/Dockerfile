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

# 构建 server（切换到 server 目录）
WORKDIR /app/server
RUN pnpm run build

# 生产阶段
FROM node:24-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# 复制 common 包（生产依赖需要）
COPY common ./common/
COPY server/package.json ./server/

# 安装生产依赖（只安装 server 的）
WORKDIR /app/server
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制编译后的代码
COPY --from=builder /app/server/dist ./dist

# 暴露端口
EXPOSE 8793

# 启动应用
CMD ["pnpm", "start:prod"]