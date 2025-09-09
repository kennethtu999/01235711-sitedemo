const debugLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // 記錄請求資訊
  const requestInfo = {
    timestamp,
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
  };

  // 在開發環境下記錄完整的請求資訊
  if (
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_LOGGING === "true"
  ) {
    console.log("\n🔵 [REQUEST]", {
      ...requestInfo,
      // 在開發環境下顯示更多詳細資訊
      cookies: req.cookies,
      params: req.params,
    });
  } else {
    // 生產環境下只記錄基本資訊
    console.log(
      `🔵 [REQUEST] ${req.method} ${req.originalUrl} - ${req.ip} - ${timestamp}`
    );
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

    const responseInfo = {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      headers: {
        "content-type": res.get("Content-Type"),
        "content-length": res.get("Content-Length"),
      },
      body: responseBody,
    };

    // 根據狀態碼選擇不同的日誌級別和圖標
    let logLevel = "info";
    let icon = "🟢";

    if (res.statusCode >= 400 && res.statusCode < 500) {
      logLevel = "warn";
      icon = "🟡";
    } else if (res.statusCode >= 500) {
      logLevel = "error";
      icon = "🔴";
    }

    // 在開發環境下記錄完整的響應資訊
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DEBUG_LOGGING === "true"
    ) {
      console.log(`\n${icon} [RESPONSE]`, {
        ...responseInfo,
        request: {
          method: req.method,
          url: req.originalUrl,
        },
      });
    } else {
      // 生產環境下只記錄基本資訊
      console.log(
        `${icon} [RESPONSE] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${timestamp}`
      );
    }

    // 記錄慢請求警告
    if (duration > 1000) {
      console.warn(
        `⚠️  [SLOW REQUEST] ${req.method} ${req.originalUrl} took ${duration}ms`
      );
    }

    // 記錄錯誤響應的詳細資訊
    if (res.statusCode >= 400) {
      console.error(
        `❌ [ERROR RESPONSE] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`,
        {
          request: requestInfo,
          response: responseInfo,
        }
      );
    }
  });

  next();
};

module.exports = debugLogger;
