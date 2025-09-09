const { DemoConfig, Project, ProjectUser } = require("../models");

/**
 * Demo 存取授權中間件
 * 驗證當前登入使用者是否有權存取指定的 Demo 配置
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express next 函數
 */
async function authorizeDemoAccess(req, res, next) {
  try {
    // 確保使用者已通過 JWT 認證
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // 管理員擁有所有 Demo 的存取權限
    if (req.user.role === "admin") {
      return next();
    }

    // 從請求參數中獲取 demoConfigId
    const { demoConfigId } = req.params;

    if (!demoConfigId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Demo configuration ID is required",
      });
    }

    // 查找 Demo 配置
    const demoConfig = await DemoConfig.findByPk(demoConfigId, {
      include: [
        {
          model: Project,
          as: "project",
          include: [
            {
              model: ProjectUser,
              as: "authorizedUsers",
              where: {
                userId: req.user.id,
              },
              required: false,
            },
          ],
        },
      ],
    });

    if (!demoConfig) {
      return res.status(404).json({
        error: "Not Found",
        message: "Demo configuration not found",
      });
    }

    // 檢查 Demo 配置是否啟用
    if (!demoConfig.isActive) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Demo configuration is not active",
      });
    }

    // 檢查 Project 是否啟用
    if (!demoConfig.project || !demoConfig.project.isActive) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Project is not active",
      });
    }

    // 檢查使用者是否有 Project 的授權
    const hasAccess =
      demoConfig.project.authorizedUsers &&
      demoConfig.project.authorizedUsers.length > 0;

    if (!hasAccess) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to this project",
        projectId: demoConfig.project.id,
        projectName: demoConfig.project.name,
        demoConfigId: demoConfig.id,
        demoName: demoConfig.getDisplayName(),
      });
    }

    // 將 Demo 配置資訊添加到請求對象，供後續使用
    req.demoConfig = demoConfig;

    next();
  } catch (error) {
    console.error("Demo 存取授權中間件錯誤:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Authorization check failed",
    });
  }
}

/**
 * 根據專案名稱和分支名稱授權 Demo 存取
 * 這是一個替代的授權方法，用於路由如 /demo/:projectName/:branchName/*
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express next 函數
 */
async function authorizeDemoAccessByProjectAndBranch(req, res, next) {
  try {
    // 確保使用者已通過 JWT 認證
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // 管理員擁有所有 Demo 的存取權限
    if (req.user.role === "admin") {
      return next();
    }

    // 從請求參數中獲取專案名稱和分支名稱
    const { projectName, branchName } = req.params;

    if (!projectName || !branchName) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Project name and branch name are required",
      });
    }

    // 查找 Demo 配置
    const demoConfig = await DemoConfig.findOne({
      where: {
        branchName: branchName,
        isActive: true,
      },
      include: [
        {
          model: Project,
          as: "project",
          where: {
            name: projectName,
            isActive: true,
          },
          include: [
            {
              model: ProjectUser,
              as: "authorizedUsers",
              where: {
                userId: req.user.id,
              },
              required: false,
            },
          ],
        },
      ],
    });

    if (!demoConfig) {
      return res.status(404).json({
        error: "Not Found",
        message: "Demo configuration not found",
        projectName,
        branchName,
      });
    }

    // 檢查使用者是否有 Project 的授權
    const hasAccess =
      demoConfig.project.authorizedUsers &&
      demoConfig.project.authorizedUsers.length > 0;

    if (!hasAccess) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to this project",
        projectName,
        branchName,
        projectId: demoConfig.project.id,
        demoConfigId: demoConfig.id,
      });
    }

    // 將 Demo 配置資訊添加到請求對象，供後續使用
    req.demoConfig = demoConfig;

    next();
  } catch (error) {
    console.error("Demo 存取授權中間件錯誤:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Authorization check failed",
    });
  }
}

/**
 * 檢查 Demo 配置是否存在且啟用
 * 這是一個輕量級的檢查，不涉及使用者授權
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express next 函數
 */
async function checkDemoConfigExists(req, res, next) {
  try {
    const { demoConfigId } = req.params;

    if (!demoConfigId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Demo configuration ID is required",
      });
    }

    const demoConfig = await DemoConfig.findByPk(demoConfigId);

    if (!demoConfig) {
      return res.status(404).json({
        error: "Not Found",
        message: "Demo configuration not found",
      });
    }

    if (!demoConfig.isActive) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Demo configuration is not active",
      });
    }

    req.demoConfig = demoConfig;
    next();
  } catch (error) {
    console.error("Demo 配置檢查中間件錯誤:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Demo configuration check failed",
    });
  }
}

module.exports = {
  authorizeDemoAccess,
  authorizeDemoAccessByProjectAndBranch,
  checkDemoConfigExists,
};
