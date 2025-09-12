const crypto = require("crypto");
const {
  findDemoConfigsByRepoAndBranch,
  deployProjectDemo,
} = require("../services/deployService");
const { HookLog, Project } = require("../models");
const hookExecutionService = require("../services/hookExecutionService");
const logger = require("../config/logger");

/**
 * 驗證 GitHub Webhook 簽名
 * @param {string} payload - 請求體
 * @param {string} signature - X-Hub-Signature-256 標頭
 * @param {string} secret - GitHub Webhook 密鑰
 * @returns {boolean} 驗證結果
 */
function verifyGitHubSignature(payload, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * 處理 GitHub Webhook
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function handleGitHubWebhook(req, res) {
  let hookLog = null;
  const startTime = new Date();

  try {
    logger.info("收到 GitHub Webhook 請求");

    // 1. 驗證簽名
    const signature = req.get("X-Hub-Signature-256");
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    // req.body 是 Buffer，需要轉換為字符串
    const payload = req.body.toString();

    // if (!verifyGitHubSignature(payload, signature, secret)) {
    //   console.error("GitHub Webhook 簽名驗證失敗");
    //   return res.status(401).json({
    //     error: "Unauthorized",
    //     message: "Invalid signature",
    //   });
    // }

    // 2. 解析 Webhook 事件類型
    const eventType = req.get("X-GitHub-Event");
    logger.debug(`GitHub Webhook 事件類型: ${eventType}`);

    // 只處理 push 事件
    if (eventType !== "push") {
      logger.debug(`忽略非 push 事件: ${eventType}`);
      return res.status(200).json({
        message: "Event ignored",
        eventType,
      });
    }

    // 3. 解析 Payload
    const payloadData = JSON.parse(payload);
    const { repository, ref, commits } = payloadData;

    if (!repository || !ref) {
      logger.warn("GitHub Webhook Payload 缺少必要欄位");
      return res.status(400).json({
        error: "Bad Request",
        message: "Missing required fields in payload",
      });
    }

    // 4. 提取倉庫和分支資訊
    const repoFullName = repository.full_name;
    const branchName = ref.replace("refs/heads/", "");

    logger.info(`處理推送事件: ${repoFullName} -> ${branchName}`);

    // 5. 查找對應的 Project
    const project = await Project.findOne({
      where: { githubRepoName: repoFullName },
    });

    if (!project) {
      logger.info(`未找到對應的 Project: ${repoFullName}`);
      return res.status(200).json({
        message: "No matching project found",
        repository: repoFullName,
        branch: branchName,
      });
    }

    // 6. 創建 Hook Log 記錄
    hookLog = await HookLog.create({
      projectId: project.id,
      branch: branchName,
      startDateTime: startTime,
      status: "pending",
      webhookEventType: eventType,
      repositoryFullName: repoFullName,
    });

    // 7. 查找匹配的 Demo 配置
    const demoConfigs = await findDemoConfigsByRepoAndBranch(
      repoFullName,
      branchName
    );

    if (demoConfigs.length === 0) {
      logger.info(`未找到匹配的 Demo 配置: ${repoFullName} -> ${branchName}`);
      await hookLog.markAsSuccess({
        message: "No matching demo configurations found",
        totalConfigs: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
      });
      return res.status(200).json({
        message: "No matching demo configurations found",
        repository: repoFullName,
        branch: branchName,
        hookLogId: hookLog.id,
      });
    }

    // 8. 異步部署所有匹配的 Demo 配置
    const deploymentPromises = demoConfigs.map(async (demoConfig) => {
      try {
        logger.debug(`開始部署 Demo 配置 ID: ${demoConfig.id}`);
        const result = await deployProjectDemo(demoConfig.id);
        logger.debug(`Demo 配置 ID ${demoConfig.id} 部署結果:`, result);
        return {
          demoConfigId: demoConfig.id,
          success: result.success,
          message: result.message,
          error: result.error,
        };
      } catch (error) {
        logger.error(`Demo 配置 ID ${demoConfig.id} 部署異常:`, error);
        return {
          demoConfigId: demoConfig.id,
          success: false,
          message: "Deployment failed",
          error: error.message,
        };
      }
    });

    // 等待所有部署完成
    const deploymentResults = await Promise.allSettled(deploymentPromises);

    // 9. 統計部署結果
    const results = deploymentResults.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          message: "Deployment promise rejected",
          error: result.reason?.message || "Unknown error",
        };
      }
    });

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`部署完成: 成功 ${successCount} 個，失敗 ${failureCount} 個`);

    // 10. 更新 Hook Log 為成功狀態
    await hookLog.markAsSuccess({
      totalConfigs: demoConfigs.length,
      successCount,
      failureCount,
      results,
    });

    // 11. 返回響應
    res.status(200).json({
      message: "Webhook processed successfully",
      repository: repoFullName,
      branch: branchName,
      totalConfigs: demoConfigs.length,
      successCount,
      failureCount,
      results,
      hookLogId: hookLog.id,
    });
  } catch (error) {
    logger.error("處理 GitHub Webhook 時發生錯誤:", error);

    // 如果有 Hook Log 記錄，標記為失敗
    if (hookLog) {
      await hookLog.markAsFailed(error.message);
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to process webhook",
      details: error.message,
      hookLogId: hookLog?.id,
    });
  }
}

/**
 * 處理 GitHub Webhook 測試請求
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
function handleGitHubWebhookTest(req, res) {
  logger.info("收到 GitHub Webhook 測試請求");

  res.status(200).json({
    message: "GitHub Webhook endpoint is working",
    timestamp: new Date().toISOString(),
    environment: {
      hasWebhookSecret: !!process.env.GITHUB_WEBHOOK_SECRET,
      nodeVersion: process.version,
    },
  });
}

/**
 * 重新執行 Hook Log
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function reExecuteHookLog(req, res) {
  try {
    const { hookLogId } = req.params;

    const result = await hookExecutionService.reExecuteHookLog(
      parseInt(hookLogId)
    );

    if (result.success) {
      res.status(200).json({
        message: "Hook log re-execution started",
        newHookLogId: result.newHookLogId,
        originalHookLogId: result.originalHookLogId,
      });
    } else {
      res.status(400).json({
        error: "Bad Request",
        message: result.error,
      });
    }
  } catch (error) {
    logger.error("重新執行 Hook Log 時發生錯誤:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to re-execute hook log",
      details: error.message,
    });
  }
}

/**
 * 手動觸發專案 Hook 執行
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function triggerProjectHook(req, res) {
  try {
    const { projectId } = req.params;
    const { branch } = req.body;

    const result = await hookExecutionService.executeProjectHook(
      parseInt(projectId),
      branch || "main",
      "manual_trigger"
    );

    if (result.success) {
      res.status(200).json({
        message: "Project hook execution started",
        hookLogId: result.hookLogId,
        projectId: result.projectId,
        branch: result.branch,
      });
    } else {
      res.status(400).json({
        error: "Bad Request",
        message: result.error,
        hookLogId: result.hookLogId,
      });
    }
  } catch (error) {
    logger.error("手動觸發專案 Hook 時發生錯誤:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to trigger project hook",
      details: error.message,
    });
  }
}

module.exports = {
  handleGitHubWebhook,
  handleGitHubWebhookTest,
  verifyGitHubSignature,
  reExecuteHookLog,
  triggerProjectHook,
};
