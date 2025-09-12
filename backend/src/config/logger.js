const winston = require("winston");

// 定義日誌級別
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定義日誌級別顏色
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

// 自定義日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 控制台輸出格式
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// 根據環境變數決定日誌級別
const getLogLevel = () => {
  const env = process.env.NODE_ENV || "development";
  const logLevel = process.env.LOG_LEVEL || "info"; // 改為預設 info 級別

  // 生產環境預設為 info 級別，除非明確指定
  if (env === "production" && !process.env.LOG_LEVEL) {
    return "info";
  }

  return logLevel;
};

// 配置日誌傳輸器 - 只輸出到控制台
const transports = [
  new winston.transports.Console({
    level: getLogLevel(),
    format: consoleFormat,
  }),
];

// 創建 logger 實例
const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  format: logFormat,
  transports,
  // 異常處理也輸出到控制台
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Promise 拒絕處理也輸出到控制台
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// 所有環境都將異常輸出到控制台
logger.exceptions.handle(
  new winston.transports.Console({
    format: consoleFormat,
  })
);
logger.rejections.handle(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

// 添加自定義方法
logger.http = (message, meta = {}) => {
  logger.log("http", message, meta);
};

// 請求日誌方法
logger.request = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    contentLength: res.get("Content-Length"),
  };

  // 根據狀態碼選擇日誌級別
  if (res.statusCode >= 500) {
    logger.error(`HTTP ${req.method} ${req.originalUrl}`, logData);
  } else if (res.statusCode >= 400) {
    logger.warn(`HTTP ${req.method} ${req.originalUrl}`, logData);
  } else {
    logger.http(`HTTP ${req.method} ${req.originalUrl}`, logData);
  }
};

// 資料庫查詢日誌方法
logger.database = (query, duration) => {
  logger.debug("Database Query", {
    query: query.replace(/\s+/g, " ").trim(),
    duration: `${duration}ms`,
  });
};

// 業務邏輯日誌方法
logger.business = (operation, data = {}) => {
  logger.info(`Business: ${operation}`, data);
};

// 安全相關日誌方法
logger.security = (event, data = {}) => {
  logger.warn(`Security: ${event}`, data);
};

// 性能監控日誌方法
logger.performance = (operation, duration, data = {}) => {
  const level = duration > 1000 ? "warn" : "info";
  logger[level](`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...data,
  });
};

module.exports = logger;
