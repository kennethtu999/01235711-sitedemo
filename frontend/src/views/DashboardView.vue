<template>
  <div class="dashboard-container">
    <n-layout>
      <n-layout-header class="dashboard-header">
        <n-space justify="space-between" align="center">
          <n-h1 style="margin: 0">靜態網站 Demo 管理平台</n-h1>
          <n-space align="center">
            <n-text>歡迎，{{ user?.username || '使用者' }}</n-text>
            <n-button type="error" @click="handleLogout">登出</n-button>
          </n-space>
        </n-space>
      </n-layout-header>
      
      <n-layout-content class="dashboard-main">
        <n-space vertical size="large">
          <n-card>
            <template #header>
              <n-h2 style="margin: 0; text-align: center">歡迎使用 Demo 管理平台</n-h2>
            </template>
            <n-p style="text-align: center; margin: 0">
              這是階段一的基礎架構展示。後續階段將實現完整的管理功能。
            </n-p>
          </n-card>
          
          <n-grid :cols="4" :x-gap="20" :y-gap="20" responsive="screen">
            <n-grid-item>
              <n-card hoverable>
                <template #header>
                  <n-h3 style="margin: 0">使用者管理</n-h3>
                </template>
                <n-p style="margin-bottom: 16px">管理系統使用者帳號和權限</n-p>
                <n-button type="primary" block @click="navigateToUserManagement">
                  進入管理
                </n-button>
              </n-card>
            </n-grid-item>
            
            <n-grid-item>
              <n-card hoverable>
                <template #header>
                  <n-h3 style="margin: 0">專案管理</n-h3>
                </template>
                <n-p style="margin-bottom: 16px">管理 GitHub 專案和 Demo 配置</n-p>
                <n-button type="primary" block @click="navigateToProjectManagement">
                  進入管理
                </n-button>
              </n-card>
            </n-grid-item>
            
            <n-grid-item>
              <n-card hoverable>
                <template #header>
                  <n-h3 style="margin: 0">Demo 部署</n-h3>
                </template>
                <n-p style="margin-bottom: 16px">自動部署靜態網站 Demo</n-p>
                <n-button block disabled>即將推出</n-button>
              </n-card>
            </n-grid-item>
            
            <n-grid-item>
              <n-card hoverable>
                <template #header>
                  <n-h3 style="margin: 0">兩步驟驗證</n-h3>
                </template>
                <n-p style="margin-bottom: 16px">Google OTP 安全驗證</n-p>
                <n-button block disabled>即將推出</n-button>
              </n-card>
            </n-grid-item>
          </n-grid>
          
          <n-card>
            <template #header>
              <n-h3 style="margin: 0">系統狀態</n-h3>
            </template>
            <n-space vertical>
              <n-descriptions :column="1" bordered>
                <n-descriptions-item label="後端狀態">
                  <n-tag :type="backendStatus ? 'success' : 'error'">
                    {{ backendStatus ? '正常' : '離線' }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="API 版本">
                  {{ apiVersion || '未知' }}
                </n-descriptions-item>
                <n-descriptions-item label="最後檢查">
                  {{ lastCheckTime || '未檢查' }}
                </n-descriptions-item>
              </n-descriptions>
              <n-button 
                type="primary" 
                block 
                :loading="isCheckingStatus"
                @click="checkBackendStatus"
              >
                {{ isCheckingStatus ? '檢查中...' : '檢查後端狀態' }}
              </n-button>
            </n-space>
          </n-card>
        </n-space>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NLayout, 
  NLayoutHeader, 
  NLayoutContent, 
  NSpace, 
  NH1, 
  NH2, 
  NH3, 
  NText, 
  NButton, 
  NCard, 
  NP, 
  NGrid, 
  NGridItem, 
  NDescriptions, 
  NDescriptionsItem, 
  NTag 
} from 'naive-ui'
import { apiService, type User } from '@/api'

const router = useRouter()

// 狀態管理
const user = ref<User | null>(null)
const backendStatus = ref(false)
const apiVersion = ref('')
const lastCheckTime = ref('')
const isCheckingStatus = ref(false)

// 組件掛載時檢查用戶登入狀態
onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
  } else {
    // 如果沒有用戶信息，重定向到登入頁
    router.push('/login')
  }
  
  // 自動檢查後端狀態
  checkBackendStatus()
})

// 檢查後端狀態
const checkBackendStatus = async () => {
  isCheckingStatus.value = true
  
  try {
    const response = await apiService.getStatus()
    backendStatus.value = true
    apiVersion.value = response.data.version || '1.0.0'
    lastCheckTime.value = new Date().toLocaleString('zh-TW')
  } catch (error) {
    console.error('後端狀態檢查失敗:', error)
    backendStatus.value = false
    apiVersion.value = ''
    lastCheckTime.value = new Date().toLocaleString('zh-TW')
  } finally {
    isCheckingStatus.value = false
  }
}

// 處理登出
const handleLogout = async () => {
  try {
    // 調用後端登出 API
    await apiService.logout()
  } catch (error) {
    console.error('登出 API 調用失敗:', error)
    // 即使 API 調用失敗，也要清除本地存儲
  } finally {
    // 清除本地存儲
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 重定向到登入頁
    router.push('/login')
  }
}

// 導航到使用者管理頁面
const navigateToUserManagement = () => {
  router.push('/admin/users')
}

// 導航到專案管理頁面
const navigateToProjectManagement = () => {
  router.push('/admin/projects')
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
}

.dashboard-header {
  padding: 16px 20px;
}

.dashboard-main {
  padding: 24px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 16px;
  }
  
  .dashboard-main {
    padding: 20px 16px;
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: 12px;
  }
  
  .dashboard-main {
    padding: 16px 12px;
  }
}

@media (max-width: 360px) {
  .dashboard-main {
    padding: 12px 8px;
  }
}

/* 大螢幕優化 */
@media (min-width: 1200px) {
  .dashboard-main {
    padding: 48px 40px;
    max-width: 1400px;
  }
  
  .dashboard-header {
    padding: 24px 48px;
  }
}

@media (min-width: 1440px) {
  .dashboard-main {
    max-width: 1600px;
    padding: 56px 60px;
  }
  
  .dashboard-header {
    padding: 32px 60px;
  }
}

@media (min-width: 1920px) {
  .dashboard-main {
    max-width: 1800px;
    padding: 64px 80px;
  }
  
  .dashboard-header {
    padding: 40px 80px;
  }
}
</style>

