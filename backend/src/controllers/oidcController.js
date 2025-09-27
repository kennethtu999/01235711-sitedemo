const { User } = require("../models");
const {
  getOIDCClient,
  getOIDCConfig,
  getAvailableProviders,
} = require("../config/oidc");
const jwt = require("jsonwebtoken");

// 生成 JWT token (與 authController 中的相同)
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

// 獲取可用的 OIDC 提供者
const getProviders = async (req, res) => {
  try {
    const providers = getAvailableProviders();
    const providerInfo = providers.map((provider) => ({
      name: provider,
      displayName: getDisplayName(provider),
      authUrl: `/auth/oidc/${provider}`,
    }));

    res.json({
      providers: providerInfo,
    });
  } catch (error) {
    console.error("Get OIDC providers error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get OIDC providers",
    });
  }
};

// 獲取提供者顯示名稱
const getDisplayName = (provider) => {
  const displayNames = {
    google: "Google",
    microsoft: "Microsoft",
    auth0: "Auth0",
    keycloak: "Keycloak",
  };
  return displayNames[provider] || provider;
};

// 開始 OIDC 認證流程
const startAuth = async (req, res) => {
  try {
    const { provider } = req.params;
    const { redirect } = req.query; // 獲取重定向 URL
    const client = getOIDCClient(provider);
    const config = getOIDCConfig(provider);

    if (!client) {
      return res.status(400).json({
        error: "Invalid provider",
        message: `OIDC provider '${provider}' is not configured`,
      });
    }

    // 生成 state 參數用於防止 CSRF 攻擊
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // 將 state 和重定向 URL 存儲在 session 中
    req.session.oidcState = state;
    req.session.oidcProvider = provider;
    if (redirect) {
      req.session.oidcRedirect = redirect;
    }

    // 生成授權 URL
    const authUrl = client.authorizationUrl({
      scope: config.scope,
      state: state,
    });

    res.json({
      authUrl: authUrl,
    });
  } catch (error) {
    console.error("Start OIDC auth error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to start OIDC authentication",
    });
  }
};

// 處理 OIDC 回調
const handleCallback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    // 驗證 state 參數
    if (!req.session.oidcState || state !== req.session.oidcState) {
      return res.status(400).json({
        error: "Invalid state",
        message: "Invalid state parameter",
      });
    }

    // 驗證提供者
    if (req.session.oidcProvider !== provider) {
      return res.status(400).json({
        error: "Invalid provider",
        message: "Provider mismatch",
      });
    }

    const client = getOIDCClient(provider);
    if (!client) {
      return res.status(400).json({
        error: "Invalid provider",
        message: `OIDC provider '${provider}' is not configured`,
      });
    }

    // 交換授權碼獲取 token
    const tokenSet = await client.callback(
      getOIDCConfig(provider).redirectUri,
      { code, state },
      { state }
    );

    // 獲取用戶資訊
    const userInfo = await client.userinfo(tokenSet.access_token);

    // 提取用戶資訊
    const oidcData = {
      provider: provider,
      subject: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || userInfo.preferred_username || userInfo.email,
    };

    // 查找或創建用戶
    const user = await User.findOrCreateOIDCUser(oidcData);

    // 檢查帳號是否啟用
    if (!user.isActive) {
      return res.status(401).json({
        error: "Account deactivated",
        message: "Account is deactivated",
      });
    }

    // 更新最後登入時間
    await user.updateLastLogin();

    // 生成 JWT token
    const token = generateToken(user);

    // 設置 HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" &&
        process.env.FORCE_HTTPS === "true",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 小時
    };

    res.cookie("jwt", token, cookieOptions);

    // 獲取重定向 URL
    const originalRedirect = req.session.oidcRedirect;

    // 清除 session 中的 OIDC 資料
    delete req.session.oidcState;
    delete req.session.oidcProvider;
    delete req.session.oidcRedirect;

    // 重定向到前端，並將 token 作為查詢參數傳遞
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    let redirectUrl = `${frontendUrl}/auth/oidc/callback?token=${encodeURIComponent(
      token
    )}&success=true`;

    // 如果有原始重定向 URL，添加到查詢參數中
    if (originalRedirect) {
      redirectUrl += `&redirect=${encodeURIComponent(originalRedirect)}`;
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("OIDC callback error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "OIDC authentication failed",
    });
  }
};

module.exports = {
  getProviders,
  startAuth,
  handleCallback,
};
