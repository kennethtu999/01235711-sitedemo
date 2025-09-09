const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
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
