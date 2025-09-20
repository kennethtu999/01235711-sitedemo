const { Op } = require("sequelize");
const User = require("../models/User");
const Group = require("../models/Group");
const Project = require("../models/Project");
const DemoConfig = require("../models/DemoConfig");
const ProjectUser = require("../models/ProjectUser");
const GroupProject = require("../models/GroupProject");
const DemoConfigUser = require("../models/DemoConfigUser");
const logger = require("../config/logger");

class ImportService {
  /**
   * 匯入資料
   * @param {Object} importData - 要匯入的資料
   * @param {Object} options - 匯入選項
   * @param {boolean} options.overwriteExisting - 是否覆蓋現有資料
   * @param {boolean} options.skipDuplicates - 是否跳過重複資料
   * @param {boolean} options.dryRun - 是否為試運行（不實際執行）
   * @returns {Object} 匯入結果
   */
  static async importData(importData, options = {}) {
    const {
      overwriteExisting = false,
      skipDuplicates = true,
      dryRun = false,
    } = options;

    const result = {
      success: true,
      errors: [],
      warnings: [],
      imported: {
        users: 0,
        groups: 0,
        projects: 0,
        demoConfigs: 0,
        projectUsers: 0,
        groupProjects: 0,
        demoConfigUsers: 0,
      },
      skipped: {
        users: 0,
        groups: 0,
        projects: 0,
        demoConfigs: 0,
        projectUsers: 0,
        groupProjects: 0,
        demoConfigUsers: 0,
      },
    };

    try {
      logger.info("開始匯入資料", { options, dryRun });

      // 驗證匯入資料格式
      this.validateImportData(importData);

      const { data } = importData;
      const idMappings = {
        users: new Map(),
        groups: new Map(),
        projects: new Map(),
        demoConfigs: new Map(),
      };

      // 1. 匯入用戶資料（無相依性）
      if (data.users && data.users.length > 0) {
        const userResult = await this.importUsers(
          data.users,
          idMappings.users,
          { overwriteExisting, skipDuplicates, dryRun }
        );
        result.imported.users = userResult.imported;
        result.skipped.users = userResult.skipped;
        result.errors.push(...userResult.errors);
        result.warnings.push(...userResult.warnings);
      }

      // 2. 匯入群組資料（無相依性）
      if (data.groups && data.groups.length > 0) {
        const groupResult = await this.importGroups(
          data.groups,
          idMappings.groups,
          { overwriteExisting, skipDuplicates, dryRun }
        );
        result.imported.groups = groupResult.imported;
        result.skipped.groups = groupResult.skipped;
        result.errors.push(...groupResult.errors);
        result.warnings.push(...groupResult.warnings);
      }

      // 3. 匯入專案資料（無相依性）
      if (data.projects && data.projects.length > 0) {
        const projectResult = await this.importProjects(
          data.projects,
          idMappings.projects,
          { overwriteExisting, skipDuplicates, dryRun }
        );
        result.imported.projects = projectResult.imported;
        result.skipped.projects = projectResult.skipped;
        result.errors.push(...projectResult.errors);
        result.warnings.push(...projectResult.warnings);
      }

      // 4. 匯入 Demo 配置資料（相依於專案）
      if (data.demoConfigs && data.demoConfigs.length > 0) {
        const demoResult = await this.importDemoConfigs(
          data.demoConfigs,
          idMappings,
          { overwriteExisting, skipDuplicates, dryRun }
        );
        result.imported.demoConfigs = demoResult.imported;
        result.skipped.demoConfigs = demoResult.skipped;
        result.errors.push(...demoResult.errors);
        result.warnings.push(...demoResult.warnings);
      }

      // 5. 匯入專案用戶權限（相依於專案和用戶）
      if (data.projectUsers && data.projectUsers.length > 0) {
        const projectUserResult = await this.importProjectUsers(
          data.projectUsers,
          idMappings,
          { overwriteExisting, skipDuplicates, dryRun }
        );
        result.imported.projectUsers = projectUserResult.imported;
        result.skipped.projectUsers = projectUserResult.skipped;
        result.errors.push(...projectUserResult.errors);
        result.warnings.push(...projectUserResult.warnings);
      }

      // 6. 匯入群組專案權限（相依於群組和專案）
      if (data.groupProjects && data.groupProjects.length > 0) {
        const groupProjectResult = await this.importGroupProjects(
          data.groupProjects,
          idMappings,
          { overwriteExisting, skipDuplicates, dryRun }
        );
        result.imported.groupProjects = groupProjectResult.imported;
        result.skipped.groupProjects = groupProjectResult.skipped;
        result.errors.push(...groupProjectResult.errors);
        result.warnings.push(...groupProjectResult.warnings);
      }

      // 7. 匯入 Demo 配置用戶權限（相依於 Demo 配置和用戶）
      if (data.demoConfigUsers && data.demoConfigUsers.length > 0) {
        const demoConfigUserResult = await this.importDemoConfigUsers(
          data.demoConfigUsers,
          idMappings,
          { overwriteExisting, skipDuplicates, dryRun }
        );
        result.imported.demoConfigUsers = demoConfigUserResult.imported;
        result.skipped.demoConfigUsers = demoConfigUserResult.skipped;
        result.errors.push(...demoConfigUserResult.errors);
        result.warnings.push(...demoConfigUserResult.warnings);
      }

      // 檢查是否有錯誤
      if (result.errors.length > 0) {
        result.success = false;
      }

      logger.info("資料匯入完成", {
        success: result.success,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors.length,
        warnings: result.warnings.length,
      });

      return result;
    } catch (error) {
      logger.error("匯入資料時發生錯誤", {
        error: error.message,
        stack: error.stack,
      });
      result.success = false;
      result.errors.push(`匯入失敗: ${error.message}`);
      return result;
    }
  }

