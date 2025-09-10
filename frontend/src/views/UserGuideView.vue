<template>
  <div class="user-guide-container">
    <n-page-header title="使用說明" subtitle="透過 WEB 設定系統的完整指南">
      <template #extra>
        <n-space>
          <n-button @click="refreshGuide" :loading="loading">
            <template #icon>
              <n-icon>
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                </svg>
              </n-icon>
            </template>
            重新整理
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-card class="guide-content">
      <n-tabs type="line" animated>
        <n-tab-pane name="overview" tab="系統概述">
          <div class="guide-section">
            <h3>系統功能概述</h3>
            <p>本系統提供完整的網站管理功能，包括使用者管理、專案管理、Hook 日誌管理等功能。透過 WEB 介面，您可以輕鬆管理整個系統。</p>
            
            <n-alert type="info" title="系統網址" style="margin: 16px 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🌐 對外網址：</span>
                <code style="background: rgba(24, 144, 255, 0.1); padding: 4px 8px; border-radius: 4px; font-weight: 500;">{{ baseUrl }}</code>
              </div>
              <div style="margin-top: 8px; color: var(--color-text-secondary);">
                所有使用者都從 <code>{{ loginUrl }}</code> 登入，登入後在 Dashboard 即可查看所有可訪問的 Demo 項目。
              </div>
            </n-alert>
            


            <!-- 新增：完整專案建立到 Demo 展示的指引 -->
            <div class="quick-start-guide">
              <h3>🚀 快速開始：建立專案並展示 Demo 頁面</h3>
              <p>以下是一個完整的範例，展示如何從零開始建立一個專案，並讓使用者能夠從 <code>{{ loginUrl }}</code> 登入後在 Dashboard 中查看 Demo 頁面。</p>
              
              <n-steps :current="0" vertical>
                <n-step title="步驟 1：建立新專案" status="process">
                  <div class="step-content">
                    <p><strong>進入專案管理頁面</strong></p>
                    <ol>
                      <li>在左側選單中點擊「專案管理」</li>
                      <li>點擊「新增專案」按鈕</li>
                      <li>填寫專案資訊：
                        <ul>
                          <li><strong>專案名稱：</strong> 例如「我的網站專案」</li>
                          <li><strong>描述：</strong> 例如「展示網站功能的 Demo 專案」</li>
                          <li><strong>狀態：</strong> 選擇「啟用」</li>
                        </ul>
                      </li>
                      <li>點擊「確認」建立專案</li>
                    </ol>
                    <n-alert type="info" title="提示">
                      專案建立後，系統會自動生成一個唯一的專案 ID，這個 ID 將用於後續的 Demo 配置。
                    </n-alert>
                  </div>
                </n-step>

                <n-step title="步驟 2：配置 Demo 設定" status="wait">
                  <div class="step-content">
                    <p><strong>為專案建立 Demo 配置</strong></p>
                    <ol>
                      <li>在專案列表中，點擊剛建立的專案進入詳情頁面</li>
                      <li>在「Demo 配置」區域點擊「新增 Demo 配置」</li>
                      <li>填寫配置資訊：
                        <ul>
                          <li><strong>Demo 名稱：</strong> 例如「主頁面 Demo」</li>
                          <li><strong>版本：</strong> 例如「v1.0」</li>
                          <li><strong>分支：</strong> 例如「main」</li>
                          <li><strong>狀態：</strong> 選擇「啟用」</li>
                        </ul>
                      </li>
                      <li>點擊「確認」建立 Demo 配置</li>
                    </ol>
                    <n-alert type="success" title="成功">
                      Demo 配置建立後，使用者可以從 <code>{{ loginUrl }}</code> 登入，在 Dashboard 中看到這個 Demo 項目，無需記住複雜的 URL！
                    </n-alert>
                  </div>
                </n-step>

                <n-step title="步驟 3：授權使用者訪問" status="wait">
                  <div class="step-content">
                    <p><strong>將 Demo 授權給特定使用者</strong></p>
                    <ol>
                      <li>在專案詳情頁面的「授權使用者」區域</li>
                      <li>點擊「新增使用者」按鈕</li>
                      <li>選擇要授權的使用者（需要先在「使用者管理」中建立）</li>
                      <li>設定使用者角色：
                        <ul>
                          <li><strong>管理員：</strong> 可以管理整個專案</li>
                          <li><strong>成員：</strong> 只能查看和訪問 Demo</li>
                        </ul>
                      </li>
                      <li>點擊「確認」完成授權</li>
                    </ol>
                    <n-alert type="warning" title="注意">
                      只有被授權的使用者才能訪問該專案的 Demo 頁面。確保使用者已經在系統中註冊。
                    </n-alert>
                  </div>
                </n-step>

                <n-step title="步驟 4：訪問 Demo 頁面" status="wait">
                  <div class="step-content">
                    <p><strong>線上查看 Demo 頁面</strong></p>
                    <ol>
                      <li>使用者訪問系統網址：<code>{{ loginUrl }}</code></li>
                      <li>使用被授權的使用者帳號登入系統</li>
                      <li>登入後進入 Dashboard，在「我的 Demo」列表中查看所有可訪問的 Demo</li>
                      <li>點擊對應的 Demo 項目即可直接進入 Demo 頁面</li>
                    </ol>
                    
                    <div class="demo-preview">
                      <h4>🎯 Demo 訪問方式</h4>
                      <ul>
                        <li><strong>統一入口：</strong> 所有使用者都從 <code>{{ loginUrl }}</code> 登入</li>
                        <li><strong>Dashboard 列表：</strong> 登入後在 Dashboard 查看所有可訪問的 Demo</li>
                        <li><strong>一鍵進入：</strong> 不需要記住複雜的 URL，直接點擊即可進入</li>
                        <li><strong>響應式設計：</strong> 支援桌面和行動裝置</li>
                        <li><strong>即時更新：</strong> 配置變更會即時反映在 Demo 頁面</li>
                        <li><strong>多版本支援：</strong> 可以同時維護多個版本的 Demo</li>
                        <li><strong>安全控制：</strong> 只有授權使用者才能看到對應的 Demo</li>
                      </ul>
                    </div>

                    <n-alert type="success" title="完成！">
                      現在您已經成功建立了一個完整的專案，使用者可以從 <code>{{ loginUrl }}</code> 登入後，在 Dashboard 中直接查看和訪問 Demo 頁面！
                    </n-alert>
                  </div>
                </n-step>

                <n-step title="步驟 5：監控和管理" status="wait">
                  <div class="step-content">
                    <p><strong>持續監控和管理專案</strong></p>
                    <ul>
                      <li><strong>查看訪問日誌：</strong> 在「Hook Log 管理」中監控 Demo 訪問情況</li>
                      <li><strong>更新配置：</strong> 隨時修改 Demo 配置內容</li>
                      <li><strong>管理授權：</strong> 新增或移除使用者授權</li>
                      <li><strong>版本控制：</strong> 建立新版本或回滾到舊版本</li>
                    </ul>
                  </div>
                </n-step>
              </n-steps>

              <div class="demo-example">
                <h4>📋 實際範例</h4>
                <p>假設您要建立一個「產品展示網站」的 Demo：</p>
                <n-card>
                  <n-space vertical>
                    <div><strong>專案名稱：</strong> 產品展示網站</div>
                    <div><strong>Demo 名稱：</strong> 首頁展示</div>
                    <div><strong>系統網址：</strong> <code>{{ loginUrl }}</code></div>
                    <div><strong>訪問方式：</strong> 登入後在 Dashboard 的「我的 Demo」列表中點擊進入</div>
                    <div><strong>授權使用者：</strong> 客戶、設計師、開發者</div>
                    <div><strong>功能特色：</strong> 產品輪播、聯絡表單、響應式設計</div>
                  </n-space>
                </n-card>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="user-management" tab="使用者管理">
          <div class="guide-section">
            <h3>使用者管理功能</h3>
            <p>在「使用者管理」頁面中，您可以管理系統中的所有使用者帳號。</p>
            
            <n-steps :current="0" vertical>
              <n-step title="查看使用者列表">
                <div class="step-content">
                  <p>進入「使用者管理」頁面後，您可以看到所有已註冊的使用者列表，包括：</p>
                  <ul>
                    <li>使用者名稱</li>
                    <li>電子郵件地址</li>
                    <li>角色權限（管理員/一般使用者）</li>
                    <li>註冊時間</li>
                    <li>最後登入時間</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="新增使用者">
                <div class="step-content">
                  <p>點擊「新增使用者」按鈕，填寫以下資訊：</p>
                  <ul>
                    <li><strong>使用者名稱：</strong> 唯一的使用者識別名稱</li>
                    <li><strong>電子郵件：</strong> 有效的電子郵件地址</li>
                    <li><strong>密碼：</strong> 至少 6 個字符的密碼</li>
                    <li><strong>角色：</strong> 選擇「管理員」或「一般使用者」</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="編輯使用者">
                <div class="step-content">
                  <p>點擊使用者列表中的「編輯」按鈕，可以修改：</p>
                  <ul>
                    <li>使用者名稱</li>
                    <li>電子郵件地址</li>
                    <li>密碼（留空表示不修改）</li>
                    <li>角色權限</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="刪除使用者">
                <div class="step-content">
                  <p>點擊「刪除」按鈕可以移除使用者帳號。請注意：</p>
                  <ul>
                    <li>刪除操作無法復原</li>
                    <li>系統會自動移除該使用者的專案授權</li>
                    <li>無法刪除最後一個管理員帳號</li>
                  </ul>
                </div>
              </n-step>
            </n-steps>
          </div>
        </n-tab-pane>

        <n-tab-pane name="project-management" tab="專案管理">
          <div class="guide-section">
            <h3>專案管理功能</h3>
            <p>在「專案管理」頁面中，您可以建立和管理專案，以及配置 Demo 設定。</p>
            
            <n-steps :current="0" vertical>
              <n-step title="查看專案列表">
                <div class="step-content">
                  <p>專案列表顯示所有已建立的專案，包括：</p>
                  <ul>
                    <li>專案名稱和描述</li>
                    <li>專案狀態（啟用/停用）</li>
                    <li>建立時間</li>
                    <li>授權使用者數量</li>
                    <li>Demo 配置數量</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="建立新專案">
                <div class="step-content">
                  <p>點擊「新增專案」按鈕，填寫專案資訊：</p>
                  <ul>
                    <li><strong>專案名稱：</strong> 專案的顯示名稱</li>
                    <li><strong>描述：</strong> 專案的詳細說明</li>
                    <li><strong>狀態：</strong> 選擇「啟用」或「停用」</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="管理專案授權">
                <div class="step-content">
                  <p>在專案詳情中，您可以：</p>
                  <ul>
                    <li><strong>新增使用者：</strong> 將現有使用者加入專案</li>
                    <li><strong>設定角色：</strong> 為專案使用者設定角色（管理員/成員）</li>
                    <li><strong>移除使用者：</strong> 從專案中移除使用者</li>
                    <li><strong>批量移除：</strong> 一次移除所有專案使用者</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="配置 Demo 設定">
                <div class="step-content">
                  <p>為專案建立 Demo 配置：</p>
                  <ul>
                    <li><strong>Demo 名稱：</strong> 配置的識別名稱</li>
                    <li><strong>版本：</strong> Demo 的版本號</li>
                    <li><strong>配置內容：</strong> JSON 格式的配置參數</li>
                    <li><strong>狀態：</strong> 配置的啟用狀態</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="觸發專案 Hook">
                <div class="step-content">
                  <p>手動觸發專案的 Webhook：</p>
                  <ul>
                    <li>點擊「觸發 Hook」按鈕</li>
                    <li>系統會執行專案相關的 Webhook 邏輯</li>
                    <li>執行結果會記錄在 Hook 日誌中</li>
                  </ul>
                </div>
              </n-step>
            </n-steps>
          </div>
        </n-tab-pane>

        <n-tab-pane name="hook-management" tab="Hook 管理">
          <div class="guide-section">
            <h3>Hook 日誌管理</h3>
            <p>在「Hook Log 管理」頁面中，您可以監控和管理所有 Webhook 的執行記錄。</p>
            
            <n-steps :current="0" vertical>
              <n-step title="查看 Hook 日誌">
                <div class="step-content">
                  <p>Hook 日誌列表顯示所有執行記錄，包括：</p>
                  <ul>
                    <li>執行時間</li>
                    <li>專案名稱</li>
                    <li>Hook 類型</li>
                    <li>執行狀態（成功/失敗）</li>
                    <li>執行時間（毫秒）</li>
                    <li>錯誤訊息（如有）</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="篩選和搜尋">
                <div class="step-content">
                  <p>使用篩選功能快速找到特定記錄：</p>
                  <ul>
                    <li><strong>狀態篩選：</strong> 只顯示成功或失敗的記錄</li>
                    <li><strong>專案篩選：</strong> 只顯示特定專案的記錄</li>
                    <li><strong>時間範圍：</strong> 設定查詢的時間範圍</li>
                    <li><strong>關鍵字搜尋：</strong> 搜尋特定的錯誤訊息或內容</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="查看詳細資訊">
                <div class="step-content">
                  <p>點擊記錄可以查看詳細資訊：</p>
                  <ul>
                    <li>完整的請求內容</li>
                    <li>回應內容</li>
                    <li>執行環境資訊</li>
                    <li>錯誤堆疊追蹤（如有）</li>
                  </ul>
                </div>
              </n-step>
              <n-step title="清理日誌">
                <div class="step-content">
                  <p>定期清理舊的日誌記錄：</p>
                  <ul>
                    <li>使用「清理日誌」功能移除舊記錄</li>
                    <li>可以設定保留天數</li>
                    <li>清理操作無法復原</li>
                    <li>建議定期清理以保持系統效能</li>
                  </ul>
                </div>
              </n-step>
            </n-steps>
          </div>
        </n-tab-pane>

        <n-tab-pane name="troubleshooting" tab="故障排除">
          <div class="guide-section">
            <h3>常見問題與解決方案</h3>
            
            <n-collapse>
              <n-collapse-item title="登入問題" name="login-issues">
                <div class="troubleshooting-content">
                  <h4>無法登入系統</h4>
                  <ul>
                    <li>檢查使用者名稱和密碼是否正確</li>
                    <li>確認帳號是否已被停用</li>
                    <li>清除瀏覽器快取和 Cookie</li>
                    <li>檢查網路連線是否正常</li>
                  </ul>
                  
                  <h4>忘記密碼</h4>
                  <ul>
                    <li>聯繫系統管理員重置密碼</li>
                    <li>管理員可以在使用者管理中修改密碼</li>
                  </ul>
                </div>
              </n-collapse-item>
              
              <n-collapse-item title="專案管理問題" name="project-issues">
                <div class="troubleshooting-content">
                  <h4>無法建立專案</h4>
                  <ul>
                    <li>確認您有管理員權限</li>
                    <li>檢查專案名稱是否重複</li>
                    <li>確認所有必填欄位都已填寫</li>
                  </ul>
                  
                  <h4>專案授權問題</h4>
                  <ul>
                    <li>確認使用者已存在於系統中</li>
                    <li>檢查使用者是否已被其他專案授權</li>
                    <li>確認角色設定是否正確</li>
                  </ul>
                </div>
              </n-collapse-item>
              
              <n-collapse-item title="Hook 執行問題" name="hook-issues">
                <div class="troubleshooting-content">
                  <h4>Hook 執行失敗</h4>
                  <ul>
                    <li>檢查專案配置是否正確</li>
                    <li>確認目標 URL 是否可達</li>
                    <li>檢查網路連線和防火牆設定</li>
                    <li>查看詳細錯誤訊息進行診斷</li>
                  </ul>
                  
                  <h4>Hook 執行緩慢</h4>
                  <ul>
                    <li>檢查目標伺服器效能</li>
                    <li>確認網路延遲</li>
                    <li>檢查系統資源使用情況</li>
                  </ul>
                </div>
              </n-collapse-item>
              
              <n-collapse-item title="系統效能問題" name="performance-issues">
                <div class="troubleshooting-content">
                  <h4>頁面載入緩慢</h4>
                  <ul>
                    <li>清除瀏覽器快取</li>
                    <li>檢查網路連線速度</li>
                    <li>聯繫系統管理員檢查伺服器狀態</li>
                  </ul>
                  
                  <h4>資料庫問題</h4>
                  <ul>
                    <li>定期清理舊的日誌記錄</li>
                    <li>檢查資料庫連線狀態</li>
                    <li>監控系統資源使用情況</li>
                  </ul>
                </div>
              </n-collapse-item>
            </n-collapse>
          </div>
        </n-tab-pane>

        <n-tab-pane name="api-reference" tab="API 參考">
          <div class="guide-section">
            <h3>API 端點參考</h3>
            <p>系統提供 RESTful API 供外部系統整合使用。</p>
            
            <n-tabs type="line" size="small">
              <n-tab-pane name="auth" tab="認證 API">
                <div class="api-section">
                  <h4>登入</h4>
                  <n-code language="http" :code="loginCode"></n-code>
                  
                  <h4>登出</h4>
                  <n-code language="http" :code="logoutCode"></n-code>
                </div>
              </n-tab-pane>
              
              <n-tab-pane name="users" tab="使用者 API">
                <div class="api-section">
                  <h4>取得所有使用者</h4>
                  <n-code language="http" :code="getUsersCode"></n-code>
                  
                  <h4>建立使用者</h4>
                  <n-code language="http" :code="createUserCode"></n-code>
                </div>
              </n-tab-pane>
              
              <n-tab-pane name="projects" tab="專案 API">
                <div class="api-section">
                  <h4>取得所有專案</h4>
                  <n-code language="http" :code="getProjectsCode"></n-code>
                  
                  <h4>建立專案</h4>
                  <n-code language="http" :code="createProjectCode"></n-code>
                </div>
              </n-tab-pane>
            </n-tabs>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  NPageHeader, 
  NButton, 
  NIcon, 
  NSpace, 
  NCard, 
  NTabs, 
  NTabPane, 
  NSteps, 
  NStep, 
  NCollapse, 
  NCollapseItem, 
  NCode 
} from 'naive-ui'

