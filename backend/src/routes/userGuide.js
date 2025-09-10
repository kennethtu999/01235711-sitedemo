const express = require("express");
const router = express.Router();
const { authenticateJWT, authorizeAdmin } = require("../middleware/auth");
const {
  getUserGuideContent,
  updateUserGuideContent,
} = require("../controllers/userGuideController");

// 所有使用說明路由都需要認證和授權
router.use(authenticateJWT);
router.use(authorizeAdmin);

// 取得使用說明內容
router.get("/content", getUserGuideContent);

// 更新使用說明內容
router.put("/content", updateUserGuideContent);

module.exports = router;
