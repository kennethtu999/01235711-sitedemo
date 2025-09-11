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
      allowNull: true, // 改為可選，因為 OIDC 用戶可能沒有密碼
      validate: {
        len: [10, 255],
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "user",
      validate: {
        isIn: [["admin", "user"]],
      },
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
    // OIDC 相關欄位
    oidcProvider: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "OIDC 提供者名稱 (如: google, microsoft, auth0)",
    },
    oidcSubject: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "OIDC 主體識別符 (subject)",
    },
    oidcEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
      comment: "OIDC 提供的電子郵件地址",
    },
    oidcName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "OIDC 提供的顯示名稱",
    },
    loginMethod: {
      type: DataTypes.ENUM("password", "oidc"),
      allowNull: false,
      defaultValue: "password",
      comment: "登入方式",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        // 只有當用戶使用密碼登入且有密碼時才進行雜湊
        if (user.password && user.loginMethod === "password") {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        // 只有當用戶使用密碼登入且密碼有變更時才進行雜湊
        if (
          user.changed("password") &&
          user.password &&
          user.loginMethod === "password"
        ) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

// 實例方法：驗證密碼
User.prototype.validatePassword = async function (password) {
  // 如果用戶使用 OIDC 登入，則不支援密碼驗證
  if (this.loginMethod === "oidc") {
    return false;
  }

  // 如果用戶沒有密碼，則不支援密碼驗證
  if (!this.password) {
    return false;
  }

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

// 靜態方法：查找或創建 OIDC 用戶
User.findOrCreateOIDCUser = async function (oidcData) {
  const { provider, subject, email, name } = oidcData;

  // 首先嘗試通過 OIDC 主體查找用戶
  let user = await User.findOne({
    where: {
      oidcProvider: provider,
      oidcSubject: subject,
    },
  });

  if (user) {
    // 更新 OIDC 資訊（以防有變更）
    user.oidcEmail = email;
    user.oidcName = name;
    await user.save();
    return user;
  }

  // 如果沒找到，嘗試通過電子郵件查找現有用戶
  if (email) {
    user = await User.findOne({
      where: { email },
    });

    if (user) {
      // 將現有用戶轉換為 OIDC 用戶
      user.oidcProvider = provider;
      user.oidcSubject = subject;
      user.oidcEmail = email;
      user.oidcName = name;
      user.loginMethod = "oidc";
      // 清除密碼，因為現在使用 OIDC 登入
      user.password = null;
      await user.save();
      return user;
    }
  }

  // 創建新的 OIDC 用戶
  const username = email ? email.split("@")[0] : `oidc_${subject}`;

  // 確保用戶名唯一
  let uniqueUsername = username;
  let counter = 1;
  while (await User.findOne({ where: { username: uniqueUsername } })) {
    uniqueUsername = `${username}_${counter}`;
    counter++;
  }

  user = await User.create({
    username: uniqueUsername,
    email: email,
    oidcProvider: provider,
    oidcSubject: subject,
    oidcEmail: email,
    oidcName: name,
    loginMethod: "oidc",
    role: "user", // 預設為一般用戶
    isActive: true,
  });

  return user;
};

module.exports = User;
