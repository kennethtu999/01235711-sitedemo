const { Group, GroupUser, GroupProject, User, Project } = require("../models");
const groupPermissionService = require("../services/groupPermissionService");

/**
 * 群組控制器
 * 提供群組管理的簡單清單設定功能
 */

/**
 * 獲取所有群組列表
 * GET /api/groups
 */
const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: "users",
          through: {
            attributes: ["role", "joinedAt"],
          },
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("獲取群組列表錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch groups",
    });
  }
};

/**
 * 建立新群組
 * POST /api/groups
 */
const createGroup = async (req, res) => {
  try {
    const { name, description, role = "viewer" } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Group name is required",
      });
    }

    // 檢查群組名稱是否已存在
    const existingGroup = await Group.findOne({
      where: { name: name.trim() },
    });

    if (existingGroup) {
      return res.status(409).json({
        success: false,
        error: "Conflict",
        message: "Group name already exists",
      });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || null,
      role: role,
      isActive: true,
      // 如果角色是 admin，則自動設置為管理員群組
      isAdminGroup: role === "admin",
    });

    res.status(201).json({
      success: true,
      data: group,
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("建立群組錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to create group",
    });
  }
};

/**
 * 更新群組
 * PUT /api/groups/:id
 */
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, role } = req.body;

    const group = await Group.findByPk(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Group not found",
      });
    }

    // 檢查群組名稱是否已存在（排除自己）
    if (name && name.trim() !== group.name) {
      const existingGroup = await Group.findOne({
        where: {
          name: name.trim(),
          id: { [require("sequelize").Op.ne]: id },
        },
      });

      if (existingGroup) {
        return res.status(409).json({
          success: false,
          error: "Conflict",
          message: "Group name already exists",
        });
      }
    }

    await group.update({
      name: name?.trim() || group.name,
      description: description?.trim() || group.description,
      role: role !== undefined ? role : group.role,
      // 如果角色是 admin，則自動設置為管理員群組
      isAdminGroup:
        role === "admin" || (role === undefined && group.role === "admin"),
    });

    res.json({
      success: true,
      data: group,
      message: "Group updated successfully",
    });
  } catch (error) {
    console.error("更新群組錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to update group",
    });
  }
};

/**
 * 刪除群組（軟刪除）
 * DELETE /api/groups/:id
 */
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Group not found",
      });
    }

    // 不能刪除 adminGroup
    if (group.isAdminGroup) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Cannot delete admin group",
      });
    }

    await group.update({ isActive: false });

    res.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("刪除群組錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to delete group",
    });
  }
};

/**
 * 將使用者加入群組
 * POST /api/groups/:groupId/users
 */
const addUserToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, role = "member" } = req.body;

    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Group not found",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "User not found",
      });
    }

    // 檢查使用者是否已在群組中
    const existingMembership = await GroupUser.findOne({
      where: { groupId, userId },
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        error: "Conflict",
        message: "User is already in this group",
      });
    }

    await GroupUser.create({
      groupId,
      userId,
      role,
      addedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "User added to group successfully",
    });
  } catch (error) {
    console.error("將使用者加入群組錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to add user to group",
    });
  }
};

/**
 * 從群組移除使用者
 * DELETE /api/groups/:groupId/users/:userId
 */
const removeUserFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const membership = await GroupUser.findOne({
      where: { groupId, userId },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "User is not in this group",
      });
    }

    await membership.destroy();

    res.json({
      success: true,
      message: "User removed from group successfully",
    });
  } catch (error) {
    console.error("從群組移除使用者錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to remove user from group",
    });
  }
};

/**
 * 獲取使用者的群組列表
 * GET /api/users/:userId/groups
 */
const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;

    const groups = await groupPermissionService.getUserGroups(userId);

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("獲取使用者群組錯誤:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch user groups",
    });
  }
};

module.exports = {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  getUserGroups,
};
