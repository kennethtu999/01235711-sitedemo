const express = require("express");
const router = express.Router();

// 狀態檢查路由
router.get("/status", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// 其他 API 路由將在這裡添加
router.use("/auth", require("./auth"));
router.use("/admin", require("./admin"));
router.use("/webhook", require("./webhook"));
router.use("/hook-logs", require("./hookLog"));
router.use("/user-guide", require("./userGuide"));
router.use("/groups", require("./group"));
// router.use('/user', require('./user'));

module.exports = router;
