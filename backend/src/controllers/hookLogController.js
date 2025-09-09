const { HookLog, Project } = require("../models");
const { Op } = require("sequelize");

/**
 * 獲取 Hook Log 列表
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function getHookLogs(req, res) {
  try {
    const { page = 1, limit = 50, status, projectId } = req.query;
    const offset = (page - 1) * limit;

    // 構建查詢條件
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (projectId) {
      whereClause.projectId = projectId;
    }

    // 查詢 Hook Logs
    const { count, rows: hookLogs } = await HookLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "githubRepoName"],
        },
      ],
      order: [["startDateTime", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // 格式化響應數據
    const formattedLogs = hookLogs.map((log) => ({
      id: log.id,
      projectId: log.projectId,
      projectName: log.project?.name || "Unknown Project",
      githubRepoName: log.project?.githubRepoName || log.repositoryFullName,
      branch: log.branch,
      startDateTime: log.startDateTime,
      endDateTime: log.endDateTime,
      status: log.status,
      webhookEventType: log.webhookEventType,
      repositoryFullName: log.repositoryFullName,
      errorMessage: log.errorMessage,
      deploymentResults: log.deploymentResults,
      processingTimeMs: log.processingTimeMs,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        hookLogs: formattedLogs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("獲取 Hook Logs 時發生錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch hook logs",
      details: error.message,
    });
  }
}

/**
 * 獲取單個 Hook Log 詳情
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function getHookLogById(req, res) {
  try {
    const { hookLogId } = req.params;

    const hookLog = await HookLog.findByPk(hookLogId, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "githubRepoName", "description"],
        },
      ],
    });

    if (!hookLog) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Hook log not found",
      });
    }

    // 格式化響應數據
    const formattedLog = {
      id: hookLog.id,
      projectId: hookLog.projectId,
      projectName: hookLog.project?.name || "Unknown Project",
      githubRepoName:
        hookLog.project?.githubRepoName || hookLog.repositoryFullName,
      branch: hookLog.branch,
      startDateTime: hookLog.startDateTime,
      endDateTime: hookLog.endDateTime,
      status: hookLog.status,
      webhookEventType: hookLog.webhookEventType,
      repositoryFullName: hookLog.repositoryFullName,
      errorMessage: hookLog.errorMessage,
      deploymentResults: hookLog.deploymentResults,
      processingTimeMs: hookLog.processingTimeMs,
      createdAt: hookLog.createdAt,
      updatedAt: hookLog.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedLog,
    });
  } catch (error) {
    console.error("獲取 Hook Log 詳情時發生錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch hook log details",
      details: error.message,
    });
  }
}

/**
 * 獲取 Hook Log 統計信息
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
async function getHookLogStats(req, res) {
  try {
    const { projectId, days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // 構建查詢條件
    const whereClause = {
      startDateTime: {
        [Op.gte]: daysAgo,
      },
    };
    if (projectId) {
      whereClause.projectId = projectId;
    }

    // 獲取統計數據
    const [
      totalCount,
      successCount,
      failedCount,
      pendingCount,
      avgProcessingTime,
    ] = await Promise.all([
      HookLog.count({ where: whereClause }),
      HookLog.count({ where: { ...whereClause, status: "success" } }),
      HookLog.count({ where: { ...whereClause, status: "failed" } }),
      HookLog.count({ where: { ...whereClause, status: "pending" } }),
      HookLog.findOne({
        where: {
          ...whereClause,
          processingTimeMs: { [Op.ne]: null },
        },
        attributes: [
          [
            HookLog.sequelize.fn(
              "AVG",
              HookLog.sequelize.col("processing_time_ms")
            ),
            "avgProcessingTime",
          ],
        ],
        raw: true,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        success: successCount,
        failed: failedCount,
        pending: pendingCount,
        successRate:
          totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(2) : 0,
        avgProcessingTimeMs: avgProcessingTime?.avgProcessingTime
          ? Math.round(avgProcessingTime.avgProcessingTime)
          : 0,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error("獲取 Hook Log 統計時發生錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch hook log statistics",
      details: error.message,
    });
  }
}

module.exports = {
  getHookLogs,
  getHookLogById,
  getHookLogStats,
};
