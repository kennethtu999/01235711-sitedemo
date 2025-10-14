const app = require("./app");
const sequelize = require("./config/database");
const { initializeOIDCClients } = require("./config/oidc");
const { safeMigration, needsMigration } = require("./config/migration");
const {
  User,
  Project,
  DemoConfig,
  DemoConfigUser,
  HookLog,
} = require("./models");
const path = require("path");
const logger = require("./config/logger");

const PORT = process.env.PORT || 3000;

// 創建預設管理員帳號
async function createDefaultAdmin() {
  try {
    // 檢查是否已存在管理員帳號
    const existingAdmin = await User.findOne({
      where: { role: "admin" },
    });

    if (!existingAdmin) {
      // 創建預設管理員帳號
      const adminUser = await User.create({
        username: "admin",
        password: "admin123456", // 密碼會在 hook 中自動雜湊
        role: "admin",
        email: "admin@example.com",
        isActive: true,
      });

      // 創建預設管理員帳號
      const demoUser = await User.create({
        username: "demo",
        password: "demo123456", // 密碼會在 hook 中自動雜湊
        role: "user",
        email: "demo@example.com",
        isActive: true,
      });

      logger.info("✅ Default admin account created:", {
        username: adminUser.username,
        email: adminUser.email,
      });
      logger.info("✅ Default demo account created:", {
        username: demoUser.username,
        email: demoUser.email,
      });
      logger.warn("⚠️  Please change the default password after first login!");
    } else {
      logger.info("✅ Admin account already exists.");
    }
  } catch (error) {
    logger.error("❌ Error creating default admin account:", error);
  }
}

async function createDefaultProject() {
  try {
    const existingProject = await Project.findOne({
      where: { name: "webhooktest" },
    });
    if (!existingProject) {
      const newProject = await Project.create({
        name: "webhooktest",
        githubRepoName: "kennetht/webhooktest",
        githubRepoUrl: `git@${process.env.GITHUB_DEFAULT_HOST}:kennetht/webhooktest.git`,
        isActive: 1,
      });
      logger.info("✅ Default project created:", {
        projectId: newProject.id,
        name: newProject.name,
      });

      const newDemoConfig = await DemoConfig.create({
        projectId: newProject.id,
        branchName: "main",
        demoPath: "/",
        displayName: "webhooktest",
        description: "webhooktest",
        subSiteFolders: "rc1,rc2",
        isActive: 1,
      });
      logger.info("✅ Default demo config created:", {
        configId: newDemoConfig.id,
        projectId: newDemoConfig.projectId,
      });

      // Find the demo user to get their ID
      const demoUser = await User.findOne({
        where: { username: "demo" },
      });

      if (demoUser) {
        const newDemoConfigUser = await DemoConfigUser.create({
          demoConfigId: newDemoConfig.id,
          userId: demoUser.id,
          grantedAt: new Date(),
          grantedBy: 1,
        });
        logger.info("✅ Default demo config user created:", {
          userId: newDemoConfigUser.userId,
          configId: newDemoConfigUser.demoConfigId,
        });
      } else {
        logger.warn(
          "⚠️  Demo user not found, skipping demo config user creation"
        );
      }
    } else {
      logger.info("✅ Project already exists.");
    }
  } catch (error) {
    logger.error("❌ Error creating default project:", error);
  }
}

async function startServer() {
  try {
    // 確保資料庫目錄存在
    const dbDir = path.dirname(
      process.env.DATABASE_PATH ||
        path.join(__dirname, "../data/database.sqlite")
    );
    const fs = require("fs");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 測試資料庫連接
    await sequelize.authenticate();
    logger.info("✅ Database connection established successfully.");

    // 檢查是否需要遷移
    const needsMigrate = await needsMigration();
    if (needsMigrate) {
      logger.info("🔄 Database migration required, starting safe migration...");
      await safeMigration();
      logger.info("✅ Database migration completed successfully.");
    } else {
      logger.info("✅ Database schema is up to date.");
    }

    // 初始化 OIDC 客戶端
    await initializeOIDCClients();

    // 創建預設管理員帳號
    await createDefaultAdmin();

    //創建預設專案
    await createDefaultProject();

    // 啟動伺服器
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API base URL: http://localhost:${PORT}/api`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // 優雅關閉
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        sequelize.close();
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        sequelize.close();
      });
    });
  } catch (error) {
    logger.error("❌ Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
