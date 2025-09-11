const { exec, spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { DemoConfig, Project } = require("../models");

// 靜態網站服務目錄
const STATIC_DEMOS_DIR = process.env.DATA_PATH
  ? path.join(process.env.DATA_PATH, "static_demos")
  : path.join(__dirname, "../../data/static_demos");

/**
 * 部署專案 Demo
 * @param {number} demoConfigId - Demo 配置 ID
 * @returns {Promise<Object>} 部署結果
 */
async function deployProjectDemo(demoConfigId) {
  console.log(`開始部署 Demo 配置 ID: ${demoConfigId}`);

  try {
    // 1. 查詢 Demo 配置
    const demoConfig = await DemoConfig.findByPk(demoConfigId, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "githubRepoUrl", "githubRepoName"],
        },
      ],
    });

    if (!demoConfig) {
      throw new Error(`Demo 配置 ID ${demoConfigId} 不存在`);
    }

    if (!demoConfig.project) {
      throw new Error(`Demo 配置 ID ${demoConfigId} 關聯的專案不存在`);
    }

    // 2. 更新部署狀態為 deploying
    await demoConfig.updateDeploymentStatus("deploying");

    const { project } = demoConfig;
    const { branchName, demoPath } = demoConfig;
    const { githubRepoUrl, name: projectName } = project;

    // 3. 確保靜態網站目錄存在
    await ensureStaticDemosDirectory();

    // 4. 準備目錄路徑
    const projectDir = path.join(STATIC_DEMOS_DIR, projectName);
    const branchDir = path.join(projectDir, branchName);
    // 使用固定的 temp 目錄名稱，基於專案名稱和分支名稱
    const tempDir = path.join(projectDir, `temp_${branchName}`);

    console.log(`專案目錄: ${projectDir}`);
    console.log(`分支目錄: ${branchDir}`);
    console.log(`臨時目錄: ${tempDir}`);

    // 5. 如果臨時目錄存在，先刪除
    const tempDirExists = await fs
      .access(tempDir, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    if (tempDirExists) {
      console.log(`臨時目錄 ${tempDir} 已存在，正在刪除...`);
      await fs.rm(tempDir, { recursive: true, force: true });
    }

    // 6. 執行 Git 操作
    await performGitOperations(githubRepoUrl, branchName, tempDir);

    // 7. 複製 Demo 內容
    await copyDemoContent(tempDir, demoPath, branchDir);

    // 8. 更新部署狀態為成功
    await demoConfig.updateDeploymentStatus("success");

    console.log(`Demo 配置 ID ${demoConfigId} 部署成功`);

    return {
      success: true,
      message: "部署成功",
      demoConfigId,
      projectName,
      branchName,
      deploymentPath: branchDir,
    };
  } catch (error) {
    console.error(`Demo 配置 ID ${demoConfigId} 部署失敗:`, error);

    // 更新部署狀態為失敗
    try {
      const demoConfig = await DemoConfig.findByPk(demoConfigId);
      if (demoConfig) {
        await demoConfig.updateDeploymentStatus("failed", error.message);
      }
    } catch (updateError) {
      console.error("更新部署狀態失敗:", updateError);
    }

    return {
      success: false,
      message: "部署失敗",
      error: error.message,
      demoConfigId,
    };
  }
}

/**
 * 確保靜態網站目錄存在
 */
async function ensureStaticDemosDirectory() {
  try {
    await fs.access(STATIC_DEMOS_DIR);
  } catch (error) {
    console.log(`創建靜態網站目錄: ${STATIC_DEMOS_DIR}`);
    await fs.mkdir(STATIC_DEMOS_DIR, { recursive: true });
  }
}

/**
 * 輔助函數：執行 shell 命令並返回 Promise
 * @param {string} command - 要執行的命令字符串
 * @param {object} [env] - 命令執行的環境變數 (可選)
 * @returns {Promise<string>} - 命令的標準輸出
 */
const execCommand = (command, env) => {
  return new Promise((resolve, reject) => {
    // 增加 maxBuffer 以應對可能較長的 Git 輸出
    exec(
      command,
      { env, maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        if (error) {
          console.error(
            `Command failed: ${command}\nError: ${error.message}\nStderr: ${stderr}`
          );
          return reject(error);
        }
        if (stderr) {
          // Git 會將一些非錯誤信息（如警告）輸出到 stderr，可以根據需要調整日誌級別
          console.warn(`Command warning: ${command}\nStderr: ${stderr}`);
        }
        console.log(`Command output: ${stdout}`); // 日誌記錄標準輸出
        resolve(stdout);
      }
    );
  });
};

/**
 * 執行 Git 克隆操作，用於獲取專案內容到臨時目錄。
 * 總是執行清潔克隆，以確保部署內容的最新和一致性。
 *
 * @param {string} githubRepoUrl - GitHub 倉庫 URL (例如: "https://github.com/owner/repo" 或 "git@github.com:owner/repo.git")
 * @param {string} branchName - 指定要克隆的分支名稱
 * @param {string} tempCloneDir - 臨時目錄，Git 倉庫將被克隆到此處
 * @param {string} gitSshPrivateKeyPath - SSH 私鑰的檔案路徑 (從環境變數 GIT_SSH_PRIVATE_KEY_PATH 取得)
 * @returns {Promise<void>}
 */
