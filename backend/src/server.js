const app = require("./app");
const sequelize = require("./config/database");
const { User, Project, DemoConfig, DemoConfigUser } = require("./models");
const path = require("path");

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
        password: "admin123", // 密碼會在 hook 中自動雜湊
        role: "admin",
        email: "admin@example.com",
        isActive: true,
      });

      // 創建預設管理員帳號
      const demoUser = await User.create({
        username: "demo",
        password: "demo123", // 密碼會在 hook 中自動雜湊
        role: "user",
        email: "demo@example.com",
        isActive: true,
      });

      console.log("✅ Default admin account created:");
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Password: admin123`);
      console.log(`   Email: ${adminUser.email}`);
      console.log("✅ Default demo account created:");
      console.log(`   Username: ${demoUser.username}`);
      console.log(`   Password: demo123`);
      console.log(`   Email: ${demoUser.email}`);
      console.log("⚠️  Please change the default password after first login!");
    } else {
      console.log("✅ Admin account already exists.");
    }
  } catch (error) {
    console.error("❌ Error creating default admin account:", error);
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
      console.log("✅ Default project created:", newProject);

      const newDemoConfig = await DemoConfig.create({
        projectId: newProject.id,
        branchName: "main",
        demoPath: "/",
        displayName: "webhooktest",
        description: "webhooktest",
        subSiteFolders: "rc1,rc2",
        isActive: 1,
      });
      console.log("✅ Default demo config created:", newDemoConfig);

      const newDemoConfigUser = await DemoConfigUser.create({
        demoConfigId: newDemoConfig.id,
        userId: 2,
        grantedAt: new Date(),
        grantedBy: 1,
      });
      console.log("✅ Default demo config user created:", newDemoConfigUser);
    } else {
      console.log("✅ Project already exists.");
    }
  } catch (error) {
    console.error("❌ Error creating default project:", error);
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
    console.log("✅ Database connection established successfully.");

    // 同步資料庫 (開發階段使用 force: true 確保每次重啟都清空重建)
    // 生產環境請使用 alter: true 或 migrate
    await sequelize.sync({ force: process.env.NODE_ENV === "development" });
    console.log("✅ Database synchronized successfully.");

    // 創建預設管理員帳號
    await createDefaultAdmin();

    //創建預設專案
    await createDefaultProject();

    // 啟動伺服器
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // 優雅關閉
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Process terminated");
        sequelize.close();
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received, shutting down gracefully");
      server.close(() => {
        console.log("Process terminated");
        sequelize.close();
      });
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
