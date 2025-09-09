#!/bin/bash

# 构建和部署脚本

set -e

echo "🚀 开始构建和部署..."

# 1. 构建前端
echo "📦 构建前端..."
cd frontend
npm run build
cd ..

# 2. 复制前端文件到 backend/public
echo "📋 复制前端文件到 backend/public..."
rm -rf backend/public/*
cp -r frontend/dist/* backend/public/

# 3. 构建 Docker 镜像
echo "🐳 构建 Docker 镜像..."
podman build -t sitedemo:latest .

# 4. 创建数据目录
echo "📁 创建数据目录..."
mkdir -p ./data

# 5. 停止并删除现有容器
echo "🛑 停止现有容器..."
podman stop sitedemo-app 2>/dev/null || true
podman rm sitedemo-app 2>/dev/null || true

# 6. 启动新容器
echo "🚀 启动新容器..."
podman run -d \
  --name sitedemo-app \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v /Users/kenneth/.ssh/id_rsa:/app/.ssh/id_rsa:ro \
  -e NODE_ENV=production \
  -e DATA_PATH=/app/data \
  -e DATABASE_PATH=/app/data/database.sqlite \
  -e GIT_SSH_PRIVATE_KEY_PATH=/app/.ssh/id_rsa \
  -e PORT=3000 \
  --restart unless-stopped \
  sitedemo:latest

echo "✅ 部署完成！"
echo ""
echo "🌐 访问地址:"
echo "   前端: http://localhost:3000"
echo "   API: http://localhost:3000/api"
echo "   健康检查: http://localhost:3000/health"
echo "   静态演示: http://localhost:3000/demo"
echo ""
echo "📁 数据目录: $(pwd)/data"
echo ""
echo "🔍 查看日志: podman logs -f sitedemo-app"
echo "🛑 停止服务: podman stop sitedemo-app"
