const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HookLog = sequelize.define(
  "HookLog",
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
    },
    branch: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    startDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "success", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    webhookEventType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    repositoryFullName: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deploymentResults: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    processingTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Processing time in milliseconds",
    },
  },
  {
    tableName: "hook_logs",
    timestamps: true,
    indexes: [
      {
        fields: ["project_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["start_date_time"],
      },
      {
        fields: ["project_id", "branch"],
      },
    ],
  }
);

// 實例方法：計算處理時間
HookLog.prototype.calculateProcessingTime = function () {
  if (this.startDateTime && this.endDateTime) {
    this.processingTimeMs =
      this.endDateTime.getTime() - this.startDateTime.getTime();
  }
};

// 實例方法：標記為成功
HookLog.prototype.markAsSuccess = async function (deploymentResults = null) {
  this.endDateTime = new Date();
  this.status = "success";
  this.deploymentResults = deploymentResults;
  this.calculateProcessingTime();
  await this.save();
};

// 實例方法：標記為失敗
HookLog.prototype.markAsFailed = async function (errorMessage) {
  this.endDateTime = new Date();
  this.status = "failed";
  this.errorMessage = errorMessage;
  this.calculateProcessingTime();
  await this.save();
};

module.exports = HookLog;
