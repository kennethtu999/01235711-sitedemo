const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    githubRepoUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    githubRepoName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      // 從 githubRepoUrl 提取的倉庫名稱，用於快速查詢
    },
    isActive: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: true,
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "projects",
    timestamps: true,
  }
);

// 實例方法：更新最後同步時間
Project.prototype.updateLastSync = async function () {
  this.lastSyncAt = new Date();
  await this.save();
};

module.exports = Project;
