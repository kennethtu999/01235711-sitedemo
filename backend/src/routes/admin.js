const express = require("express");
const router = express.Router();
const { authenticateJWT, authorizeAdmin } = require("../middleware/auth");
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  createDemoConfig,
  updateDemoConfig,
  deleteDemoConfig,
  addProjectUsers,
  updateProjectUserRole,
  removeProjectUser,
} = require("../controllers/adminController");
const { triggerProjectHook } = require("../controllers/webhookController");

// 所有管理員路由都需要認證和授權
router.use(authenticateJWT);
router.use(authorizeAdmin);

// 使用者管理路由
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// 專案管理路由
router.get("/projects", getAllProjects);
router.post("/projects", createProject);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

// Demo 配置管理路由
router.post("/projects/:projectId/democonfigs", createDemoConfig);
router.put("/democonfigs/:id", updateDemoConfig);
router.delete("/democonfigs/:id", deleteDemoConfig);

// 專案授權管理路由
router.post("/projects/:projectId/users", addProjectUsers);
router.put("/projects/:projectId/users/:userId", updateProjectUserRole);
router.delete("/projects/:projectId/users/:userId", removeProjectUser);

// 專案 Hook 執行路由
router.post("/projects/:projectId/trigger-hook", triggerProjectHook);

module.exports = router;
