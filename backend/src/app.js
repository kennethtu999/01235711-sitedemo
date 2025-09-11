const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const debugLogger = require("./middleware/debugLogger");

const app = express();

// CORS 設定
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"] // 生產環境時設定實際域名
        : ["http://localhost:5173", "http://localhost:3000"], // 開發環境
    credentials: true,
  })
);

// Debug 日誌中間件 (在解析 body 之前)
app.use(debugLogger);

// GitHub Webhook 需要原始 body 進行簽名驗證
app.use("/api/webhook/github", express.raw({ type: "application/json" }));

// 中間件設定
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Session 設定 (用於 OIDC 認證)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 小時
    },
  })
);

// 靜態文件服務 (前端打包文件)
app.use(express.static(path.join(__dirname, "../public")));

// Demo 路由 (直接掛在根路徑下)
app.use("/demo", require("./routes/demo"));

// 其他 API 路由
app.use("/api", require("./routes"));

// 健康檢查路由
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 前端路由處理 (SPA 路由) - 使用中间件处理所有未匹配的请求
app.use((req, res, next) => {
  // 如果是 API 請求，返回 404
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "Not Found",
      message: `API Route ${req.originalUrl} not found`,
    });
  }

  // 其他請求返回前端 index.html (SPA 路由)
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
