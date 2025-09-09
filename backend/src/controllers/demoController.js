const path = require("path");
const fs = require("fs").promises;
const { STATIC_DEMOS_DIR } = require("../services/deployService");

/**
 * 服務靜態 Demo 檔案
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function serveDemoFiles(req, res) {
  try {
    // 從路由參數中獲取專案名稱和分支名稱
    const { projectName, branchName, subPath } = req.params;

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
          return res.sendFile(indexPath);
        } catch (error) {
          // 如果沒有 index.html，返回目錄列表或 404
          return res.status(404).json({
            error: "Not Found",
            message: "Directory index not found",
            path: requestedPath,
          });
        }
      } else {
        // 如果是檔案，直接提供
        return res.sendFile(filePath);
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
          return res.sendFile(indexPath);
        } catch (error) {
          // 如果沒有 index.html，返回目錄列表或 404
          return res.status(404).json({
            error: "Not Found",
            message: "Directory index not found",
            path: requestedPath,
          });
        }
      } else {
        // 如果是檔案，直接提供
        return res.sendFile(filePath);
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
