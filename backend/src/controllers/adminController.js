const {
  User,
  Project,
  DemoConfig,
  DemoConfigUser,
  ProjectUser,
} = require("../models");
const { Op } = require("sequelize");
const authorizeDemoService = require("../services/authorizeDemoService");

// ==================== 使用者管理 ====================

// 取得所有使用者
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password", "twoFactorSecret", "recoveryCodes"] },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: error.message,
    });
  }
};

// 創建新使用者
const createUser = async (req, res) => {
  try {
    const { username, password, email, role = "user" } = req.body;

    // 驗證必填欄位
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "Username and password are required",
      });
    }

    // 檢查使用者名稱是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "Username already exists",
      });
    }

    // 創建新使用者
    const newUser = await User.create({
      username,
      password,
      email,
      role,
    });

    // 回傳使用者資訊（不包含密碼）
    const userResponse = await User.findByPk(newUser.id, {
      attributes: { exclude: ["password", "twoFactorSecret", "recoveryCodes"] },
    });

    res.status(201).json({
      success: true,
      data: userResponse,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user",
      message: error.message,
    });
  }
};

// 更新使用者
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, email, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "The specified user does not exist",
      });
    }

    // 檢查使用者名稱是否已被其他使用者使用
    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        where: { username, id: { [Op.ne]: id } },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: "Username already exists",
        });
      }
    }

    // 更新使用者資訊
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.password = password;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    await user.update(updateData);

    // 回傳更新後的使用者資訊
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ["password", "twoFactorSecret", "recoveryCodes"] },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user",
      message: error.message,
    });
  }
};

// 刪除使用者
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "The specified user does not exist",
      });
    }

    // 檢查是否為管理員（防止刪除最後一個管理員）
    if (user.role === "admin") {
      const adminCount = await User.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete user",
          message: "Cannot delete the last admin user",
        });
      }
    }

    await user.destroy();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
      message: error.message,
    });
  }
};

// ==================== 專案管理 ====================

// 取得所有專案及其關聯的 Demo 配置和授權使用者
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: DemoConfig,
          as: "demoConfigs",
        },
        {
          model: ProjectUser,
          as: "projectUsers",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "email", "role"],
            },
          ],
          attributes: [
            "id",
            "projectId",
            "userId",
            "grantedAt",
            "grantedBy",
            "role",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // 將 projectUsers 重新命名為 authorizedUsers 以保持前端兼容性
    const projectsWithRenamedUsers = projects.map((project) => {
      const projectData = project.toJSON();
      projectData.authorizedUsers = projectData.projectUsers || [];
      delete projectData.projectUsers;
      return projectData;
    });

    res.json({
      success: true,
      data: projectsWithRenamedUsers,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
      message: error.message,
    });
  }
};

// 創建新專案
const createProject = async (req, res) => {
  try {
    const { name, description, githubRepoUrl, githubRepoName } = req.body;

    // 驗證必填欄位
    if (!name || !githubRepoUrl || !githubRepoName) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message:
          "Name, GitHub repository URL, and GitHub repository name are required",
      });
    }

    // 檢查專案名稱是否已存在
    const existingProject = await Project.findOne({ where: { name } });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "Project name already exists",
      });
    }

    // 創建新專案
    const newProject = await Project.create({
      name,
      description,
      githubRepoUrl,
      githubRepoName,
    });

    res.status(201).json({
      success: true,
      data: newProject,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
      message: error.message,
    });
  }
};

// 更新專案
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, githubRepoUrl, githubRepoName, isActive } =
      req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "The specified project does not exist",
      });
    }

    // 檢查專案名稱是否已被其他專案使用
    if (name && name !== project.name) {
      const existingProject = await Project.findOne({
        where: { name, id: { [Op.ne]: id } },
      });
      if (existingProject) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: "Project name already exists",
        });
      }
    }

    // 更新專案資訊
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (githubRepoUrl !== undefined) updateData.githubRepoUrl = githubRepoUrl;
    if (githubRepoName !== undefined)
      updateData.githubRepoName = githubRepoName;
    if (isActive !== undefined) updateData.isActive = isActive;

    await project.update(updateData);

    res.json({
      success: true,
      data: project,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update project",
      message: error.message,
    });
  }
};

// 刪除專案
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "The specified project does not exist",
      });
    }

    // 刪除專案（會級聯刪除相關的 DemoConfigs 和 DemoConfigUser 關聯）
    await project.destroy();

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
      message: error.message,
    });
  }
};

