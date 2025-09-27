<template>
  <div class="dashboard-container">
    <n-layout>
      <n-layout-header class="dashboard-header">
        <h1 class="page-title">儀表板</h1>
      </n-layout-header>
      
      <n-layout-content class="dashboard-main page-container">
        <n-space vertical size="large">
          <n-card>
            <template #header>
              <h2 class="page-title text-center">我的專案</h2>
            </template>
            <p class="text-center text-secondary">
              您有權限訪問的專案列表
            </p>
          </n-card>

          <n-card>
            <template #header>
              <h3 class="page-title">可訪問的專案</h3>
            </template>
            <n-space vertical>
              <div v-if="userProjects.length === 0 && !isLoadingProjects">
                <n-empty description="暫無可訪問的專案" />
              </div>
              
              <div v-else>
                <n-grid 
                  :cols="2" 
                  :x-gap="20" 
                  :y-gap="20" 
                  responsive="screen"
                  :collapsed-rows="1"
                  :item-responsive="true"
                >
                  <n-grid-item 
                    v-for="project in userProjects" 
                    :key="project.id"
                    :span="1"
                    :s-span="1"
                    :m-span="1"
                    :l-span="1"
                    :xl-span="1"
                    :xxl-span="1"
                  >
                    <n-card hoverable class="project-card">
                      <div class="project-header">
                        <h3 class="project-title">{{ project.name }}</h3>
                        <div class="project-status">
                          <span :class="['status-badge', project.isActive ? 'active' : 'inactive']">
                            {{ project.isActive ? '啟用' : '停用' }}
                          </span>
                        </div>
                      </div>
                      
                        <!-- Demo 配置列表 -->
                        <div v-if="project.demoConfigs && project.demoConfigs.length > 0" style="margin-top: 12px;">
                          <n-space vertical size="small">
                            <div v-for="demo in project.demoConfigs" :key="demo.id" class="">
                              <div class="demo-config-content">
                                <div class="demo-config-info">
                                  <div class="demo-config-details">
                                    <span class="demo-branch">分支: {{ demo.branchName || (demo as any).dataValues?.branchName || '未定義' }}</span>
                                  </div>
                                
                                  <div class="demo-config-actions">
                                    <div class="demo-buttons">
                                      <!-- 只有當沒有子網站時才顯示主要 Demo -->
                                      <button 
                                          v-if="demo.demoUrl && (!demo.demoUrls || demo.demoUrls.length === 0)"
                                          @click="demo.demoUrl && openDemo(demo.demoUrl)"
                                          class="btn btn-sm btn-outline demo-action-button"
                                        >
                                          開啟主要 Demo
                                      </button>
                                      
                                      <button 
                                        v-for="subSite in demo.demoUrls" 
                                        :key="subSite.name"
                                        @click="openDemo(subSite.url)"
                                        class="btn btn-sm btn-outline demo-action-button subsite-button"
                                      >
                                        {{ subSite.name }}
                                      </button>
                                    </div>
                                  </div>
                                  
                                </div>
                                
                                
                              </div>
                            </div>
                          </n-space>
                        </div>
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
  NCard,
  NEmpty,
  NGrid,
  NGridItem,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NSpace
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
  /* 確保在移動設備上正確顯示 */
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

.dashboard-header {
  padding: var(--spacing-page-sm);
  border-bottom: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-primary);
}

.dashboard-main {
  padding: var(--spacing-page-md);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .dashboard-header {
    padding: var(--spacing-md);
  }
  
  .dashboard-main {
    padding: var(--spacing-page-sm);
  }
  
  /* 移動端網格布局 - 確保一列顯示 */
  .n-grid {
    grid-template-columns: 1fr !important;
  }
  
  /* 移動端專案卡片 */
  .project-card {
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-md);
  }
  
  .project-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .project-title {
    font-size: var(--font-size-md);
    line-height: var(--line-height-tight);
  }
  
  .project-description {
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: var(--spacing-sm);
  }
  
  .dashboard-main {
    padding: var(--spacing-sm);
  }
  
  /* 小螢幕優化 */
  .page-title {
    font-size: var(--font-size-xl);
  }
  
  .project-title {
    font-size: var(--font-size-sm);
  }
  
  .project-description {
    font-size: var(--font-size-xs);
  }
}

