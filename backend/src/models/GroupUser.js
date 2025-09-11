const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GroupUser = sequelize.define(
  "GroupUser",
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "joined_at",
      defaultValue: DataTypes.NOW,
    },
    addedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "added_by",
      references: {
        model: "users",
        key: "id",
      },
      // 記錄是誰將使用者加入群組的
    },
    role: {
      type: DataTypes.ENUM("member", "admin"),
      allowNull: false,
      defaultValue: "member",
      // 在群組中的角色：member(成員), admin(群組管理員)
    },
  },
  {
    tableName: "group_users",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["group_id", "user_id"],
        name: "unique_group_user",
      },
    ],
  }
);

module.exports = GroupUser;
