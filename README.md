# 靜態網站 Demo 管理平台

## 專案概述

這是一個基於 Node.js 和 Vue 3 的靜態網站 Demo 管理平台，支援多專案、多分支的 Demo 部署與權限管理。系統整合 GitHub Webhook 實現自動化部署，並提供完整的用戶權限控制與 Google OTP 兩步驟驗證功能。

## 主要功能

### 🔐 用戶管理與認證
- 用戶註冊/登入系統
- JWT 身份驗證
- 角色權限管理 (管理員/一般用戶)

### 📁 專案與 Demo 管理
- GitHub 專案管理
- 多分支 Demo 配置
- 用戶授權管理
- 靜態網站服務

### 🚀 自動化部署
- GitHub Webhook 整合
- 自動化 Git 克隆/拉取
- 靜態檔案部署
- 部署狀態追蹤

### 🛡️ 安全性
- 密碼雜湊 (bcrypt)
- JWT Token 認證
- Webhook 簽名驗證
- 路徑遍歷防護

## 技術架構

### 後端 (Backend)
- **框架**: Node.js + Express.js
- **資料庫**: SQLite + Sequelize ORM
- **認證**: JWT + Passport.js
- **2FA**: Speakeasy (TOTP)
- **其他**: bcryptjs, cors, cookie-parser

### 前端 (Frontend)
- **框架**: Vue 3 + TypeScript
- **路由**: Vue Router
- **UI 組件**: Naive UI
- **HTTP 客戶端**: Axios
- **建構工具**: Vite

## 快速開始

### 環境需求
- Node.js >= 20.19.0
- Git

### 安裝與啟動

1. **後端啟動**
```bash
cd backend
npm install
npm run dev
```

2. **前端啟動**
```bash
cd frontend
npm install
npm run dev
```

### 預設管理員帳號
- 用戶名: `admin`
- 密碼: `admin123456`

## API 端點

### Webhook
- **POST** `/api/webhook/github` - GitHub Webhook 接收端點

### 認證
- **POST** `/api/login` - 用戶登入
- **POST** `/api/login/2fa` - 2FA 驗證
- **GET** `/api/user/2fa/setup` - 2FA 設定

### 管理功能
- **GET** `/api/admin/users` - 用戶列表
- **POST** `/api/admin/users` - 創建用戶
- **GET** `/api/admin/projects` - 專案列表
- **POST** `/api/admin/projects` - 創建專案

### Demo 服務
- **GET** `/demo/:projectName/:branchName/*` - 靜態 Demo 服務

## 部署資訊

### Webhook URL
- https://sitedemo.365svc.uk/api/webhook/github

### Demo URL 範例
- https://sitedemo.365svc.uk/demo/webhooktest/main/index.html

### Webhook 測試
```bash
curl -X POST https://sitedemo.365svc.uk/api/webhook/github \
-H "Content-Type: application/json" \
-H "X-GitHub-Event: push" \
-H "X-Hub-Signature-256: sha256=1234567890" \
-d '{"repository":{"full_name":"owner/repo"},"ref":"refs/heads/main","commits":[{"id":"1234567890"}]}'
```

## 專案結構

```
├── backend/                 # 後端服務
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 資料模型
│   │   ├── routes/         # 路由定義
│   │   ├── middleware/     # 中間件
│   │   └── services/       # 服務層
│   └── data/               # 資料目錄
│       ├── database.sqlite # 資料庫檔案
│       └── static_demos/   # 靜態 Demo 檔案
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── views/          # 頁面組件
│   │   ├── api/            # API 封裝
│   │   └── router/         # 路由配置
└── README.md
```

## 開發階段

本專案採用分階段開發方式，詳細開發計劃請參考 [STEP.md](./STEP.md) 文件。

## 授權

ISC License