<template>
  <div class="inner-wrapper">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>儀表板</h1>
        </div>
      </div>
    </header>

    <main class="page-main">
      <!-- 專案列表區塊 -->
      <div class="panel">
        <div class="panel-header">
          <h2>可訪問的專案</h2>
          <div class="view-mode-toggle">
            <button
              @click="viewMode = 'grid'"
              :class="['btn', 'btn-sm', viewMode === 'grid' ? 'btn-primary' : 'btn-outline']"
              title="網格視圖"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-x-square"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
            <button
              @click="viewMode = 'list'"
              :class="['btn', 'btn-sm', viewMode === 'list' ? 'btn-primary' : 'btn-outline']"
              title="列表視圖"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-list"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="isLoadingProjects" class="loading-state">
          <div class="loading-spinner"></div>
          <p>載入專案資料中...</p>
        </div>

        <div v-else-if="userProjects.length === 0" class="empty-state">
          <p>暫無可訪問的專案</p>
        </div>

        <!-- 網格視圖 -->
        <div v-else-if="viewMode === 'grid'" class="projects-grid">
          <div v-for="project in userProjects" :key="project.id" class="project-card">
            <div class="project-header">
              <div>
                <h3 class="project-title">{{ project.name }}</h3>
                <div v-if="project.description" class="project-description">
                  {{ project.description }}
                </div>
                <div class="project-last-sync"> 最後部署時間：{{ getLatestDeploymentTime(project) }} </div>
              </div>
              <span :class="['status-badge', project.isActive ? 'active' : 'inactive']">
                {{ project.isActive ? '啟用' : '停用' }}
              </span>
            </div>

            <div v-if="project.demoConfigs && project.demoConfigs.length > 0" class="demo-configs">
              <div v-for="demo in project.demoConfigs" :key="demo.id" class="demo-config-item">
                <div class="demo-config-info">
                  <span class="demo-branch">
                    分支: {{ demo.branchName || (demo as any).dataValues?.branchName || '未定義' }}
                  </span>
                </div>

                <div class="action-buttons">
                  <button
                    v-if="demo.demoUrl && (!demo.demoUrls || demo.demoUrls.length === 0)"
                    @click="demo.demoUrl && openDemo(demo.demoUrl)"
                    class="btn btn-md btn-outline"
                  >
                    開啟主要 Demo
                  </button>

                  <button
                    v-for="subSite in demo.demoUrls"
                    :key="subSite.name"
                    @click="openDemo(subSite.url)"
                    class="btn btn-md btn-outline"
                  >
                    {{ subSite.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 列表視圖 -->
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>專案名稱</th>
                <th>說明</th>
                <th width="80">狀態</th>
                <th>最後部署時間</th>
                <th>分支</th>
                <th width="400">檢視</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="project in userProjects" :key="project.id">
                <tr v-if="!project.demoConfigs || project.demoConfigs.length === 0">
                  <td>
                    <span class="project-title">{{ project.name }}</span>
                  </td>
                  <td>
                    {{ project.description || '-' }}
                  </td>
                  <td>
                    <span :class="['status-badge', project.isActive ? 'active' : 'inactive']">
                      {{ project.isActive ? '啟用' : '停用' }}
                    </span>
                  </td>
                  <td>
                    {{ getLatestDeploymentTime(project) }}
                  </td>
                  <td>-</td>
                  <td>-</td>
                </tr>

                <tr v-for="(demo, index) in project.demoConfigs" :key="`${project.id}-${demo.id}`">
                  <td v-if="index === 0" :rowspan="project.demoConfigs?.length || 1">
                    <span class="project-title">{{ project.name }}</span>
                  </td>
                  <td v-if="index === 0" :rowspan="project.demoConfigs?.length || 1">
                    {{ project.description || '-' }}
                  </td>
                  <td v-if="index === 0" :rowspan="project.demoConfigs?.length || 1">
                    <span :class="['status-badge', project.isActive ? 'active' : 'inactive']">
                      {{ project.isActive ? '啟用' : '停用' }}
                    </span>
                  </td>
                  <td v-if="index === 0" :rowspan="project.demoConfigs?.length || 1">
                    {{ getLatestDeploymentTime(project) }}
                  </td>
                  <td>{{ demo.branchName || (demo as any).dataValues?.branchName || '未定義' }}</td>
                  <td>
                    <div class="action-buttons">
                      <button
                        v-if="demo.demoUrl && (!demo.demoUrls || demo.demoUrls.length === 0)"
                        @click="demo.demoUrl && openDemo(demo.demoUrl)"
                        class="btn btn-sm btn-outline"
                      >
                        開啟主要 Demo
                      </button>

                      <button
                        v-for="subSite in demo.demoUrls"
                        :key="subSite.name"
                        @click="openDemo(subSite.url)"
                        class="btn btn-sm btn-outline"
                      >
                        {{ subSite.name }}
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { apiService, type Project } from '@/api'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 狀態管理
const backendStatus = ref(false)
const apiVersion = ref('')
const lastCheckTime = ref('')
const isCheckingStatus = ref(false)
const userProjects = ref<Project[]>([])
const isLoadingProjects = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')

// 從 localStorage 初始化視圖模式
const initViewMode = () => {
  const savedViewMode = localStorage.getItem('dashboard-view-mode')
  if (savedViewMode === 'grid' || savedViewMode === 'list') {
    viewMode.value = savedViewMode
  }
}

// 監聽視圖模式變化並保存到 localStorage
watch(viewMode, (newViewMode) => {
  localStorage.setItem('dashboard-view-mode', newViewMode)
})

// 組件掛載時檢查用戶登入狀態
onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    // 如果沒有用戶信息，重定向到登入頁
    router.push('/login')
    return
  }

  // 初始化視圖模式
  initViewMode()

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

// 格式化日期時間
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-TW')
}

// 取得專案最新部署時間
const getLatestDeploymentTime = (project: Project) => {
  if (!project.demoConfigs || project.demoConfigs.length === 0) return '-'
  const times = project.demoConfigs
    .map((d) => d.lastDeploymentTime)
    .filter(Boolean)
    .map((t) => new Date(t).getTime())
  if (!times.length) return '-'
  const maxTime = Math.max(...times)
  return formatDateTime(new Date(maxTime).toISOString())
}
</script>
