const ExportService = require("../services/exportService");
const ImportService = require("../services/importService");
const logger = require("../config/logger");

class ImportExportController {
  /**
   * 匯出所有資料
   */
  static async exportAllData(req, res) {
    try {
      const {
        includeUsers = "true",
        includeGroups = "true",
        includePermissions = "true",
      } = req.query;

      const options = {
        includeUsers: includeUsers === "true",
        includeGroups: includeGroups === "true",
        includePermissions: includePermissions === "true",
      };

      logger.info("開始匯出所有資料", { options, userId: req.user?.id });

      const exportData = await ExportService.exportData(options);

      res.json({
        success: true,
        message: "資料匯出成功",
        data: exportData,
      });
    } catch (error) {
      logger.error("匯出所有資料失敗", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: "匯出資料失敗",
        error: error.message,
      });
    }
  }

  /**
   * 匯出特定專案資料
   */
  static async exportProjectData(req, res) {
    try {
      const { projectId } = req.params;
      const {
        includeUsers = "true",
        includeGroups = "true",
        includePermissions = "true",
      } = req.query;

      const options = {
        includeUsers: includeUsers === "true",
        includeGroups: includeGroups === "true",
        includePermissions: includePermissions === "true",
      };

      logger.info("開始匯出專案資料", {
        projectId,
        options,
        userId: req.user?.id,
      });

      const exportData = await ExportService.exportProjectData(
        parseInt(projectId),
        options
      );

      res.json({
        success: true,
        message: "專案資料匯出成功",
        data: exportData,
      });
    } catch (error) {
      logger.error("匯出專案資料失敗", {
        projectId: req.params.projectId,
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: "匯出專案資料失敗",
        error: error.message,
      });
    }
  }

  /**
   * 匯入資料
   */
  static async importData(req, res) {
    try {
      const {
        overwriteExisting = "false",
        skipDuplicates = "true",
        dryRun = "false",
      } = req.body;

      const options = {
        overwriteExisting: overwriteExisting === "true",
        skipDuplicates: skipDuplicates === "true",
        dryRun: dryRun === "true",
      };

      logger.info("開始匯入資料", {
        options,
        userId: req.user?.id,
        dataSize: JSON.stringify(req.body.importData).length,
      });

      const result = await ImportService.importData(
        req.body.importData,
        options
      );

      const statusCode = result.success ? 200 : 400;

      res.status(statusCode).json({
        success: result.success,
        message: result.success ? "資料匯入成功" : "資料匯入失敗",
        result: result,
      });
    } catch (error) {
      logger.error("匯入資料失敗", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: "匯入資料失敗",
        error: error.message,
      });
    }
  }

  /**
   * 驗證匯入資料（試運行）
   */
  static async validateImportData(req, res) {
    try {
      logger.info("開始驗證匯入資料", {
        userId: req.user?.id,
        dataSize: JSON.stringify(req.body.importData).length,
      });

      const result = await ImportService.importData(req.body.importData, {
        overwriteExisting: false,
        skipDuplicates: true,
        dryRun: true,
      });

      res.json({
        success: true,
        message: "資料驗證完成",
        result: result,
      });
    } catch (error) {
      logger.error("驗證匯入資料失敗", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: "驗證匯入資料失敗",
        error: error.message,
      });
    }
  }

  /**
   * 獲取匯入/匯出歷史記錄
   */
  static async getImportExportHistory(req, res) {
    try {
      // 這裡可以實作歷史記錄功能
      // 目前先返回空陣列
      res.json({
        success: true,
        message: "獲取歷史記錄成功",
        data: {
          imports: [],
          exports: [],
        },
      });
    } catch (error) {
      logger.error("獲取歷史記錄失敗", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: "獲取歷史記錄失敗",
        error: error.message,
      });
    }
  }

  /**
   * 下載匯出檔案
   */
  static async downloadExportFile(req, res) {
    try {
      const { format = "json" } = req.query;

      logger.info("開始下載匯出檔案", {
        format,
        userId: req.user?.id,
      });

      // 匯出資料
      const exportData = await ExportService.exportData({
        includeUsers: true,
        includeGroups: true,
        includePermissions: true,
      });

      // 設定檔案名稱
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `export-${timestamp}.${format}`;

      // 設定回應標頭
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // 發送資料
      res.json(exportData);
    } catch (error) {
      logger.error("下載匯出檔案失敗", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: "下載匯出檔案失敗",
        error: error.message,
      });
    }
  }
}

module.exports = ImportExportController;
