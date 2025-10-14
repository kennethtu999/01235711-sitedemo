const User = require("../models/User");
const Group = require("../models/Group");
const Project = require("../models/Project");
const DemoConfig = require("../models/DemoConfig");
const ProjectUser = require("../models/ProjectUser");
const GroupProject = require("../models/GroupProject");
const DemoConfigUser = require("../models/DemoConfigUser");
const logger = require("../config/logger");

class ExportService {
  /**
   * 匯出所有 Project 和 Demo 相關資料
   * @param {Object} options - 匯出選項
   * @param {boolean} options.includeUsers - 是否包含用戶資料
   * @param {boolean} options.includeGroups - 是否包含群組資料
   * @param {boolean} options.includePermissions - 是否包含權限關係
   * @returns {Object} 匯出的資料
   */
  static async exportData(options = {}) {
    const {
      includeUsers = true,
      includeGroups = true,
      includePermissions = true,
    } = options;

    try {
      logger.info("開始匯出資料", { options });

      const exportData = {
        metadata: {
          exportTime: new Date().toISOString(),
          version: "1.0",
          includes: {
            users: includeUsers,
            groups: includeGroups,
            projects: true,
            demoConfigs: true,
            permissions: includePermissions,
          },
        },
        data: {},
      };

      // 1. 匯出用戶資料
      if (includeUsers) {
        const users = await User.findAll({
          where: { isActive: true },
          attributes: {
            exclude: ["password", "twoFactorSecret", "recoveryCodes"],
          },
        });
        exportData.data.users = users.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          isActive: user.isActive,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLoginAt: user.lastLoginAt,
          oidcProvider: user.oidcProvider,
          oidcSubject: user.oidcSubject,
          oidcEmail: user.oidcEmail,
          oidcName: user.oidcName,
          loginMethod: user.loginMethod,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));
        logger.info(`匯出 ${users.length} 個用戶`);
      }

