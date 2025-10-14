const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DemoConfig = sequelize.define(
  "DemoConfig",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    branchName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true,
      },
    },
    demoPath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "/",
      validate: {
        len: [1, 500],
        notEmpty: true,
      },
    },
    subSiteFolders: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: "",
      validate: {},
    },
    displayName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      // 可選的顯示名稱，如果沒有則使用 branchName
    },
    subSiteDisplayName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      // 可選的顯示名稱，如果沒有則使用 subSiteFolders name
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deploymentStatus: {
      type: DataTypes.ENUM("pending", "deploying", "success", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    lastDeploymentTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deploymentError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "demo_configs",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["project_id", "branch_name"],
        name: "unique_project_branch",
      },
    ],
  }
);

// 實例方法：更新部署狀態
DemoConfig.prototype.updateDeploymentStatus = async function (
  status,
  error = null
) {
  this.deploymentStatus = status;
  this.lastDeploymentTime = new Date();
  if (error) {
    this.deploymentError = error;
  }
  await this.save();
};

// 實例方法：獲取顯示名稱
DemoConfig.prototype.getDisplayName = function () {
  return this.displayName || this.branchName;
};

module.exports = DemoConfig;
