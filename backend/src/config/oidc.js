const { Issuer } = require("openid-client");

// OIDC 配置
const oidcConfig = {
  // 這裡可以配置多個 OIDC 提供者
  providers: {
    // Keycloak 自建 OIDC
    keycloak: {
      clientId: process.env.KEYCLOAK_CLIENT_ID || "site-demo-client",
      clientSecret:
        process.env.KEYCLOAK_CLIENT_SECRET || "your-keycloak-client-secret",
      discoveryUrl:
        process.env.KEYCLOAK_DISCOVERY_URL ||
        "http://localhost:8080/realms/site-demo/.well-known/openid_configuration",
      redirectUri:
        process.env.KEYCLOAK_REDIRECT_URI ||
        "http://localhost:3000/api/auth/oidc/keycloak/callback",
      scope: "openid email profile",
    },
  },
};

// 存儲 OIDC 客戶端實例
const oidcClients = {};

// 初始化 OIDC 客戶端
const initializeOIDCClients = async () => {
  try {
    for (const [providerName, config] of Object.entries(oidcConfig.providers)) {
      // 檢查環境變數是否實際設定，而不是使用預設值
      const hasEnvVars =
        process.env[`${providerName.toUpperCase()}_CLIENT_ID`] &&
        process.env[`${providerName.toUpperCase()}_CLIENT_SECRET`] &&
        process.env[`${providerName.toUpperCase()}_DISCOVERY_URL`];

      if (
        hasEnvVars &&
        config.clientId &&
        config.clientSecret &&
        config.discoveryUrl
      ) {
        try {
          const issuer = await Issuer.discover(config.discoveryUrl);
          oidcClients[providerName] = new issuer.Client({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uris: [config.redirectUri],
            response_types: ["code"],
          });
          console.log(`OIDC client initialized for ${providerName}`);
        } catch (discoverError) {
          console.warn(
            `Failed to discover OIDC issuer for ${providerName}:`,
            discoverError.message
          );
        }
      } else {
        console.warn(
          `OIDC client not configured for ${providerName} - missing environment variables`
        );
      }
    }
  } catch (error) {
    console.error("Error initializing OIDC clients:", error);
  }
};

// 獲取 OIDC 客戶端
const getOIDCClient = (providerName) => {
  return oidcClients[providerName];
};

// 獲取可用的 OIDC 提供者列表
const getAvailableProviders = () => {
  return Object.keys(oidcClients);
};

// 獲取 OIDC 配置
const getOIDCConfig = (providerName) => {
  return oidcConfig.providers[providerName];
};

module.exports = {
  initializeOIDCClients,
  getOIDCClient,
  getAvailableProviders,
  getOIDCConfig,
  oidcConfig,
};
