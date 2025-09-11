const { User, Group, Project, GroupUser, GroupProject } = require("../models");

/**
 * 群組權限服務
 * 處理基於群組的專案權限檢查
 */
class GroupPermissionService {
  /**
   * 檢查使用者是否有專案權限（通過群組）
   * @param {number} userId - 使用者 ID
   * @param {number} projectId - 專案 ID
   * @param {string} requiredRole - 需要的角色 (viewer, editor, admin)
   * @returns {Promise<boolean>} 是否有權限
   */
  async checkUserProjectPermission(userId, projectId, requiredRole = "viewer") {
    try {
      // 1. 檢查使用者是否為系統管理員
      const user = await User.findByPk(userId);
      if (user && user.role === "admin") {
        return true;
      }

      // 2. 檢查使用者是否在 adminGroup 中
      const adminGroup = await Group.findOne({
        where: { isAdminGroup: true, isActive: true },
        include: [
          {
            model: User,
            as: "users",
            where: { id: userId },
            through: {
              attributes: [],
            },
            required: false,
          },
        ],
      });

      if (adminGroup && adminGroup.users && adminGroup.users.length > 0) {
        return true;
      }

      // 3. 檢查使用者是否在擁有該專案權限的群組中
      const userWithGroups = await User.findByPk(userId, {
        include: [
          {
            model: Group,
            as: "groups",
            where: { isActive: true },
            through: {
              attributes: [],
            },
            required: false,
            include: [
              {
                model: Project,
                as: "projects",
                where: { id: projectId, isActive: true },
                through: {
                  attributes: ["role"],
                },
                required: false,
              },
            ],
          },
        ],
      });

      if (!userWithGroups || !userWithGroups.groups) {
        return false;
      }

      // 檢查是否有任何群組擁有該專案權限且角色符合要求
      for (const group of userWithGroups.groups) {
        if (group.projects && group.projects.length > 0) {
          // 檢查群組角色是否滿足要求
          if (this.hasRequiredRole(group.role, requiredRole)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error("檢查群組權限時發生錯誤:", error);
      return false;
    }
  }

  /**
   * 獲取使用者可存取的專案列表（通過群組）
   * @param {number} userId - 使用者 ID
   * @returns {Promise<Array>} 專案列表
   */
  async getUserAccessibleProjects(userId) {
    try {
      // 1. 檢查使用者是否為系統管理員
      const user = await User.findByPk(userId);
      if (user && user.role === "admin") {
        // 管理員可以存取所有專案
        return await Project.findAll({
          where: { isActive: true },
          order: [["name", "ASC"]],
        });
      }

      // 2. 檢查使用者是否在 adminGroup 中
      const adminGroup = await Group.findOne({
        where: { isAdminGroup: true, isActive: true },
        include: [
          {
            model: User,
            as: "users",
            where: { id: userId },
            through: {
              attributes: [],
            },
            required: false,
          },
        ],
      });

      if (adminGroup && adminGroup.users && adminGroup.users.length > 0) {
        // adminGroup 成員可以存取所有專案
        return await Project.findAll({
          where: { isActive: true },
          order: [["name", "ASC"]],
        });
      }

      // 3. 獲取使用者群組可存取的專案
      const userWithGroups = await User.findByPk(userId, {
        include: [
          {
            model: Group,
            as: "groups",
            where: { isActive: true },
            through: {
              attributes: [],
            },
            required: false,
            include: [
              {
                model: Project,
                as: "projects",
                where: { isActive: true },
                through: {
                  attributes: ["role"],
                },
                required: false,
              },
            ],
          },
        ],
      });

      if (!userWithGroups || !userWithGroups.groups) {
        return [];
      }

      // 收集所有可存取的專案（去重）
      const accessibleProjects = new Map();
      for (const group of userWithGroups.groups) {
        if (group.projects) {
          for (const project of group.projects) {
            if (!accessibleProjects.has(project.id)) {
              accessibleProjects.set(project.id, project);
            }
          }
        }
      }

      return Array.from(accessibleProjects.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error("獲取使用者可存取專案時發生錯誤:", error);
      return [];
    }
  }

  /**
   * 獲取使用者的群組列表
   * @param {number} userId - 使用者 ID
   * @returns {Promise<Array>} 群組列表
   */
  async getUserGroups(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Group,
            as: "groups",
            where: { isActive: true },
            through: {
              attributes: ["role", "joinedAt"],
            },
            required: false,
          },
        ],
      });

      return user ? user.groups || [] : [];
    } catch (error) {
      console.error("獲取使用者群組時發生錯誤:", error);
      return [];
    }
  }

  /**
   * 檢查群組角色是否滿足所需角色
   * @param {string} groupRole - 群組角色
   * @param {string} requiredRole - 需要的角色
   * @returns {boolean} 是否滿足
   */
  hasRequiredRole(groupRole, requiredRole) {
    const roleHierarchy = {
      viewer: 1,
      editor: 2,
      admin: 3,
    };

    return roleHierarchy[groupRole] >= roleHierarchy[requiredRole];
  }

  /**
   * 建立預設的 adminGroup
   * @returns {Promise<Group>} adminGroup
   */
  async createDefaultAdminGroup() {
    try {
      // 檢查是否已存在 adminGroup
      let adminGroup = await Group.findOne({
        where: { isAdminGroup: true },
      });

      if (!adminGroup) {
        adminGroup = await Group.create({
          name: "adminGroup",
          description: "系統管理員群組，擁有所有專案權限",
          isAdminGroup: true,
          isActive: true,
        });
        console.log("已建立預設的 adminGroup");
      }

      return adminGroup;
    } catch (error) {
      console.error("建立預設 adminGroup 時發生錯誤:", error);
      throw error;
    }
  }
}

module.exports = new GroupPermissionService();
