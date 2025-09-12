const logger = require("../config/logger");

const debugLogger = (req, res, next) => {
  const startTime = Date.now();

  // 記錄請求資訊（僅在 DEBUG 模式下記錄詳細資訊）
  if (logger.level === "debug") {
    const requestInfo = {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      headers: {
        "user-agent": req.get("User-Agent"),
        "content-type": req.get("Content-Type"),
        authorization: req.get("Authorization") ? "[REDACTED]" : undefined,
        "x-forwarded-for": req.get("X-Forwarded-For"),
        "x-real-ip": req.get("X-Real-IP"),
      },
      ip: req.ip || req.connection.remoteAddress,
      body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
      cookies: req.cookies,
      params: req.params,
    };

    logger.debug("Incoming Request", requestInfo);
  }

  // 攔截原始的 res.json 和 res.send 方法來記錄響應
  const originalJson = res.json;
  const originalSend = res.send;
  const originalEnd = res.end;

  let responseBody = null;

  res.json = function (body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.end = function (chunk, encoding) {
    if (chunk && !responseBody) {
      responseBody = chunk;
    }
    return originalEnd.call(this, chunk, encoding);
  };

  // 記錄響應資訊
  res.on("finish", () => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // 使用 logger 的 request 方法記錄 HTTP 請求
    logger.request(req, res, duration);

    // 在 DEBUG 模式下記錄詳細的響應資訊
    if (logger.level === "debug") {
      const responseInfo = {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        headers: {
          "content-type": res.get("Content-Type"),
          "content-length": res.get("Content-Length"),
        },
        body: responseBody,
      };

      logger.debug("Response Details", {
        ...responseInfo,
        request: {
          method: req.method,
          url: req.originalUrl,
        },
      });
    }

    // 記錄慢請求警告
    if (duration > 1000) {
      logger.performance("Slow Request", duration, {
        method: req.method,
        url: req.originalUrl,
      });
    }

    // 記錄錯誤響應的詳細資訊
    if (res.statusCode >= 400) {
      const errorData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      };

      if (res.statusCode >= 500) {
        logger.error("Server Error Response", errorData);
      } else {
        logger.warn("Client Error Response", errorData);
      }
    }
  });

  next();
};

module.exports = debugLogger;
