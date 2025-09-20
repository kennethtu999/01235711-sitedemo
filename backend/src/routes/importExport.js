const express = require("express");
const router = express.Router();
const ImportExportController = require("../controllers/importExportController");
const { authenticateJWT } = require("../middleware/auth");

// 所有路由都需要認證
router.use(authenticateJWT);

// 匯出所有資料
router.get("/export", ImportExportController.exportAllData);

// 匯出特定專案資料
router.get(
  "/export/project/:projectId",
  ImportExportController.exportProjectData
);

// 下載匯出檔案
router.get("/download", ImportExportController.downloadExportFile);

// 匯入資料
router.post("/import", ImportExportController.importData);

// 驗證匯入資料（試運行）
router.post("/validate", ImportExportController.validateImportData);

// 獲取匯入/匯出歷史記錄
router.get("/history", ImportExportController.getImportExportHistory);

module.exports = router;
