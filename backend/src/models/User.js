const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [10, 255],
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      allowNull: false,
      defaultValue: "user",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    recoveryCodes: {
      type: DataTypes.TEXT,
      allowNull: true,
      // 儲存 JSON 字串格式的復原碼陣列
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

// 實例方法：驗證密碼
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// 實例方法：更新最後登入時間
User.prototype.updateLastLogin = async function () {
  this.lastLoginAt = new Date();
  await this.save();
};

// 實例方法：檢查是否為管理員
User.prototype.isAdmin = function () {
  return this.role === "admin";
};

module.exports = User;
