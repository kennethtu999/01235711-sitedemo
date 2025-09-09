#!/bin/bash

# 建置腳本

set -e

echo "🚀 開始建置..."

# 1. 建置前端
echo "📦 建置前端..."
cd frontend
npm install
npm run build
cd ..

# 3. 複製前端檔案至 backend/public
echo "📋 複製前端檔案至 backend/public..."
rm -rf backend/public/*
mkdir -p backend/public  
cp -r frontend/dist/* backend/public/

# 4. 建置 Docker 映像檔
echo "🐳 建置 Docker 映像檔..."
podman build -t sitedemo:latest .
