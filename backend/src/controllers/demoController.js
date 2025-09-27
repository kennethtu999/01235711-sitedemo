const path = require("path");
const fs = require("fs").promises;
const { STATIC_DEMOS_DIR } = require("../services/deployService");
const { DemoConfig, Project } = require("../models");
const groupPermissionService = require("../services/groupPermissionService");

/**
 * 發送檔案並處理快取
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {string} filePath - 檔案路徑
 */
async function sendFileWithCache(req, res, filePath) {
  const stats = await fs.stat(filePath);
  const lastModified = stats.mtime.toUTCString();
  res.setHeader("Last-Modified", lastModified);

  const ifModifiedSince = req.headers["if-modified-since"];
  if (ifModifiedSince && new Date(ifModifiedSince) >= stats.mtime) {
    // 沒變更 → 回 304
    return res.status(304).end();
  }

  return res.sendFile(filePath);
}

/**
 * 服務靜態 Demo 檔案
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function serveDemoFiles(req, res) {
  try {
    // 從路由參數中獲取專案名稱和分支名稱
    const { projectName, branchName, subPath } = req.params;

    // 檢查用戶是否有權限訪問此專案
    // 管理員擁有所有 Demo 的存取權限
    if (req.user.role !== "admin") {
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

      // 檢查用戶是否有專案權限
      const hasAccess = await groupPermissionService.checkUserProjectPermission(
        req.user.id,
        demoConfig.project.id
      );

      if (!hasAccess) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have access to this project",
          projectName,
          branchName,
        });
      }
    }

    // 從查詢參數或路徑中獲取請求的檔案路徑
    // 如果使用通配符路由，req.params[0] 會包含通配符匹配的部分
    const requestedPath = subPath ? subPath.join("/") : ``;

    console.log(`requestedPath: ${requestedPath}`);

    // 構建檔案系統路徑：STATIC_DEMOS_DIR/projectName/branchName/subPath
    const demoDir = path.join(STATIC_DEMOS_DIR, projectName, branchName);
    const filePath = path.join(demoDir, requestedPath);

    console.log(`請求 Demo 檔案: ${filePath}`);

    // 安全檢查：確保請求的路徑在 Demo 目錄內
    const resolvedPath = path.resolve(filePath);
    const resolvedDemoDir = path.resolve(demoDir);

    if (!resolvedPath.startsWith(resolvedDemoDir)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Access denied: path traversal detected",
      });
    }

    try {
      // 檢查檔案或目錄是否存在
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        // 如果是目錄，嘗試提供 index.html
        const indexPath = path.join(filePath, "index.html");
        try {
          await fs.access(indexPath);
          return sendFileWithCache(req, res, indexPath);
        } catch (error) {
          // 如果沒有 index.html，返回目錄列表或 404
          return res.status(404).json({
            error: "Not Found",
            message: "Directory index not found",
            path: requestedPath,
          });
        }
      } else {
        // 如果是檔案，使用快取功能提供
        return sendFileWithCache(req, res, filePath);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        return res.status(404).json({
          error: "Not Found",
          message: "File not found",
          path: requestedPath,
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("服務 Demo 檔案時發生錯誤:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to serve demo files",
      details: error.message,
    });
  }
}

/**
 * 根據 Demo 配置 ID 服務靜態檔案
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function serveDemoFilesById(req, res) {
  try {
    const { demoConfigId } = req.params;
    // 從查詢參數或路徑中獲取請求的檔案路徑
    const requestedPath = req.query.path || req.path || "/";

    console.log(`請求 Demo 檔案 (ID: ${demoConfigId}): ${requestedPath}`);

    // 從請求對象中獲取 Demo 配置 (由中間件設置)
    const demoConfig = req.demoConfig;

    if (!demoConfig) {
      return res.status(404).json({
        error: "Not Found",
        message: "Demo configuration not found",
      });
    }

    // 構建檔案系統路徑
    const demoDir = path.join(
      STATIC_DEMOS_DIR,
      demoConfig.project.name,
      demoConfig.branchName
    );
    const filePath = path.join(demoDir, requestedPath);

    // 安全檢查：確保請求的路徑在 Demo 目錄內
    const resolvedPath = path.resolve(filePath);
    const resolvedDemoDir = path.resolve(demoDir);

    if (!resolvedPath.startsWith(resolvedDemoDir)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Access denied: path traversal detected",
      });
    }

    try {
      // 檢查檔案或目錄是否存在
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        // 如果是目錄，嘗試提供 index.html
        const indexPath = path.join(filePath, "index.html");
        try {
          await fs.access(indexPath);
          return sendFileWithCache(req, res, indexPath);
        } catch (error) {
          // 如果沒有 index.html，返回目錄列表或 404
          return res.status(404).json({
            error: "Not Found",
            message: "Directory index not found",
            path: requestedPath,
          });
        }
      } else {
        // 如果是檔案，使用快取功能提供
        return sendFileWithCache(req, res, filePath);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        return res.status(404).json({
          error: "Not Found",
          message: "File not found",
          path: requestedPath,
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("服務 Demo 檔案時發生錯誤:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to serve demo files",
      details: error.message,
    });
  }
}

module.exports = {
  serveDemoFiles,
  serveDemoFilesById,
};
