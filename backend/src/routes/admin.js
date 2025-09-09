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
  addDemoConfigUsers,
  removeDemoConfigUser,
} = require("../controllers/adminController");

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

// Demo 配置授權管理路由
router.post("/democonfigs/:demoConfigId/users", addDemoConfigUsers);
router.delete("/democonfigs/:demoConfigId/users/:userId", removeDemoConfigUser);

module.exports = router;
