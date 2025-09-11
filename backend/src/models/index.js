const User = require("./User");
const Project = require("./Project");
const DemoConfig = require("./DemoConfig");
const DemoConfigUser = require("./DemoConfigUser");
const ProjectUser = require("./ProjectUser");
const HookLog = require("./HookLog");
const Group = require("./Group");
const GroupUser = require("./GroupUser");
const GroupProject = require("./GroupProject");

// 定義模型關聯

// User 和 Project 的多對多關聯 (通過 ProjectUser 表)
User.belongsToMany(Project, {
  through: ProjectUser,
  foreignKey: "userId",
  otherKey: "projectId",
  as: "authorizedProjects",
});

Project.belongsToMany(User, {
  through: ProjectUser,
  foreignKey: "projectId",
  otherKey: "userId",
  as: "authorizedUsers",
});

// Project 和 ProjectUser 的一對多關聯
Project.hasMany(ProjectUser, {
  foreignKey: "projectId",
  as: "projectUsers",
  onDelete: "CASCADE",
});

// ProjectUser 的直接關聯
ProjectUser.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

ProjectUser.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// Project 和 DemoConfig 的一對多關聯
Project.hasMany(DemoConfig, {
  foreignKey: "projectId",
  as: "demoConfigs",
  onDelete: "CASCADE",
});

DemoConfig.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// User 和 DemoConfig 的多對多關聯 (通過 DemoConfigUser 表)
User.belongsToMany(DemoConfig, {
  through: DemoConfigUser,
  foreignKey: "userId",
  otherKey: "demoConfigId",
  as: "authorizedDemos",
});

DemoConfig.belongsToMany(User, {
  through: DemoConfigUser,
  foreignKey: "demoConfigId",
  otherKey: "userId",
  as: "authorizedUsers",
});

// DemoConfigUser 的直接關聯
DemoConfigUser.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

DemoConfigUser.belongsTo(DemoConfig, {
  foreignKey: "demoConfigId",
  as: "demoConfig",
});

DemoConfigUser.belongsTo(User, {
  foreignKey: "grantedBy",
  as: "granter",
});

// Project 和 HookLog 的一對多關聯
Project.hasMany(HookLog, {
  foreignKey: "projectId",
  as: "hookLogs",
  onDelete: "CASCADE",
});

HookLog.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// 新增群組相關關聯

// User 和 Group 的多對多關聯 (通過 GroupUser 表)
User.belongsToMany(Group, {
  through: GroupUser,
  foreignKey: "userId",
  otherKey: "groupId",
  as: "groups",
});

Group.belongsToMany(User, {
  through: GroupUser,
  foreignKey: "groupId",
  otherKey: "userId",
  as: "users",
});

// Group 和 Project 的多對多關聯 (通過 GroupProject 表)
Group.belongsToMany(Project, {
  through: GroupProject,
  foreignKey: "groupId",
  otherKey: "projectId",
  as: "projects",
});

Project.belongsToMany(Group, {
  through: GroupProject,
  foreignKey: "projectId",
  otherKey: "groupId",
  as: "groups",
});

// GroupUser 的直接關聯
GroupUser.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

GroupUser.belongsTo(Group, {
  foreignKey: "groupId",
  as: "group",
});

GroupUser.belongsTo(User, {
  foreignKey: "addedBy",
  as: "adder",
});

// GroupProject 的直接關聯
GroupProject.belongsTo(Group, {
  foreignKey: "groupId",
  as: "group",
});

GroupProject.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

GroupProject.belongsTo(User, {
  foreignKey: "grantedBy",
  as: "granter",
});

// 導出所有模型
module.exports = {
  User,
  Project,
  DemoConfig,
  DemoConfigUser,
  ProjectUser,
  HookLog,
  Group,
  GroupUser,
  GroupProject,
};