      // 2. 匯出群組資料
      if (includeGroups) {
        const groups = await Group.findAll({
          where: { isActive: true },
        });
        exportData.data.groups = groups.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          isAdminGroup: group.isAdminGroup,
          isActive: group.isActive,
          role: group.role,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        }));
        logger.info(`匯出 ${groups.length} 個群組`);
      }

      // 3. 匯出專案資料
      const projects = await Project.findAll({
        where: { isActive: true },
      });
      exportData.data.projects = projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        githubRepoUrl: project.githubRepoUrl,
        githubRepoName: project.githubRepoName,
        isActive: project.isActive,
        lastSyncAt: project.lastSyncAt,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }));
      logger.info(`匯出 ${projects.length} 個專案`);

      // 4. 匯出 Demo 配置資料
      const demoConfigs = await DemoConfig.findAll({
        where: { isActive: true },
      });
      exportData.data.demoConfigs = demoConfigs.map((demo) => ({
        id: demo.id,
        projectId: demo.projectId,
        branchName: demo.branchName,
        demoPath: demo.demoPath,
        subSiteFolders: demo.subSiteFolders,
        displayName: demo.displayName,
        subSiteDisplayName: demo.subSiteDisplayName,
        description: demo.description,
        deploymentStatus: demo.deploymentStatus,
        lastDeploymentTime: demo.lastDeploymentTime,
        deploymentError: demo.deploymentError,
        isActive: demo.isActive,
        createdAt: demo.createdAt,
        updatedAt: demo.updatedAt,
      }));
      logger.info(`匯出 ${demoConfigs.length} 個 Demo 配置`);

      // 5. 匯出權限關係資料
      if (includePermissions) {
        // 專案用戶權限
        const projectUsers = await ProjectUser.findAll();
        exportData.data.projectUsers = projectUsers.map((pu) => ({
          id: pu.id,
          projectId: pu.projectId,
          userId: pu.userId,
          role: pu.role,
          grantedAt: pu.grantedAt,
          grantedBy: pu.grantedBy,
          createdAt: pu.createdAt,
          updatedAt: pu.updatedAt,
        }));

        // 群組專案權限
        const groupProjects = await GroupProject.findAll();
        exportData.data.groupProjects = groupProjects.map((gp) => ({
          id: gp.id,
          groupId: gp.groupId,
          projectId: gp.projectId,
          role: gp.role,
          grantedAt: gp.grantedAt,
          grantedBy: gp.grantedBy,
          createdAt: gp.createdAt,
          updatedAt: gp.updatedAt,
        }));

        // Demo 配置用戶權限
        const demoConfigUsers = await DemoConfigUser.findAll();
        exportData.data.demoConfigUsers = demoConfigUsers.map((dcu) => ({
          id: dcu.id,
          demoConfigId: dcu.demoConfigId,
          userId: dcu.userId,
          grantedAt: dcu.grantedAt,
          grantedBy: dcu.grantedBy,
          createdAt: dcu.createdAt,
          updatedAt: dcu.updatedAt,
        }));

        logger.info(
          `匯出權限關係: ${projectUsers.length} 個專案用戶, ${groupProjects.length} 個群組專案, ${demoConfigUsers.length} 個 Demo 用戶`
        );
      }

      logger.info("資料匯出完成");
      return exportData;
    } catch (error) {
      logger.error("匯出資料時發生錯誤", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 匯出特定專案的資料
   * @param {number} projectId - 專案 ID
   * @param {Object} options - 匯出選項
   * @returns {Object} 匯出的資料
   */
  static async exportProjectData(projectId, options = {}) {
    const {
      includeUsers = true,
      includeGroups = true,
      includePermissions = true,
    } = options;

    try {
      logger.info("開始匯出專案資料", { projectId, options });

      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error(`專案 ID ${projectId} 不存在`);
      }

      const exportData = {
        metadata: {
          exportTime: new Date().toISOString(),
          version: "1.0",
          projectId: projectId,
          projectName: project.name,
          includes: {
            users: includeUsers,
            groups: includeGroups,
            projects: true,
            demoConfigs: true,
            permissions: includePermissions,
          },
        },
        data: {},
      };

      // 匯出專案資料
      exportData.data.projects = [
        {
          id: project.id,
          name: project.name,
          description: project.description,
          githubRepoUrl: project.githubRepoUrl,
          githubRepoName: project.githubRepoName,
          isActive: project.isActive,
          lastSyncAt: project.lastSyncAt,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      ];

      // 匯出該專案的 Demo 配置
      const demoConfigs = await DemoConfig.findAll({
        where: { projectId: projectId, isActive: true },
      });
      exportData.data.demoConfigs = demoConfigs.map((demo) => ({
        id: demo.id,
        projectId: demo.projectId,
        branchName: demo.branchName,
        demoPath: demo.demoPath,
        subSiteFolders: demo.subSiteFolders,
        displayName: demo.displayName,
        subSiteDisplayName: demo.subSiteDisplayName,
        description: demo.description,
        deploymentStatus: demo.deploymentStatus,
        lastDeploymentTime: demo.lastDeploymentTime,
        deploymentError: demo.deploymentError,
        isActive: demo.isActive,
        createdAt: demo.createdAt,
        updatedAt: demo.updatedAt,
      }));

      // 匯出相關用戶和群組（如果需要的話）
      if (includeUsers || includePermissions) {
        const projectUsers = await ProjectUser.findAll({
          where: { projectId: projectId },
        });

        if (includeUsers) {
          const userIds = [...new Set(projectUsers.map((pu) => pu.userId))];
          const users = await User.findAll({
            where: { id: userIds, isActive: true },
            attributes: {
              exclude: ["password", "twoFactorSecret", "recoveryCodes"],
            },
          });
          exportData.data.users = users.map((user) => ({
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            isActive: user.isActive,
            twoFactorEnabled: user.twoFactorEnabled,
            lastLoginAt: user.lastLoginAt,
            oidcProvider: user.oidcProvider,
            oidcSubject: user.oidcSubject,
            oidcEmail: user.oidcEmail,
            oidcName: user.oidcName,
            loginMethod: user.loginMethod,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }));
        }

        if (includePermissions) {
          exportData.data.projectUsers = projectUsers.map((pu) => ({
            id: pu.id,
            projectId: pu.projectId,
            userId: pu.userId,
            role: pu.role,
            grantedAt: pu.grantedAt,
            grantedBy: pu.grantedBy,
            createdAt: pu.createdAt,
            updatedAt: pu.updatedAt,
          }));

          // Demo 配置用戶權限
          const demoConfigUsers = await DemoConfigUser.findAll({
            where: { demoConfigId: demoConfigs.map((d) => d.id) },
          });
          exportData.data.demoConfigUsers = demoConfigUsers.map((dcu) => ({
            id: dcu.id,
            demoConfigId: dcu.demoConfigId,
            userId: dcu.userId,
            grantedAt: dcu.grantedAt,
            grantedBy: dcu.grantedBy,
            createdAt: dcu.createdAt,
            updatedAt: dcu.updatedAt,
          }));
        }
      }

      if (includeGroups || includePermissions) {
        const groupProjects = await GroupProject.findAll({
          where: { projectId: projectId },
        });

        if (includeGroups) {
          const groupIds = [...new Set(groupProjects.map((gp) => gp.groupId))];
          const groups = await Group.findAll({
            where: { id: groupIds, isActive: true },
          });
          exportData.data.groups = groups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            isAdminGroup: group.isAdminGroup,
            isActive: group.isActive,
            role: group.role,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          }));
        }

        if (includePermissions) {
          exportData.data.groupProjects = groupProjects.map((gp) => ({
            id: gp.id,
            groupId: gp.groupId,
            projectId: gp.projectId,
            role: gp.role,
            grantedAt: gp.grantedAt,
            grantedBy: gp.grantedBy,
            createdAt: gp.createdAt,
            updatedAt: gp.updatedAt,
          }));
        }
      }

      logger.info("專案資料匯出完成", { projectId });
      return exportData;
    } catch (error) {
      logger.error("匯出專案資料時發生錯誤", {
        projectId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = ExportService;
