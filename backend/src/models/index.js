const User = require("./User");
const Project = require("./Project");
const DemoConfig = require("./DemoConfig");
const DemoConfigUser = require("./DemoConfigUser");

// 定義模型關聯

// User 和 Project 的多對多關聯 (通過 ProjectUser 表)
// 注意：這裡我們暫時不創建 ProjectUser 表，因為需求中沒有明確提到
// 如果需要，可以在後續階段添加

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

// 導出所有模型
module.exports = {
  User,
  Project,
  DemoConfig,
  DemoConfigUser,
};
