const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Group = sequelize.define(
  "Group",
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
    isAdminGroup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      // 如果是 adminGroup，表示擁有所有專案權限
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "viewer",
      validate: {
        isIn: [["viewer", "editor", "admin"]],
      },
      // 群組角色：viewer(檢視者), editor(編輯者), admin(管理員)
    },
  },
  {
    tableName: "groups",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name"],
        name: "unique_group_name",
      },
    ],
  }
);

// 實例方法：檢查是否為管理員群組
Group.prototype.isAdminGroupType = function () {
  return this.isAdminGroup;
};

module.exports = Group;
