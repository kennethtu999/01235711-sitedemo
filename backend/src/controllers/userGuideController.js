const { UserGuide } = require("../models");

/**
 * 取得使用說明內容
 */
const getUserGuideContent = async (req, res) => {
  try {
    // 預設的使用說明內容
    const defaultContent = {
      overview: {
        title: "系統功能概述",
        description:
          "本系統提供完整的網站管理功能，包括使用者管理、專案管理、Hook 日誌管理等功能。透過 WEB 介面，您可以輕鬆管理整個系統。",
        features: [
          {
            title: "使用者管理",
            description: "管理系統使用者帳號、權限設定",
            icon: "user",
          },
          {
            title: "專案管理",
            description: "建立和管理專案、配置 Demo 設定",
            icon: "project",
          },
          {
            title: "Hook 管理",
            description: "監控和管理 Webhook 執行日誌",
            icon: "hook",
          },
        ],
      },
      userManagement: {
        title: "使用者管理功能",
        description:
          "在「使用者管理」頁面中，您可以管理系統中的所有使用者帳號。",
        steps: [
          {
            title: "查看使用者列表",
            content:
              "進入「使用者管理」頁面後，您可以看到所有已註冊的使用者列表，包括使用者名稱、電子郵件地址、角色權限、註冊時間、最後登入時間等資訊。",
          },
          {
            title: "新增使用者",
            content:
              "點擊「新增使用者」按鈕，填寫使用者名稱、電子郵件、密碼和角色等資訊。",
          },
          {
            title: "編輯使用者",
            content:
              "點擊使用者列表中的「編輯」按鈕，可以修改使用者名稱、電子郵件地址、密碼和角色權限。",
          },
          {
            title: "刪除使用者",
            content:
              "點擊「刪除」按鈕可以移除使用者帳號。請注意刪除操作無法復原，系統會自動移除該使用者的專案授權。",
          },
        ],
      },
      projectManagement: {
        title: "專案管理功能",
        description:
          "在「專案管理」頁面中，您可以建立和管理專案，以及配置 Demo 設定。",
        steps: [
          {
            title: "查看專案列表",
            content:
              "專案列表顯示所有已建立的專案，包括專案名稱和描述、專案狀態、建立時間、授權使用者數量、Demo 配置數量等資訊。",
          },
          {
            title: "建立新專案",
            content: "點擊「新增專案」按鈕，填寫專案名稱、描述和狀態等資訊。",
          },
          {
            title: "管理專案授權",
            content:
              "在專案詳情中，您可以新增使用者、設定角色、移除使用者或批量移除所有專案使用者。",
          },
          {
            title: "配置 Demo 設定",
            content:
              "為專案建立 Demo 配置，包括 Demo 名稱、版本、配置內容和狀態等。",
          },
          {
            title: "觸發專案 Hook",
            content: "手動觸發專案的 Webhook，執行結果會記錄在 Hook 日誌中。",
          },
        ],
      },
      hookManagement: {
        title: "Hook 日誌管理",
        description:
          "在「Hook Log 管理」頁面中，您可以監控和管理所有 Webhook 的執行記錄。",
        steps: [
          {
            title: "查看 Hook 日誌",
            content:
              "Hook 日誌列表顯示所有執行記錄，包括執行時間、專案名稱、Hook 類型、執行狀態、執行時間和錯誤訊息等。",
          },
          {
            title: "篩選和搜尋",
            content:
              "使用篩選功能快速找到特定記錄，包括狀態篩選、專案篩選、時間範圍和關鍵字搜尋等。",
          },
          {
            title: "查看詳細資訊",
            content:
              "點擊記錄可以查看詳細資訊，包括完整的請求內容、回應內容、執行環境資訊和錯誤堆疊追蹤等。",
          },
          {
            title: "清理日誌",
            content:
              "定期清理舊的日誌記錄，可以設定保留天數，建議定期清理以保持系統效能。",
          },
        ],
      },
      troubleshooting: {
        title: "常見問題與解決方案",
        description: "這裡提供系統使用過程中可能遇到的常見問題及其解決方案。",
        categories: [
          {
            title: "登入問題",
            items: [
              {
                question: "無法登入系統",
                solutions: [
                  "檢查使用者名稱和密碼是否正確",
                  "確認帳號是否已被停用",
                  "清除瀏覽器快取和 Cookie",
                  "檢查網路連線是否正常",
                ],
              },
              {
                question: "忘記密碼",
                solutions: [
                  "聯繫系統管理員重置密碼",
                  "管理員可以在使用者管理中修改密碼",
                ],
              },
            ],
          },
          {
            title: "專案管理問題",
            items: [
              {
                question: "無法建立專案",
                solutions: [
                  "確認您有管理員權限",
                  "檢查專案名稱是否重複",
                  "確認所有必填欄位都已填寫",
                ],
              },
              {
                question: "專案授權問題",
                solutions: [
                  "確認使用者已存在於系統中",
                  "檢查使用者是否已被其他專案授權",
                  "確認角色設定是否正確",
                ],
              },
            ],
          },
          {
            title: "Hook 執行問題",
            items: [
              {
                question: "Hook 執行失敗",
                solutions: [
                  "檢查專案配置是否正確",
                  "確認目標 URL 是否可達",
                  "檢查網路連線和防火牆設定",
                  "查看詳細錯誤訊息進行診斷",
                ],
              },
              {
                question: "Hook 執行緩慢",
                solutions: [
                  "檢查目標伺服器效能",
                  "確認網路延遲",
                  "檢查系統資源使用情況",
                ],
              },
            ],
          },
        ],
      },
      apiReference: {
        title: "API 端點參考",
        description: "系統提供 RESTful API 供外部系統整合使用。",
        endpoints: {
          auth: [
            {
              method: "POST",
              path: "/api/auth/login",
              description: "使用者登入",
              parameters: {
                username: "使用者名稱",
                password: "密碼",
              },
            },
            {
              method: "POST",
              path: "/api/auth/logout",
              description: "使用者登出",
              headers: {
                Authorization: "Bearer <token>",
              },
            },
          ],
          users: [
            {
              method: "GET",
              path: "/api/admin/users",
              description: "取得所有使用者",
              headers: {
                Authorization: "Bearer <token>",
              },
            },
            {
              method: "POST",
              path: "/api/admin/users",
              description: "建立使用者",
              headers: {
                Authorization: "Bearer <token>",
                "Content-Type": "application/json",
              },
              parameters: {
                username: "使用者名稱",
                email: "電子郵件",
                password: "密碼",
                role: "角色 (admin/user)",
              },
            },
          ],
          projects: [
            {
              method: "GET",
              path: "/api/admin/projects",
              description: "取得所有專案",
              headers: {
                Authorization: "Bearer <token>",
              },
            },
            {
              method: "POST",
              path: "/api/admin/projects",
              description: "建立專案",
              headers: {
                Authorization: "Bearer <token>",
                "Content-Type": "application/json",
              },
              parameters: {
                name: "專案名稱",
                description: "專案描述",
                status: "專案狀態 (active/inactive)",
              },
            },
          ],
        },
      },
    };

    res.json({
      success: true,
      data: defaultContent,
    });
  } catch (error) {
    console.error("取得使用說明內容失敗:", error);
    res.status(500).json({
      success: false,
      message: "取得使用說明內容失敗",
      error: error.message,
    });
  }
};

/**
 * 更新使用說明內容
 */
const updateUserGuideContent = async (req, res) => {
  try {
    const { section, content } = req.body;

    // 這裡可以實作將內容儲存到資料庫的邏輯
    // 目前先回傳成功訊息

    res.json({
      success: true,
      message: "使用說明內容已更新",
      data: { section, content },
    });
  } catch (error) {
    console.error("更新使用說明內容失敗:", error);
    res.status(500).json({
      success: false,
      message: "更新使用說明內容失敗",
      error: error.message,
    });
  }
};

module.exports = {
  getUserGuideContent,
  updateUserGuideContent,
};
