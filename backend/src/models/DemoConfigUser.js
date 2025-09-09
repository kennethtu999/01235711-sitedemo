const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DemoConfigUser = sequelize.define(
  "DemoConfigUser",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    demoConfigId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "demo_configs",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    grantedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      // 記錄是誰授予這個權限的
    },
  },
  {
    tableName: "demo_config_users",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["demo_config_id", "user_id"],
        name: "unique_demo_config_user",
      },
    ],
  }
);

module.exports = DemoConfigUser;
