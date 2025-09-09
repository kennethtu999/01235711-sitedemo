const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../middleware/auth");
const {
  authorizeDemoAccessByProjectAndBranch,
} = require("../middleware/authorizeDemoAccess");
const { serveDemoFiles } = require("../controllers/demoController");

// 根據專案名稱和分支名稱服務靜態檔案 (所有子路徑)
// 路由格式: /demo/:projectName/:branchName/* (支援所有子目錄和檔案)
router.get(
  "/:projectName/:branchName/*subPath",
  authenticateJWT,
  authorizeDemoAccessByProjectAndBranch,
  serveDemoFiles
);

module.exports = router;
