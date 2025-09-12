const { Sequelize } = require("sequelize");
const path = require("path");
const logger = require("./logger");

// 從環境變數獲取資料庫路徑，如果沒有則使用預設值
const dbPath =
  process.env.DATABASE_PATH ||
  path.join(__dirname, "../../data/database.sqlite");

// 自定義資料庫日誌函數
const databaseLogger = (sql, timing) => {
  // 只在 DEBUG 模式下記錄資料庫查詢
  if (logger.level === "debug") {
    logger.database(sql, timing);
  }
};

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: logger.level === "debug" ? databaseLogger : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// 啟用 WAL 模式以提高 SQLite 性能
sequelize.afterConnect(async (connection) => {
  await connection.exec("PRAGMA journal_mode = WAL;");
  await connection.exec("PRAGMA synchronous = NORMAL;");
  await connection.exec("PRAGMA cache_size = 1000;");
  await connection.exec("PRAGMA temp_store = MEMORY;");
});

module.exports = sequelize;
