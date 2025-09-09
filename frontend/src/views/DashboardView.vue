<template>
  <div class="dashboard-container">
    <n-layout>
      <n-layout-header class="dashboard-header">
        <n-h1 style="margin: 0">儀表板</n-h1>
      </n-layout-header>
      
      <n-layout-content class="dashboard-main">
        <n-space vertical size="large">
          <n-card>
            <template #header>
              <n-h2 style="margin: 0; text-align: center">我的專案</n-h2>
            </template>
            <n-p style="text-align: center; margin: 0">
              您有權限訪問的專案列表
            </n-p>
          </n-card>

          <n-card>
            <template #header>
              <n-h3 style="margin: 0">可訪問的專案</n-h3>
            </template>
            <n-space vertical>
              <div v-if="userProjects.length === 0 && !isLoadingProjects">
                <n-empty description="暫無可訪問的專案" />
              </div>
              
              <div v-else>
                <n-grid :cols="2" :x-gap="20" :y-gap="20" responsive="screen">
                  <n-grid-item v-for="project in userProjects" :key="project.id">
                    <n-card hoverable>
                      <n-space justify="space-between" align="center">
                        <n-h4 style="margin: 0">{{ project.name }}</n-h4>
                      </n-space>
                      
                      <n-space vertical size="small">
                        <n-text depth="3">{{ project.description }}</n-text>
                        <!-- Demo 配置列表 -->
                        <div v-if="project.demoConfigs && project.demoConfigs.length > 0" style="margin-top: 12px;">
                          <n-divider style="margin: 8px 0;" />
                          <n-space vertical size="small">
                            <div v-for="demo in project.demoConfigs" :key="demo.id" style="padding: 8px; border: 1px solid var(--n-border-color); border-radius: 6px;">
                              <n-space justify="space-between" align="center">
                                <n-space vertical size="small">
                                  <n-text depth="3" style="font-size: 12px;">
                                    分支: {{ demo.branchName }} | 路徑: {{ demo.demoPath }}
                                  </n-text>
                                </n-space>
                                
                                <n-space vertical size="small" align="end">
                                  
                                  <n-space v-if="demo.demoUrls && demo.demoUrls.length > 0" vertical size="small">
                                    <n-space size="small" wrap>
                                        <n-button 
                                      type="info" 
                                      size="small" 
                                      :disabled="!demo.demoUrl"
                                      @click="demo.demoUrl && openDemo(demo.demoUrl)"
                                    >
                                      開啟主要 Demo
                                    </n-button>
                                      
                                      <n-button 
                                        v-for="subSite in demo.demoUrls" 
                                        :key="subSite.name"
                                        type="info" 
                                        size="small" 
                                        @click="openDemo(subSite.url)"
                                      >
                                        {{ subSite.name }}
                                      </n-button>
                                    </n-space>
                                  </n-space>
                                </n-space>
                              </n-space>
                            </div>
                          </n-space>
                        </div>
                      </n-space>
                    </n-card>
                  </n-grid-item>
                </n-grid>
              </div>
            </n-space>
          </n-card>
        </n-space>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { apiService, type Project } from '@/api'
import {
  NButton,
  NCard,
  NDivider,
  NEmpty,
  NGrid,
  NGridItem,
  NH1,
  NH2,
  NH3,
  NH4,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NP,
  NSpace,
  NText
} from 'naive-ui'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 狀態管理
const backendStatus = ref(false)
const apiVersion = ref('')
const lastCheckTime = ref('')
const isCheckingStatus = ref(false)
const userProjects = ref<Project[]>([])
const isLoadingProjects = ref(false)

// 組件掛載時檢查用戶登入狀態
onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    // 如果沒有用戶信息，重定向到登入頁
    router.push('/login')
    return
  }
  
  // 自動檢查後端狀態
  checkBackendStatus()
  
  // 載入用戶專案
  loadUserProjects()
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



// 載入用戶專案資料
const loadUserProjects = async () => {
  isLoadingProjects.value = true
  try {
    const response = await apiService.getUserProjects()
    userProjects.value = response.data.data || []
  } catch (error) {
    console.error('載入專案資料失敗:', error)
    userProjects.value = []
  } finally {
    isLoadingProjects.value = false
  }
}

// 開啟 Demo 網站
const openDemo = (demoUrl: string) => {
  const fullUrl = `${window.location.origin}${demoUrl}`
  window.open(fullUrl, '_blank', 'noopener,noreferrer')
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

