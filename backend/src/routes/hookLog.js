const express = require("express");
const router = express.Router();
const {
  getHookLogs,
  getHookLogById,
  getHookLogStats,
} = require("../controllers/hookLogController");
const { reExecuteHookLog } = require("../controllers/webhookController");
const { authenticateJWT } = require("../middleware/auth");

// 所有路由都需要認證
router.use(authenticateJWT);

// 獲取 Hook Log 列表
router.get("/", getHookLogs);

// 獲取 Hook Log 統計信息
router.get("/stats", getHookLogStats);

// 獲取單個 Hook Log 詳情
router.get("/:hookLogId", getHookLogById);

// 重新執行 Hook Log
router.post("/:hookLogId/re-execute", reExecuteHookLog);

module.exports = router;