async function performGitOperations(githubRepoUrl, branchName, tempCloneDir) {
  console.log(
    `開始 Git 克隆操作: ${githubRepoUrl} (分支: ${branchName}) 到 ${tempCloneDir}`
  );

  const gitSshPrivateKeyPath = process.env.GIT_SSH_PRIVATE_KEY_PATH;
  if (!gitSshPrivateKeyPath) {
    throw new Error(
      "GIT_SSH_PRIVATE_KEY_PATH is not provided for Git operations. Please set it in your .env file."
    );
  }

  // 配置 GIT_SSH_COMMAND 環境變數以使用指定的私鑰
  const gitEnv = {
    ...process.env, // 保留現有的環境變數
    GIT_SSH_COMMAND: `ssh -i ${gitSshPrivateKeyPath} -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no`,
  };

  // 將 HTTPS 形式的 GitHub URL 轉換為 SSH 形式 (如果它是 HTTPS 的話)
  // Git 通常可以自行處理，但明確轉換可以確保使用 SSH 協議。
  const sshRepoUrl = githubRepoUrl.startsWith("https://github.com/")
    ? githubRepoUrl.replace("https://github.com/", "git@github.com:")
    : githubRepoUrl;

  try {
    // 確保臨時目錄的父目錄存在，如果不存在則創建
    await fs.mkdir(path.dirname(tempCloneDir), { recursive: true });

    // 執行 git clone 命令
    const cloneCommand = `git clone --depth 1 --branch ${branchName} ${sshRepoUrl} ${tempCloneDir}`;
    await execCommand(cloneCommand, gitEnv);

    console.log("Git clone 成功");
  } catch (error) {
    console.error("Git clone 失敗:", error);
    throw new Error(`Git clone 失敗: ${error.message}`);
  }
}

/**
 * 複製 Demo 內容
 * @param {string} sourceDir - 源目錄
 * @param {string} demoPath - Demo 路徑
 * @param {string} targetDir - 目標目錄
 */
async function copyDemoContent(sourceDir, demoPath, targetDir) {
  console.log(`複製 Demo 內容: ${sourceDir}${demoPath} -> ${targetDir}`);

  const sourcePath = path.join(sourceDir, demoPath);

  try {
    // 檢查源路徑是否存在
    await fs.access(sourcePath);

    // 如果目標目錄存在，先清空它
    const targetDirExists = await fs
      .access(targetDir, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (targetDirExists) {
      console.log(`清空目標目錄: ${targetDir}`);
      await fs.rm(targetDir, { recursive: true, force: true });
    }

    // 確保目標目錄存在
    await fs.mkdir(targetDir, { recursive: true });

    // 複製目錄內容
    await copyDirectory(sourcePath, targetDir);

    console.log("Demo 內容複製成功");
  } catch (error) {
    throw new Error(`複製 Demo 內容失敗: ${error.message}`);
  }
}

/**
 * 遞歸複製目錄
 * @param {string} src - 源目錄
 * @param {string} dest - 目標目錄
 */
async function copyDirectory(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    // 跳過 .git 目錄
    if (entry.name === ".git") continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * 清理臨時目錄
 * @param {string} tempDir - 臨時目錄路徑
 */
async function cleanupTempDirectory(tempDir) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`清理臨時目錄: ${tempDir}`);
  } catch (error) {
    console.warn(`清理臨時目錄失敗: ${error.message}`);
  }
}

/**
 * 根據 GitHub 倉庫和分支查找對應的 Demo 配置
 * @param {string} repoFullName - 倉庫完整名稱 (owner/repo)
 * @param {string} branchName - 分支名稱
 * @returns {Promise<Array>} 匹配的 Demo 配置列表
 */
async function findDemoConfigsByRepoAndBranch(repoFullName, branchName) {
  try {
    // 查找匹配的專案
    const projects = await Project.findAll({
      where: {
        githubRepoName: repoFullName,
        isActive: 1,
      },
    });

    if (projects.length === 0) {
      console.log(`未找到倉庫名稱匹配的專案: ${repoFullName}`);
      return [];
    }

    // 查找匹配的 Demo 配置
    const demoConfigs = [];
    for (const project of projects) {
      const configs = await DemoConfig.findAll({
        where: {
          projectId: project.id,
          branchName: branchName,
          isActive: 1,
        },
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["name", "githubRepoUrl"],
          },
        ],
      });
      demoConfigs.push(...configs);
    }

    console.log(`找到 ${demoConfigs.length} 個匹配的 Demo 配置`);
    return demoConfigs;
  } catch (error) {
    console.error("查找 Demo 配置失敗:", error);
    throw error;
  }
}

module.exports = {
  deployProjectDemo,
  findDemoConfigsByRepoAndBranch,
  STATIC_DEMOS_DIR,
};
