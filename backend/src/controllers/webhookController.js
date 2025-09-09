const crypto = require("crypto");
const {
  findDemoConfigsByRepoAndBranch,
  deployProjectDemo,
} = require("../services/deployService");

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
  try {
    console.log("收到 GitHub Webhook 請求");

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
    console.log(`GitHub Webhook 事件類型: ${eventType}`);

    // 只處理 push 事件
    if (eventType !== "push") {
      console.log(`忽略非 push 事件: ${eventType}`);
      return res.status(200).json({
        message: "Event ignored",
        eventType,
      });
    }

    // 3. 解析 Payload
    const payloadData = JSON.parse(payload);
    const { repository, ref, commits } = payloadData;

    if (!repository || !ref) {
      console.error("GitHub Webhook Payload 缺少必要欄位");
      return res.status(400).json({
        error: "Bad Request",
        message: "Missing required fields in payload",
      });
    }

    // 4. 提取倉庫和分支資訊
    const repoFullName = repository.full_name;
    const branchName = ref.replace("refs/heads/", "");

    console.log(`處理推送事件: ${repoFullName} -> ${branchName}`);

    // 5. 查找匹配的 Demo 配置
    const demoConfigs = await findDemoConfigsByRepoAndBranch(
      repoFullName,
      branchName
    );

    if (demoConfigs.length === 0) {
      console.log(`未找到匹配的 Demo 配置: ${repoFullName} -> ${branchName}`);
      return res.status(200).json({
        message: "No matching demo configurations found",
        repository: repoFullName,
        branch: branchName,
      });
    }

    // 6. 異步部署所有匹配的 Demo 配置
    const deploymentPromises = demoConfigs.map(async (demoConfig) => {
      try {
        console.log(`開始部署 Demo 配置 ID: ${demoConfig.id}`);
        const result = await deployProjectDemo(demoConfig.id);
        console.log(`Demo 配置 ID ${demoConfig.id} 部署結果:`, result);
        return {
          demoConfigId: demoConfig.id,
          success: result.success,
          message: result.message,
          error: result.error,
        };
      } catch (error) {
        console.error(`Demo 配置 ID ${demoConfig.id} 部署異常:`, error);
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

    // 7. 統計部署結果
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

    console.log(`部署完成: 成功 ${successCount} 個，失敗 ${failureCount} 個`);

    // 8. 返回響應
    res.status(200).json({
      message: "Webhook processed successfully",
      repository: repoFullName,
      branch: branchName,
      totalConfigs: demoConfigs.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error) {
    console.error("處理 GitHub Webhook 時發生錯誤:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to process webhook",
      details: error.message,
    });
  }
}

/**
 * 處理 GitHub Webhook 測試請求
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
function handleGitHubWebhookTest(req, res) {
  console.log("收到 GitHub Webhook 測試請求");

  res.status(200).json({
    message: "GitHub Webhook endpoint is working",
    timestamp: new Date().toISOString(),
    environment: {
      hasWebhookSecret: !!process.env.GITHUB_WEBHOOK_SECRET,
      nodeVersion: process.version,
    },
  });
}

module.exports = {
  handleGitHubWebhook,
  handleGitHubWebhookTest,
  verifyGitHubSignature,
};