  /**
   * 驗證匯入資料格式
   */
  static validateImportData(importData) {
    if (!importData || typeof importData !== "object") {
      throw new Error("匯入資料格式無效");
    }

    if (!importData.data || typeof importData.data !== "object") {
      throw new Error("匯入資料缺少 data 欄位");
    }

    // 檢查必要的資料結構
    const requiredFields = ["projects", "demoConfigs"];
    for (const field of requiredFields) {
      if (!importData.data[field]) {
        throw new Error(`匯入資料缺少必要欄位: ${field}`);
      }
    }
  }

  /**
   * 匯入用戶資料
   */
  static async importUsers(users, idMappings, options) {
    const result = { imported: 0, skipped: 0, errors: [], warnings: [] };

    for (const userData of users) {
      try {
        if (options.dryRun) {
          result.imported++;
          continue;
        }

        // 檢查是否已存在
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [
              { username: userData.username },
              { email: userData.email },
              { oidcSubject: userData.oidcSubject },
            ].filter(Boolean),
          },
        });

        if (existingUser) {
          if (options.skipDuplicates) {
            result.skipped++;
            result.warnings.push(`用戶已存在，跳過: ${userData.username}`);
            idMappings.set(userData.id, existingUser.id);
            continue;
          } else if (options.overwriteExisting) {
            // 更新現有用戶
            await existingUser.update({
              username: userData.username,
              role: userData.role,
              email: userData.email,
              isActive: userData.isActive,
              oidcProvider: userData.oidcProvider,
              oidcSubject: userData.oidcSubject,
              oidcEmail: userData.oidcEmail,
              oidcName: userData.oidcName,
              loginMethod: userData.loginMethod,
            });
            idMappings.set(userData.id, existingUser.id);
            result.imported++;
            continue;
          }
        }

        // 創建新用戶
        const newUser = await User.create({
          username: userData.username,
          role: userData.role,
          email: userData.email,
          isActive: userData.isActive,
          oidcProvider: userData.oidcProvider,
          oidcSubject: userData.oidcSubject,
          oidcEmail: userData.oidcEmail,
          oidcName: userData.oidcName,
          loginMethod: userData.loginMethod,
        });