/* iPhone 和移動設備特定優化 */
@media (max-width: 414px) {
  .dashboard-container {
    /* 防止水平滾動 */
    overflow-x: hidden;
  }
  
  .dashboard-main {
    padding: var(--spacing-xs);
  }
  
  .dashboard-header {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .page-title {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-sm);
  }
  
  .project-card {
    margin-bottom: var(--spacing-sm);
  }
  
  .project-header {
    margin-bottom: var(--spacing-sm);
    padding-bottom: var(--spacing-sm);
  }
  
  .project-title {
    font-size: var(--font-size-sm);
    line-height: 1.3;
  }
  
  .status-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .demo-config-card {
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
  }
  
  .demo-action-button {
    min-height: 56px;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    padding: var(--spacing-lg) var(--spacing-xl);
    border-radius: var(--radius-lg);
    width: 100%;
    margin-bottom: var(--spacing-sm);
  }
}

/* 專案卡片樣式 */
.project-card {
  height: 100%;
  transition: all var(--transition-normal);
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-primary);
}

.project-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.project-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-badge.active {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.status-badge.inactive {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

.project-content {
  flex: 1;
}

.project-description {
  margin: 0 0 16px 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

/* Demo 配置卡片樣式 */
.demo-config-card {
  padding: 16px;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-primary);
  transition: all var(--transition-fast);
  margin-bottom: 12px;
}

.demo-config-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.demo-config-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.demo-config-info {
  flex: 1;
  min-width: 0;
}

.demo-config-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.demo-branch,
.demo-path {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}

.demo-branch {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.demo-path {
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  display: inline-block;
}

.demo-config-actions {
  flex-shrink: 0;
}

.demo-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.demo-action-button {
  white-space: nowrap;
  min-width: auto;
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.demo-action-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.subsite-button {
  flex-shrink: 0;
  min-width: fit-content;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .demo-config-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .demo-config-actions {
    width: 100%;
  }
  
  .demo-buttons {
    width: 100%;
    justify-content: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    padding-bottom: 4px;
  }
  
  .demo-action-button {
    min-height: 48px; /* 確保觸控目標足夠大 */
    font-size: var(--font-size-md);
    padding: var(--spacing-md) var(--spacing-lg);
    width: auto;
    flex-shrink: 0;
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-medium);
  }
  
  .demo-config-card {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
    border-radius: var(--radius-lg);
  }
  
  .demo-config-details {
    gap: var(--spacing-xs);
  }
  
  .demo-branch,
  .demo-path {
    font-size: var(--font-size-xs);
    word-break: break-all;
  }
  
  .demo-path {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }
}

@media (max-width: 480px) {
  .demo-config-card {
    padding: var(--spacing-sm);
  }
  
  .demo-action-button {
    min-height: 52px; /* 更大的觸控目標 */
    font-size: var(--font-size-lg);
    padding: var(--spacing-lg) var(--spacing-xl);
    border-radius: var(--radius-lg);
    font-weight: var(--font-weight-semibold);
  }
  
  .demo-branch,
  .demo-path {
    font-size: var(--font-size-xs);
  }
}

/* 桌面版優化 */
@media (min-width: 769px) {
  /* 桌面版網格布局 - 顯示兩列 */
  .n-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

/* 大螢幕優化 */
@media (min-width: 1024px) {
  .dashboard-main {
    padding: var(--spacing-page-lg);
  }
  
  .dashboard-header {
    padding: var(--spacing-page-md);
  }
}

@media (min-width: 1440px) {
  .dashboard-main {
    padding: var(--spacing-page-xl);
  }
  
  .dashboard-header {
    padding: var(--spacing-page-lg);
  }
}
</style>


