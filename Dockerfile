# 简化的 Dockerfile - 只打包 backend
FROM node:20-alpine

# 安装必要的系统依赖
RUN apk add --no-cache \
    git \
    openssh-client

# 创建应用目录
WORKDIR /app

# 复制 package 文件
COPY backend/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制后端源代码
COPY backend/src ./src
COPY backend/migrations ./migrations
COPY backend/public ./public

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV DATA_PATH=/app/data
ENV PORT=3000

# 启动应用
CMD ["node", "src/server.js"]
