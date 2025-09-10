const { LRUCache } = require("lru-cache");

/**
 * Demo 授權服務
 * 使用 LRU 緩存來減少數據庫查詢次數
 */
class AuthorizeDemoService {
  constructor() {
    // 創建 LRU 緩存，最大 100 筆，TTL 60 秒
    this.cache = new LRUCache({
      max: 100,
      ttl: 60 * 1000, // 60 秒
    });
  }

  /**
   * 生成緩存鍵
   * @param {number} projectId - 專案 ID
   * @param {number} userId - 用戶 ID
   * @returns {string} 緩存鍵
   */
  generateCacheKey(projectId, userId) {
    return `project:${projectId}:user:${userId}`;
  }

  /**
   * 檢查用戶是否有專案權限（從緩存）
   * @param {number} projectId - 專案 ID
   * @param {number} userId - 用戶 ID
   * @returns {boolean|null} 權限狀態，null 表示緩存中沒有
   */
  checkPermission(projectId, userId) {
    const key = this.generateCacheKey(projectId, userId);
    const cached = this.cache.get(key);

    if (cached === undefined) {
      return null; // 緩存中沒有
    }

    return cached.hasAccess;
  }

  /**
   * 設置用戶專案權限到緩存
   * @param {number} projectId - 專案 ID
   * @param {number} userId - 用戶 ID
   * @param {boolean} hasAccess - 是否有權限
   */
  setPermission(projectId, userId, hasAccess) {
    const key = this.generateCacheKey(projectId, userId);
    this.cache.set(key, {
      hasAccess,
      timestamp: Date.now(),
    });
  }

  /**
   * 移除用戶專案權限緩存
   * @param {number} projectId - 專案 ID
   * @param {number} userId - 用戶 ID
   */
  removePermission(projectId, userId) {
    const key = this.generateCacheKey(projectId, userId);
    this.cache.delete(key);
  }

  /**
   * 移除專案的所有權限緩存
   * @param {number} projectId - 專案 ID
   */
  removeProjectPermissions(projectId) {
    // 遍歷所有緩存鍵，移除該專案的所有權限
    for (const key of this.cache.keys()) {
      if (key.startsWith(`project:${projectId}:user:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 移除用戶的所有權限緩存
   * @param {number} userId - 用戶 ID
   */
  removeUserPermissions(userId) {
    // 遍歷所有緩存鍵，移除該用戶的所有權限
    for (const key of this.cache.keys()) {
      if (key.endsWith(`:user:${userId}`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清除所有緩存
   */
  clearAll() {
    this.cache.clear();
  }

  /**
   * 獲取緩存統計信息
   * @returns {Object} 緩存統計
   */
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.cache.ttl,
    };
  }

  /**
   * 獲取所有緩存的權限信息（用於調試）
   * @returns {Array} 緩存中的權限列表
   */
  getAllPermissions() {
    const permissions = [];
    for (const [key, value] of this.cache.entries()) {
      const [, projectId, , userId] = key.split(":");
      permissions.push({
        projectId: parseInt(projectId),
        userId: parseInt(userId),
        hasAccess: value.hasAccess,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp,
      });
    }
    return permissions;
  }
}

// 創建單例實例
const authorizeDemoService = new AuthorizeDemoService();

module.exports = authorizeDemoService;