// ==================== Demo 配置管理 ====================

// 為指定專案創建 Demo 配置
const createDemoConfig = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      branchName,
      demoPath = "/",
      subSiteFolders,
      displayName,
      description,
    } = req.body;

    // 驗證必填欄位
    if (!branchName) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "Branch name is required",
      });
    }

    // 檢查專案是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "The specified project does not exist",
      });
    }

    // 檢查該專案下是否已存在相同分支的 Demo 配置
    const existingDemoConfig = await DemoConfig.findOne({
      where: { projectId, branchName },
    });
    if (existingDemoConfig) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "Demo configuration for this branch already exists",
      });
    }

    // 創建新的 Demo 配置
    const newDemoConfig = await DemoConfig.create({
      projectId,
      branchName,
      demoPath,
      subSiteFolders,
      displayName,
      description,
    });

    res.status(201).json({
      success: true,
      data: newDemoConfig,
      message: "Demo configuration created successfully",
    });
  } catch (error) {
    console.error("Error creating demo config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create demo configuration",
      message: error.message,
    });
  }
};

// 更新 Demo 配置
const updateDemoConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branchName,
      demoPath,
      subSiteFolders,
      displayName,
      description,
      isActive,
    } = req.body;

    const demoConfig = await DemoConfig.findByPk(id);
    if (!demoConfig) {
      return res.status(404).json({
        success: false,
        error: "Demo configuration not found",
        message: "The specified demo configuration does not exist",
      });
    }

    // 檢查分支名稱是否已被同一專案下的其他 Demo 配置使用
    if (branchName && branchName !== demoConfig.branchName) {
      const existingDemoConfig = await DemoConfig.findOne({
        where: {
          projectId: demoConfig.projectId,
          branchName,
          id: { [Op.ne]: id },
        },
      });
      if (existingDemoConfig) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: "Demo configuration for this branch already exists",
        });
      }
    }

    // 更新 Demo 配置
    const updateData = {};
    if (branchName !== undefined) updateData.branchName = branchName;
    if (demoPath !== undefined) updateData.demoPath = demoPath;
    if (subSiteFolders !== undefined)
      updateData.subSiteFolders = subSiteFolders;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    await demoConfig.update(updateData);

    res.json({
      success: true,
      data: demoConfig,
      message: "Demo configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating demo config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update demo configuration",
      message: error.message,
    });
  }
};

// 刪除 Demo 配置
const deleteDemoConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const demoConfig = await DemoConfig.findByPk(id);
    if (!demoConfig) {
      return res.status(404).json({
        success: false,
        error: "Demo configuration not found",
        message: "The specified demo configuration does not exist",
      });
    }

    // 刪除 Demo 配置（會級聯刪除相關的 DemoConfigUser 關聯）
    await demoConfig.destroy();

    res.json({
      success: true,
      message: "Demo configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting demo config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete demo configuration",
      message: error.message,
    });
  }
};

// ==================== 專案授權管理 ====================

// 為指定專案添加授權使用者
const addProjectUsers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userIds, role = "viewer" } = req.body;

    // 驗證必填欄位
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "User IDs array is required",
      });
    }

    // 檢查專案是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "The specified project does not exist",
      });
    }

    // 檢查所有使用者是否存在
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
    });

    if (users.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "One or more users not found",
      });
    }

    // 批量創建授權關聯
    const grantedBy = req.user.id;
    const authorizationData = userIds.map((userId) => ({
      projectId: parseInt(projectId),
      userId: parseInt(userId),
      grantedBy,
      role,
    }));

    await ProjectUser.bulkCreate(authorizationData, {
      ignoreDuplicates: true, // 忽略重複的授權
    });

    // 清除該專案的所有權限緩存
    authorizeDemoService.removeProjectPermissions(parseInt(projectId));

    res.json({
      success: true,
      message: "Users authorized successfully",
    });
  } catch (error) {
    console.error("Error adding project users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to authorize users",
      message: error.message,
    });
  }
};

