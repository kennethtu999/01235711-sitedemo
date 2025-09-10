const { HookLog, Project, DemoConfig } = require("../models");
const { findDemoConfigsByRepoAndBranch } = require("./deployService");
const { deployProjectDemo } = require("./deployService");

/**
 * Hook 執行服務
 * 負責處理所有 hook 相關的執行邏輯
 */
class HookExecutionService {
  /**
   * 執行專案 Hook
   * @param {number} projectId - 專案 ID
   * @param {string} branch - 分支名稱
   * @param {string} eventType - 事件類型
   * @param {string} repositoryFullName - 倉庫全名
   * @returns {Promise<Object>} 執行結果
   */
  async executeProjectHook(
    projectId,
    branch,
    eventType = "manual_trigger",
    repositoryFullName = null
  ) {
    const startTime = new Date();
    let hookLog = null;

    try {
      // 查找專案
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      if (!project.isActive) {
        throw new Error("Project is not active");
      }

      // 使用提供的 repositoryFullName 或從專案獲取
      const repoFullName = repositoryFullName || project.githubRepoName;

      // 創建 Hook Log 記錄
      hookLog = await HookLog.create({
        projectId: project.id,
        branch: branch,
        startDateTime: startTime,
        status: "pending",
        webhookEventType: eventType,
        repositoryFullName: repoFullName,
      });

      // 異步執行部署
      setImmediate(async () => {
        try {
          await this._executeDeployment(hookLog, repoFullName, branch);
        } catch (error) {
          console.error("Hook 執行過程中發生錯誤:", error);
          await hookLog.markAsFailed(error.message);
        }
      });

      return {
        success: true,
        hookLogId: hookLog.id,
        projectId: project.id,
        branch: branch,
        message: "Hook execution started",
      };
    } catch (error) {
      console.error("執行專案 Hook 時發生錯誤:", error);

      // 如果有 Hook Log 記錄，標記為失敗
      if (hookLog) {
        await hookLog.markAsFailed(error.message);
      }

      return {
        success: false,
        error: error.message,
        hookLogId: hookLog?.id,
      };
    }
  }

  /**
   * 重新執行 Hook Log
   * @param {number} hookLogId - Hook Log ID
   * @returns {Promise<Object>} 執行結果
   */
  async reExecuteHookLog(hookLogId) {
    try {
      // 查找 Hook Log
      const hookLog = await HookLog.findByPk(hookLogId, {
        include: [{ model: Project, as: "project" }],
      });

      if (!hookLog) {
        throw new Error("Hook log not found");
      }

      if (!hookLog.project) {
        throw new Error("Associated project not found");
      }

      // 創建新的 Hook Log 記錄
      const newHookLog = await HookLog.create({
        projectId: hookLog.projectId,
        branch: hookLog.branch,
        startDateTime: new Date(),
        status: "pending",
        webhookEventType: "re_execute",
        repositoryFullName: hookLog.repositoryFullName,
      });

      // 異步執行重新部署
      setImmediate(async () => {
        try {
          await this._executeDeployment(
            newHookLog,
            hookLog.repositoryFullName,
            hookLog.branch
          );
        } catch (error) {
          console.error("重新執行 Hook 時發生錯誤:", error);
          await newHookLog.markAsFailed(error.message);
        }
      });

      return {
        success: true,
        newHookLogId: newHookLog.id,
        originalHookLogId: hookLogId,
        message: "Hook log re-execution started",
      };
    } catch (error) {
      console.error("重新執行 Hook Log 時發生錯誤:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 執行部署邏輯
   * @private
   * @param {Object} hookLog - Hook Log 實例
   * @param {string} repositoryFullName - 倉庫全名
   * @param {string} branch - 分支名稱
   */
  async _executeDeployment(hookLog, repositoryFullName, branch) {
    // 查找匹配的 Demo 配置
    const demoConfigs = await findDemoConfigsByRepoAndBranch(
      repositoryFullName,
      branch
    );

    if (demoConfigs.length === 0) {
      await hookLog.markAsSuccess({
        message: "No matching demo configurations found",
        totalConfigs: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
      });
      return;
    }

    // 異步部署所有匹配的 Demo 配置
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

    // 統計部署結果
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

    // 更新 Hook Log 為成功狀態
    await hookLog.markAsSuccess({
      totalConfigs: demoConfigs.length,
      successCount,
      failureCount,
      results,
    });
  }

  /**
   * 獲取 Hook 執行狀態
   * @param {number} hookLogId - Hook Log ID
   * @returns {Promise<Object>} 狀態信息
   */
  async getHookExecutionStatus(hookLogId) {
    try {
      const hookLog = await HookLog.findByPk(hookLogId, {
        include: [{ model: Project, as: "project" }],
      });

      if (!hookLog) {
        throw new Error("Hook log not found");
      }

      return {
        success: true,
        data: {
          id: hookLog.id,
          status: hookLog.status,
          startDateTime: hookLog.startDateTime,
          endDateTime: hookLog.endDateTime,
          processingTimeMs: hookLog.processingTimeMs,
          errorMessage: hookLog.errorMessage,
          deploymentResults: hookLog.deploymentResults,
          project: hookLog.project,
        },
      };
    } catch (error) {
      console.error("獲取 Hook 執行狀態時發生錯誤:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 批量執行多個專案的 Hook
   * @param {Array} projectConfigs - 專案配置數組 [{projectId, branch, eventType}]
   * @returns {Promise<Array>} 執行結果數組
   */
  async batchExecuteHooks(projectConfigs) {
    const results = [];

    for (const config of projectConfigs) {
      try {
        const result = await this.executeProjectHook(
          config.projectId,
          config.branch,
          config.eventType || "batch_trigger",
          config.repositoryFullName
        );
        results.push({
          projectId: config.projectId,
          success: result.success,
          hookLogId: result.hookLogId,
          error: result.error,
        });
      } catch (error) {
        results.push({
          projectId: config.projectId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

// 創建單例實例
const hookExecutionService = new HookExecutionService();

module.exports = hookExecutionService;
