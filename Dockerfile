# 簡化的 Dockerfile - 只打包後端
FROM node:20-alpine

# 安裝必要的系統依賴
RUN apk add --no-cache \
    git \
    openssh-client

# 建立應用程式目錄
WORKDIR /app

# 複製 package 檔案
COPY backend/package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製後端原始碼
COPY backend/src ./src
COPY frontend/dist backend/public
COPY backend/public ./public

# 建立資料目錄
RUN mkdir -p /app/data

# 暴露連接埠
EXPOSE 3000

# 設定環境變數
ENV NODE_ENV=production
ENV DATA_PATH=/app/data
ENV PORT=3000

# 啟動應用程式
CMD ["node", "src/server.js"]
