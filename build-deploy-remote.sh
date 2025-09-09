#!/bin/bash

# 建置與部署腳本

set -e

echo "🚀 開始建置與部署..."

# 1. 停止並刪除現有容器 (如果存在)
if podman ps -a --filter name=sitedemo-app --format "{{.ID}}" | grep -q .; then
  echo "🛑 停止並刪除現有容器 sitedemo-app..."
  podman stop sitedemo-app
  podman rm sitedemo-app
else
  echo "ℹ️ 容器 sitedemo-app 不存在，跳過停止與刪除。"
fi

# 2. 移除舊有容器映像檔 (如果存在)
if podman images -q sitedemo:latest | grep -q .; then
  echo "🗑️ 移除舊有容器映像檔 sitedemo:latest..."
  podman rmi sitedemo:latest
else
  echo "ℹ️ 容器映像檔 sitedemo:latest 不存在，跳過移除。"
fi

# 3. 建置 Docker 映像檔
bash build-image.sh


# 4. 建立資料目錄
echo "📁 建立資料目錄..."
mkdir -p ./data

# 5. 啟動新容器
echo "🚀 啟動新容器..."
podman run -d \
  --name sitedemo-app \
  -p 3000:3000 \
  -v /data/sitedemo_data:/app/data \
  -v /home/ubuntu/.ssh/id_rsa:/app/.ssh/id_rsa:ro \
  -e DATABASE_PATH=/app/data/database.sqlite \
  -e GIT_SSH_PRIVATE_KEY_PATH=/app/.ssh/id_rsa \
  --restart unless-stopped \
  sitedemo:latest

echo "✅ 部署完成！"
echo ""
echo "🌐 存取位址:"
echo "   前端: http://localhost:3000"
echo "   API: http://localhost:3000/api"
echo "   健康檢查: http://localhost:3000/health"
echo "   靜態演示: http://localhost:3000/demo"
echo ""
echo "📁 資料目錄: $(pwd)/data"
echo ""
echo "🔍 查看日誌: podman logs -f sitedemo-app"
echo "🛑 停止服務: podman stop sitedemo-app"