const loading = ref(false)

// 環境變數
const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'https://demo.kttu.cc'
const loginUrl = import.meta.env.VITE_APP_LOGIN_URL || 'https://demo.kttu.cc/login'

// API 程式碼範例
const loginCode = ref(`POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}`)

const logoutCode = ref(`POST /api/auth/logout
Authorization: Bearer <token>`)

const getUsersCode = ref(`GET /api/admin/users
Authorization: Bearer <token>`)

const createUserCode = ref(`POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password",
  "role": "user"
}`)

const getProjectsCode = ref(`GET /api/admin/projects
Authorization: Bearer <token>`)

const createProjectCode = ref(`POST /api/admin/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "status": "active"
}`)

const refreshGuide = () => {
  loading.value = true
  // 模擬重新整理
  setTimeout(() => {
    loading.value = false
  }, 1000)
}
</script>

<style scoped>
.user-guide-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.guide-content {
  margin-top: 24px;
}

.guide-section {
  padding: 24px 0;
}

.guide-section h3 {
  color: var(--color-text-primary);
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 600;
}

.guide-section h4 {
  color: var(--color-text-primary);
  margin: 16px 0 8px 0;
  font-size: 18px;
  font-weight: 500;
}

.guide-section p {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.guide-section ul {
  color: var(--color-text-secondary);
  line-height: 1.6;
  padding-left: 20px;
}

.guide-section li {
  margin-bottom: 8px;
}

.feature-grid {
  margin: 24px 0;
}

.feature-grid .n-card {
  text-align: center;
  height: 100%;
}

.feature-grid h4 {
  margin: 12px 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.feature-grid p {
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin: 0;
}

.step-content {
  padding: 16px 0;
}

.step-content p {
  margin-bottom: 12px;
}

.step-content ul {
  margin: 12px 0;
}

.troubleshooting-content {
  padding: 16px 0;
}

.troubleshooting-content h4 {
  margin: 16px 0 8px 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 500;
}

.troubleshooting-content ul {
  margin: 8px 0 16px 0;
}

.api-section {
  padding: 16px 0;
}

.api-section h4 {
  margin: 16px 0 8px 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 500;
}

:deep(.n-steps) {
  margin: 24px 0;
}

:deep(.n-step-content) {
  margin-top: 8px;
}

:deep(.n-collapse) {
  margin: 24px 0;
}

:deep(.n-code) {
  margin: 12px 0;
}

/* 快速開始指南樣式 */
.quick-start-guide {
  margin-top: 32px;
  padding: 24px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border-primary);
}

.quick-start-guide h3 {
  color: var(--color-text-primary);
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-start-guide p {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.step-content {
  padding: 16px 0;
}

.step-content p {
  margin-bottom: 12px;
  font-weight: 500;
}

.step-content ol {
  margin: 12px 0;
  padding-left: 20px;
}

.step-content ol li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.step-content ul {
  margin: 8px 0 16px 20px;
}

.step-content ul li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.demo-preview {
  margin: 20px 0;
  padding: 16px;
  background: var(--color-bg-primary);
  border-radius: 6px;
  border-left: 4px solid var(--color-primary);
}

.demo-preview h4 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 500;
}

.demo-preview ul {
  margin: 0;
  padding-left: 20px;
}

.demo-preview li {
  margin-bottom: 6px;
  line-height: 1.5;
}

.demo-example {
  margin-top: 32px;
  padding: 20px;
  background: var(--color-bg-primary);
  border-radius: 8px;
  border: 1px solid var(--color-border-secondary);
}

.demo-example h4 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-example p {
  margin: 0 0 16px 0;
  color: var(--color-text-secondary);
}

.demo-example .n-card {
  margin-top: 12px;
}

.demo-example code {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: var(--color-text-primary);
}

/* 步驟樣式優化 */
:deep(.n-steps) {
  margin: 24px 0;
}

:deep(.n-step-content) {
  margin-top: 12px;
}

:deep(.n-step-title) {
  font-weight: 500;
  font-size: 16px;
}

/* 警告框樣式 */
:deep(.n-alert) {
  margin: 16px 0;
}

:deep(.n-alert .n-alert-body) {
  line-height: 1.6;
}

:deep(.n-alert code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}
</style>
