const jwt = require("jsonwebtoken");
const { User } = require("../models");

// 生成 JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET || "your-secret-key",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    }
  );
};

// 登入
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 驗證輸入
    if (!username || !password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Username and password are required",
      });
    }

    // 驗證密碼長度
    if (password.length < 10) {
      return res.status(400).json({
        error: "Validation error",
        message: "Password must be at least 10 characters long",
      });
    }

    // 查找使用者
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid username or password",
      });
    }

    // 檢查帳號是否啟用
    if (!user.isActive) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Account is deactivated",
      });
    }

    // 驗證密碼
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid username or password",
      });
    }

    // 檢查是否啟用 2FA
    if (user.twoFactorEnabled) {
      // 如果啟用了 2FA，回傳需要 2FA 驗證的狀態
      return res.status(202).json({
        message: "2FA Required",
        requires2FA: true,
        userId: user.id,
        username: user.username,
      });
    }

    // 更新最後登入時間
    await user.updateLastLogin();

    // 生成 JWT token
    const token = generateToken(user);

    // 設置 HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // 在生產環境使用 HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 小時
    };

    res.cookie("jwt", token, cookieOptions);

    // 回傳成功響應
    res.json({
      message: "Login successful",
      token, // 仍然回傳 token 給前端，以防需要
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Login failed",
    });
  }
};

// 2FA 登入 (暫時不實現，在階段五會完成)
const login2FA = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // 驗證輸入
    if (!userId || !otp) {
      return res.status(400).json({
        error: "Validation error",
        message: "User ID and OTP are required",
      });
    }

    // 查找使用者
    const user = await User.findByPk(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid user or account deactivated",
      });
    }

    // 檢查是否啟用 2FA
    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        error: "Validation error",
        message: "2FA is not enabled for this user",
      });
    }

    // TODO: 在階段五實現 OTP 驗證
    // 暫時回傳錯誤
    res.status(501).json({
      error: "Not implemented",
      message: "2FA login will be implemented in stage 5",
    });
  } catch (error) {
    console.error("2FA login error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "2FA login failed",
    });
  }
};

// 獲取當前使用者資訊
const getCurrentUser = async (req, res) => {
  try {
    // req.user 由 authenticateJWT 中間件設置
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        email: req.user.email,
        isActive: req.user.isActive,
        twoFactorEnabled: req.user.twoFactorEnabled,
        lastLoginAt: req.user.lastLoginAt,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user information",
    });
  }
};

// 登出 (清除 cookie)
const logout = async (req, res) => {
  try {
    // 清除 JWT cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Logout failed",
    });
  }
};

module.exports = {
  login,
  login2FA,
  getCurrentUser,
  logout,
};
