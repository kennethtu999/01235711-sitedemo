const express = require("express");
const router = express.Router();
const {
  getProviders,
  startAuth,
  handleCallback,
} = require("../controllers/oidcController");

// 獲取可用的 OIDC 提供者
router.get("/providers", getProviders);

// 開始 OIDC 認證流程
router.get("/:provider", startAuth);

// 處理 OIDC 回調
router.get("/:provider/callback", handleCallback);

module.exports = router;
