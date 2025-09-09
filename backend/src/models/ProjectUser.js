const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProjectUser = sequelize.define(
  "ProjectUser",
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
    role: {
      type: DataTypes.ENUM("viewer", "editor", "admin"),
      allowNull: false,
      defaultValue: "viewer",
      // 在項目中的角色：viewer(查看者), editor(編輯者), admin(管理員)
    },
  },
  {
    tableName: "project_users",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["project_id", "user_id"],
        name: "unique_project_user",
      },
    ],
  }
);

module.exports = ProjectUser;
