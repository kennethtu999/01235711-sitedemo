const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const { authenticateJWT } = require("../middleware/auth");

// 所有群組相關路由都需要認證
router.use(authenticateJWT);

// 群組管理路由
router.get("/", groupController.getAllGroups);
router.post("/", groupController.createGroup);
router.put("/:id", groupController.updateGroup);
router.delete("/:id", groupController.deleteGroup);

// 群組使用者管理
router.post("/:groupId/users", groupController.addUserToGroup);
router.delete("/:groupId/users/:userId", groupController.removeUserFromGroup);

// 使用者相關路由
router.get("/users/:userId/groups", groupController.getUserGroups);

module.exports = router;
