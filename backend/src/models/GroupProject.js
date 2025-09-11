const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GroupProject = sequelize.define(
  "GroupProject",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "group_id",
      references: {
        model: "groups",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "project_id",
      references: {
        model: "projects",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "granted_at",
      defaultValue: DataTypes.NOW,
    },
    grantedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "granted_by",
      references: {
        model: "users",
        key: "id",
      },
      // 記錄是誰授予群組這個專案權限的
    },
    role: {
      type: DataTypes.ENUM("viewer", "editor", "admin"),
      allowNull: false,
      defaultValue: "viewer",
      // 群組在專案中的角色：viewer(查看者), editor(編輯者), admin(管理員)
    },
  },
  {
    tableName: "group_projects",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["group_id", "project_id"],
        name: "unique_group_project",
      },
    ],
  }
);

module.exports = GroupProject;