// 更新專案使用者的角色
const updateProjectUserRole = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    // 驗證角色
    if (!role || !["viewer", "editor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "Valid role (viewer, editor, admin) is required",
      });
    }

    // 檢查授權關聯是否存在
    const authorization = await ProjectUser.findOne({
      where: {
        projectId: parseInt(projectId),
        userId: parseInt(userId),
      },
    });

    if (!authorization) {
      return res.status(404).json({
        success: false,
        error: "Authorization not found",
        message: "The specified authorization does not exist",
      });
    }

    // 更新角色
    await authorization.update({ role });

    // 清除該專案的所有權限緩存
    authorizeDemoService.removeProjectPermissions(parseInt(projectId));

    res.json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Error updating project user role:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
      message: error.message,
    });
  }
};

// 移除指定專案的授權使用者
const removeProjectUser = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // 檢查授權關聯是否存在
    const authorization = await ProjectUser.findOne({
      where: {
        projectId: parseInt(projectId),
        userId: parseInt(userId),
      },
    });

    if (!authorization) {
      return res.status(404).json({
        success: false,
        error: "Authorization not found",
        message: "The specified authorization does not exist",
      });
    }

    // 刪除授權關聯
    await authorization.destroy();

    // 清除該專案的所有權限緩存
    authorizeDemoService.removeProjectPermissions(parseInt(projectId));

    res.json({
      success: true,
      message: "User authorization removed successfully",
    });
  } catch (error) {
    console.error("Error removing project user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove user authorization",
      message: error.message,
    });
  }
};

// 移除指定專案的所有授權使用者
const removeAllProjectUsers = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 檢查專案是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "The specified project does not exist",
      });
    }

    // 刪除該專案的所有授權關聯
    const deletedCount = await ProjectUser.destroy({
      where: {
        projectId: parseInt(projectId),
      },
    });

    // 清除該專案的所有權限緩存
    authorizeDemoService.removeProjectPermissions(parseInt(projectId));

    res.json({
      success: true,
      message: `Removed ${deletedCount} user authorizations successfully`,
      data: { removedCount: deletedCount },
    });
  } catch (error) {
    console.error("Error removing all project users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove all user authorizations",
      message: error.message,
    });
  }
};

// 取得當前用戶可訪問的專案和 Demo 配置
const getUserAccessibleProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let projects;

    if (userRole === "admin") {
      // 管理員可以訪問所有專案
      projects = await Project.findAll({
        where: { isActive: true },
        include: [
          {
            model: DemoConfig,
            as: "demoConfigs",
            where: { isActive: true },
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } else {
      // 一般用戶只能訪問被授權的專案
      projects = await Project.findAll({
        where: { isActive: true },
        include: [
          {
            model: User,
            as: "authorizedUsers",
            where: { id: userId },
            required: true,
          },
          {
            model: DemoConfig,
            as: "demoConfigs",
            where: { isActive: true },
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    // 為每個專案添加 Demo URL
    const projectsWithUrls = projects.map((project) => {
      const projectWithUrls = project.toJSON();
      projectWithUrls.demoConfigs = projectWithUrls.demoConfigs.map(
        (demoConfig) => {
          const baseUrl = `/demo/${project.name}/${demoConfig.branchName}`;
          const demoUrl = `${baseUrl}${demoConfig.demoPath}`;

          // 處理 subSiteFolders
          let demoUrls = [];
          if (demoConfig.subSiteFolders && demoConfig.subSiteFolders.trim()) {
            const folders = demoConfig.subSiteFolders
              .split(",")
              .map((folder) => folder.trim())
              .filter((folder) => folder);
            demoUrls = folders.map((folder) => ({
              name: folder,
              url: `${baseUrl}/${folder}${demoConfig.demoPath}`,
            }));
          }

          return {
            ...demoConfig,
            demoUrl,
            demoUrls,
          };
        }
      );
      return projectWithUrls;
    });

    res.json({
      success: true,
      data: projectsWithUrls,
    });
  } catch (error) {
    console.error("Error fetching user accessible projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch accessible projects",
      message: error.message,
    });
  }
};

module.exports = {
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
  removeAllProjectUsers,
  getUserAccessibleProjects,

  // 緩存管理
  getCacheStats: async (req, res) => {
    try {
      const stats = authorizeDemoService.getStats();
      const permissions = authorizeDemoService.getAllPermissions();

      res.json({
        success: true,
        data: {
          stats,
          permissions,
        },
      });
    } catch (error) {
      console.error("Error getting cache stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get cache stats",
        message: error.message,
      });
    }
  },

  clearCache: async (req, res) => {
    try {
      authorizeDemoService.clearAll();

      res.json({
        success: true,
        message: "Cache cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear cache",
        message: error.message,
      });
    }
  },
};
