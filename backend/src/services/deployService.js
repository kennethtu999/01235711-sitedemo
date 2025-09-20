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

    console.log(`專案目錄: ${projectDir}`);
    console.log(`分支目錄: ${branchDir}`);

    // 5. 執行 Git 操作（直接操作目標目錄）
    await performGitOperations(githubRepoUrl, branchName, branchDir);

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
 * 執行 Git 克隆或拉取操作，用於獲取專案內容到目標目錄。
 * 策略：先嘗試 pull，失敗時嘗試 force override，最後才刪除重新 clone。
 *
 * @param {string} githubRepoUrl - GitHub 倉庫 URL (例如: "https://github.com/owner/repo" 或 "git@github.com:owner/repo.git")
 * @param {string} branchName - 指定要克隆的分支名稱
 * @param {string} targetDir - 目標目錄，Git 倉庫將被克隆到此處
 * @param {string} gitSshPrivateKeyPath - SSH 私鑰的檔案路徑 (從環境變數 GIT_SSH_PRIVATE_KEY_PATH 取得)
 * @returns {Promise<void>}
 */
async function performGitOperations(githubRepoUrl, branchName, targetDir) {
  console.log(
    `開始 Git 操作: ${githubRepoUrl} (分支: ${branchName}) 到 ${targetDir}`
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
    // 確保目標目錄的父目錄存在，如果不存在則創建
    await fs.mkdir(path.dirname(targetDir), { recursive: true });

    // 檢查目錄是否已存在且為 git 倉庫
    const isGitRepo = await checkIfGitRepo(targetDir);

    if (isGitRepo) {
      console.log("目錄已存在且為 Git 倉庫，嘗試 pull 更新...");
      try {
        await performGitPull(targetDir, branchName, gitEnv);
        console.log("Git pull 成功");
        return;
      } catch (pullError) {
        console.warn("Git pull 失敗，嘗試 force override:", pullError.message);
        try {
          await performGitForceUpdate(targetDir, branchName, gitEnv);
          console.log("Git force update 成功");
          return;
        } catch (forceError) {
          console.warn(
            "Git force update 也失敗，將刪除目錄重新 clone:",
            forceError.message
          );
          // 刪除目錄重新 clone
          await fs.rm(targetDir, { recursive: true, force: true });
        }
      }
    }

    // 執行 git clone 命令（目錄不存在或上述操作都失敗）
    console.log("執行 git clone...");
    const cloneCommand = `git clone --branch ${branchName} ${sshRepoUrl} ${targetDir}`;
    await execCommand(cloneCommand, gitEnv);
    console.log("Git clone 成功");
  } catch (error) {
    console.error("Git 操作失敗:", error);
    throw new Error(`Git 操作失敗: ${error.message}`);
  }
}

/**
 * 檢查目錄是否為 Git 倉庫
 * @param {string} dirPath - 目錄路徑
 * @returns {Promise<boolean>}
 */
async function checkIfGitRepo(dirPath) {
  try {
    await fs.access(path.join(dirPath, ".git"));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 執行 Git pull 操作
 * @param {string} repoDir - Git 倉庫目錄
 * @param {string} branchName - 分支名稱
 * @param {object} gitEnv - Git 環境變數
 * @returns {Promise<void>}
 */
async function performGitPull(repoDir, branchName, gitEnv) {
  // 切換到指定分支並拉取最新內容
  const pullCommand = `cd ${repoDir} && git fetch origin && git reset --hard origin/${branchName}`;
  await execCommand(pullCommand, gitEnv);
}

/**
 * 執行 Git force update 操作
 * @param {string} repoDir - Git 倉庫目錄
 * @param {string} branchName - 分支名稱
 * @param {object} gitEnv - Git 環境變數
 * @returns {Promise<void>}
 */
async function performGitForceUpdate(repoDir, branchName, gitEnv) {
  // 強制重置到遠端分支
  const forceCommand = `cd ${repoDir} && git fetch origin && git reset --hard origin/${branchName} && git clean -fd`;
  await execCommand(forceCommand, gitEnv);
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