        idMappings.set(userData.id, newUser.id);
        result.imported++;
      } catch (error) {
        result.errors.push(
          `匯入用戶失敗 ${userData.username}: ${error.message}`
        );
      }
    }

    return result;
  }

  /**
   * 匯入群組資料
   */
  static async importGroups(groups, idMappings, options) {
    const result = { imported: 0, skipped: 0, errors: [], warnings: [] };

    for (const groupData of groups) {
      try {
        if (options.dryRun) {
          result.imported++;
          continue;
        }

        // 檢查是否已存在
        const existingGroup = await Group.findOne({
          where: { name: groupData.name },
        });

        if (existingGroup) {
          if (options.skipDuplicates) {
            result.skipped++;
            result.warnings.push(`群組已存在，跳過: ${groupData.name}`);
            idMappings.set(groupData.id, existingGroup.id);
            continue;
          } else if (options.overwriteExisting) {
            // 更新現有群組
            await existingGroup.update({
              name: groupData.name,
              description: groupData.description,
              isAdminGroup: groupData.isAdminGroup,
              isActive: groupData.isActive,
              role: groupData.role,
            });
            idMappings.set(groupData.id, existingGroup.id);
            result.imported++;
            continue;
          }
        }

        // 創建新群組
        const newGroup = await Group.create({
          name: groupData.name,
          description: groupData.description,
          isAdminGroup: groupData.isAdminGroup,
          isActive: groupData.isActive,
          role: groupData.role,
        });

        idMappings.set(groupData.id, newGroup.id);
        result.imported++;
      } catch (error) {
        result.errors.push(`匯入群組失敗 ${groupData.name}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * 匯入專案資料
   */
  static async importProjects(projects, idMappings, options) {
    const result = { imported: 0, skipped: 0, errors: [], warnings: [] };

    for (const projectData of projects) {
      try {
        if (options.dryRun) {
          result.imported++;
          continue;
        }

        // 檢查是否已存在
        const existingProject = await Project.findOne({
          where: { githubRepoUrl: projectData.githubRepoUrl },
        });

        if (existingProject) {
          if (options.skipDuplicates) {
            result.skipped++;
            result.warnings.push(`專案已存在，跳過: ${projectData.name}`);
            idMappings.set(projectData.id, existingProject.id);
            continue;
          } else if (options.overwriteExisting) {
            // 更新現有專案
            await existingProject.update({
              name: projectData.name,
              description: projectData.description,
              githubRepoUrl: projectData.githubRepoUrl,
              githubRepoName: projectData.githubRepoName,
              isActive: projectData.isActive,
              lastSyncAt: projectData.lastSyncAt,
            });
            idMappings.set(projectData.id, existingProject.id);
            result.imported++;
            continue;
          }
        }

        // 創建新專案
        const newProject = await Project.create({
          name: projectData.name,
          description: projectData.description,
          githubRepoUrl: projectData.githubRepoUrl,
          githubRepoName: projectData.githubRepoName,
          isActive: projectData.isActive,
          lastSyncAt: projectData.lastSyncAt,
        });

        idMappings.set(projectData.id, newProject.id);
        result.imported++;
      } catch (error) {
        result.errors.push(
          `匯入專案失敗 ${projectData.name}: ${error.message}`
        );
      }
    }

    return result;
  }

  /**
   * 匯入 Demo 配置資料
   */
  static async importDemoConfigs(demoConfigs, idMappings, options) {
    const result = { imported: 0, skipped: 0, errors: [], warnings: [] };

    for (const demoData of demoConfigs) {
      try {
        if (options.dryRun) {
          result.imported++;
          continue;
        }

        // 檢查專案是否存在
        const projectId = idMappings.projects.get(demoData.projectId);
        if (!projectId) {
          result.errors.push(
            `Demo 配置 ${demoData.branchName} 的專案 ID ${demoData.projectId} 不存在`
          );
          continue;
        }

        // 檢查是否已存在
        const existingDemo = await DemoConfig.findOne({
          where: {
            projectId: projectId,
            branchName: demoData.branchName,
          },
        });

        if (existingDemo) {
          if (options.skipDuplicates) {
            result.skipped++;
            result.warnings.push(
              `Demo 配置已存在，跳過: ${demoData.branchName}`
            );
            idMappings.demoConfigs.set(demoData.id, existingDemo.id);
            continue;
          } else if (options.overwriteExisting) {
            // 更新現有 Demo 配置
            await existingDemo.update({
              projectId: projectId,
              branchName: demoData.branchName,
              demoPath: demoData.demoPath,
              subSiteFolders: demoData.subSiteFolders,
              displayName: demoData.displayName,
              description: demoData.description,
              deploymentStatus: demoData.deploymentStatus,
              lastDeploymentTime: demoData.lastDeploymentTime,
              deploymentError: demoData.deploymentError,
              isActive: demoData.isActive,
            });
            idMappings.demoConfigs.set(demoData.id, existingDemo.id);
            result.imported++;
            continue;
          }
        }

        // 創建新 Demo 配置
        const newDemo = await DemoConfig.create({
          projectId: projectId,
          branchName: demoData.branchName,
          demoPath: demoData.demoPath,
          subSiteFolders: demoData.subSiteFolders,
          displayName: demoData.displayName,
          description: demoData.description,
          deploymentStatus: demoData.deploymentStatus,
          lastDeploymentTime: demoData.lastDeploymentTime,
          deploymentError: demoData.deploymentError,
          isActive: demoData.isActive,
        });

        idMappings.demoConfigs.set(demoData.id, newDemo.id);
        result.imported++;
      } catch (error) {
        result.errors.push(
          `匯入 Demo 配置失敗 ${demoData.branchName}: ${error.message}`
        );
      }
    }

    return result;
  }

  /**
   * 匯入專案用戶權限
   */
  static async importProjectUsers(projectUsers, idMappings, options) {
    const result = { imported: 0, skipped: 0, errors: [], warnings: [] };

    for (const puData of projectUsers) {
      try {
        if (options.dryRun) {
          result.imported++;
          continue;
        }

        // 檢查專案和用戶是否存在
        const projectId = idMappings.projects.get(puData.projectId);
        const userId = idMappings.users.get(puData.userId);

        if (!projectId) {
          result.errors.push(
            `專案用戶權限的專案 ID ${puData.projectId} 不存在`
          );
          continue;
        }

        if (!userId) {
          result.errors.push(`專案用戶權限的用戶 ID ${puData.userId} 不存在`);
          continue;
        }

        // 檢查是否已存在
        const existingPu = await ProjectUser.findOne({
          where: {
            projectId: projectId,
            userId: userId,
          },
        });

        if (existingPu) {
          if (options.skipDuplicates) {
            result.skipped++;
            result.warnings.push(
              `專案用戶權限已存在，跳過: 專案 ${puData.projectId}, 用戶 ${puData.userId}`
            );
            continue;
          } else if (options.overwriteExisting) {
            // 更新現有權限
            await existingPu.update({
              role: puData.role,
              grantedAt: puData.grantedAt,
              grantedBy: puData.grantedBy,
            });
            result.imported++;
            continue;
          }
        }

        // 創建新權限
        await ProjectUser.create({
          projectId: projectId,
          userId: userId,
          role: puData.role,
          grantedAt: puData.grantedAt,
          grantedBy: puData.grantedBy,
        });

        result.imported++;
      } catch (error) {
        result.errors.push(`匯入專案用戶權限失敗: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * 匯入群組專案權限
   */
  static async importGroupProjects(groupProjects, idMappings, options) {
    const result = { imported: 0, skipped: 0, errors: [], warnings: [] };

    for (const gpData of groupProjects) {
      try {
        if (options.dryRun) {
          result.imported++;
          continue;
        }

        // 檢查群組和專案是否存在
        const groupId = idMappings.groups.get(gpData.groupId);
        const projectId = idMappings.projects.get(gpData.projectId);

        if (!groupId) {
          result.errors.push(`群組專案權限的群組 ID ${gpData.groupId} 不存在`);
          continue;
        }

        if (!projectId) {
          result.errors.push(
            `群組專案權限的專案 ID ${gpData.projectId} 不存在`
          );
          continue;
        }

        // 檢查是否已存在
        const existingGp = await GroupProject.findOne({
          where: {
            groupId: groupId,
            projectId: projectId,
          },
        });

        if (existingGp) {
          if (options.skipDuplicates) {
            result.skipped++;
            result.warnings.push(
              `群組專案權限已存在，跳過: 群組 ${gpData.groupId}, 專案 ${gpData.projectId}`
            );
            continue;
          } else if (options.overwriteExisting) {
            // 更新現有權限
            await existingGp.update({
              role: gpData.role,
              grantedAt: gpData.grantedAt,
              grantedBy: gpData.grantedBy,
            });
            result.imported++;
            continue;
          }
        }

        // 創建新權限
        await GroupProject.create({
          groupId: groupId,
          projectId: projectId,
          role: gpData.role,
          grantedAt: gpData.grantedAt,
          grantedBy: gpData.grantedBy,
        });

        result.imported++;
      } catch (error) {
        result.errors.push(`匯入群組專案權限失敗: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * 匯入 Demo 配置用戶權限
   */
  static async importDemoConfigUsers(demoConfigUsers, idMappings, options) {
    const result = { imported: 0, skipped: 0, errors: [], warnings: [] };

    for (const dcuData of demoConfigUsers) {
      try {
        if (options.dryRun) {
          result.imported++;
          continue;
        }

        // 檢查 Demo 配置和用戶是否存在
        const demoConfigId = idMappings.demoConfigs.get(dcuData.demoConfigId);
        const userId = idMappings.users.get(dcuData.userId);

        if (!demoConfigId) {
          result.errors.push(
            `Demo 配置用戶權限的 Demo 配置 ID ${dcuData.demoConfigId} 不存在`
          );
          continue;
        }

        if (!userId) {
          result.errors.push(
            `Demo 配置用戶權限的用戶 ID ${dcuData.userId} 不存在`
          );
          continue;
        }

        // 檢查是否已存在
        const existingDcu = await DemoConfigUser.findOne({
          where: {
            demoConfigId: demoConfigId,
            userId: userId,
          },
        });

        if (existingDcu) {
          if (options.skipDuplicates) {
            result.skipped++;
            result.warnings.push(
              `Demo 配置用戶權限已存在，跳過: Demo 配置 ${dcuData.demoConfigId}, 用戶 ${dcuData.userId}`
            );
            continue;
          } else if (options.overwriteExisting) {
            // 更新現有權限
            await existingDcu.update({
              grantedAt: dcuData.grantedAt,
              grantedBy: dcuData.grantedBy,
            });
            result.imported++;
            continue;
          }
        }

        // 創建新權限
        await DemoConfigUser.create({
          demoConfigId: demoConfigId,
          userId: userId,
          grantedAt: dcuData.grantedAt,
          grantedBy: dcuData.grantedBy,
        });

        result.imported++;
      } catch (error) {
        result.errors.push(`匯入 Demo 配置用戶權限失敗: ${error.message}`);
      }
    }

    return result;
  }
}

module.exports = ImportService;
