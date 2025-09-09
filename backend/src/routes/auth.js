const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateJWT } = require("../middleware/auth");
const { getUserAccessibleProjects } = require("../controllers/adminController");

// 登入路由
router.post("/login", authController.login);

// 2FA 登入路由 (階段五實現)
router.post("/login/2fa", authController.login2FA);

// 獲取當前使用者資訊 (需要認證)
router.get("/me", authenticateJWT, authController.getCurrentUser);

// 登出路由
router.post("/logout", authenticateJWT, authController.logout);

// 獲取用戶可訪問的專案和 Demo 配置
router.get("/projects", authenticateJWT, getUserAccessibleProjects);

module.exports = router;
