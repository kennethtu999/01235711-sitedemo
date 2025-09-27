const jwt = require("jsonwebtoken");
const { User } = require("../models");

// JWT 認證中間件
const authenticateJWT = async (req, res, next) => {
  try {
    // 調試日誌
    console.log("Auth middleware - cookies:", req.cookies);
    console.log("Auth middleware - headers:", req.headers.authorization);

    // 優先從 cookie 獲取 token，如果沒有則從 Authorization header 獲取
    let token = req.cookies?.jwt || req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    }

    console.log(
      "Auth middleware - extracted token:",
      token ? "Token found" : "No token"
    );

    if (!token) {
      // 檢查是否為 Demo 路由，如果是則重定向到登入頁
      if (
        req.path.startsWith("/demo/") ||
        req.originalUrl.startsWith("/demo/")
      ) {
        const originalUrl = req.originalUrl;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const loginUrl = `${frontendUrl}/login?redirect=${encodeURIComponent(
          originalUrl
        )}`;
        return res.redirect(loginUrl);
      }

      return res.status(401).json({
        error: "Access denied",
        message: "No token provided",
      });
    }

    // 驗證 JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // 查找使用者
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ["password", "twoFactorSecret", "recoveryCodes"] },
    });

    if (!user) {
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid token - user not found",
      });
    }

    if (!user.isActive) {
      // 檢查是否為 Demo 路由，如果是則重定向到登入頁
      if (
        req.path.startsWith("/demo/") ||
        req.originalUrl.startsWith("/demo/")
      ) {
        const originalUrl = req.originalUrl;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const loginUrl = `${frontendUrl}/login?redirect=${encodeURIComponent(
          originalUrl
        )}`;
        return res.redirect(loginUrl);
      }

      return res.status(401).json({
        error: "Access denied",
        message: "User account is deactivated",
      });
    }

    // 將使用者資訊添加到請求對象
    req.user = user;
    next();
  } catch (error) {
    // 檢查是否為 Demo 路由，如果是則重定向到登入頁
    if (req.path.startsWith("/demo/") || req.originalUrl.startsWith("/demo/")) {
      const originalUrl = req.originalUrl;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const loginUrl = `${frontendUrl}/login?redirect=${encodeURIComponent(
        originalUrl
      )}`;
      return res.redirect(loginUrl);
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid token",
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Token expired",
      });
    } else {
      console.error("Auth middleware error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Authentication failed",
      });
    }
  }
};

// 角色授權中間件
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Access denied",
        message: "Authentication required",
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Access denied",
        message: `Insufficient permissions. Required role: ${allowedRoles.join(
          " or "
        )}`,
      });
    }

    next();
  };
};

// 管理員授權中間件 (簡化版本)
const authorizeAdmin = authorizeRole("admin");

module.exports = {
  authenticateJWT,
  authorizeRole,
  authorizeAdmin,
};
