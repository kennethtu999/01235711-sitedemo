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
            <n-popover v-if="viewMode === 'grid'" v-model:show="showSortMenu" trigger="click" placement="bottom-end" :show-arrow="false" raw>
              <template #trigger>
                <button class="btn btn-sm btn-outline btn-circle" title="排序">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m3 16 4 4 4-4" />
                    <path d="M7 20V4" />
                    <path d="m21 8-4-4-4 4" />
                    <path d="M17 4v16" />
                  </svg>
                </button>
              </template>
              <ul class="sort-menu">
                <li
                  v-for="option in sortOptions"
                  :key="`${option.key}-${option.order}`"
                  :class="['sort-menu-item', { 'is-active': sortKey === option.key && sortOrder === option.order }]"
                  @click="selectSort(option.key, option.order)"
                >
                  {{ option.label }}
                </li>
              </ul>
            </n-popover>
            <div :class="['view-switch', `is-${viewMode}`]" role="radiogroup" aria-label="視圖模式">
              <span class="view-switch-thumb" aria-hidden="true"></span>
              <button
                :class="['view-switch-option', { 'is-active': viewMode === 'grid' }]"
                role="radio"
                :aria-checked="viewMode === 'grid'"
                aria-label="網格視圖"
                @click="viewMode = 'grid'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              </button>
              <button
                :class="['view-switch-option', { 'is-active': viewMode === 'list' }]"
                role="radio"
                :aria-checked="viewMode === 'list'"
                aria-label="列表視圖"
                @click="viewMode = 'list'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
          <div v-for="project in sortedProjects" :key="project.id" class="project-card">
            <div class="project-header">
              <div>
                <h3 class="project-title">{{ project.name }}</h3>
                <div v-if="project.description" class="project-description">
                  {{ project.description }}
                </div>
                <div class="project-last-sync"> 最後部署時間：{{ getLatestDeploymentTime(project) }} </div>
              </div>
              <span v-if="!project.isActive" class="status-badge inactive">停用</span>
            </div>

            <div v-if="project.demoConfigs && project.demoConfigs.length > 0" class="demo-configs">
              <div v-for="demo in project.demoConfigs" :key="demo.id" class="demo-config-item">
                <div class="demo-config-info">
                  <span class="demo-branch">
                    分支: {{ demo.branchName || (demo as any).dataValues?.branchName || '未定義' }}
                  </span>
                </div>

                <div class="action-buttons-wrapper">
                <div :ref="(el) => setActionButtonsRef(el, `grid-${demo.id}`)" :class="['action-buttons', { 'is-expanded': expandedActionButtons.has(`grid-${demo.id}`) }]">
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
                <button v-if="overflowingActionButtons.has(`grid-${demo.id}`) && !expandedActionButtons.has(`grid-${demo.id}`)" class="show-more" @click="expandActionButtons(`grid-${demo.id}`)">
                  顯示全部
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
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
                <th width="200" class="sortable" @click="toggleSort('name')">
                  專案名稱
                  <svg :class="['sort-icon', sortKey === 'name' ? `is-${sortOrder}` : '']" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-9 0 32 32" fill="currentColor" aria-hidden="true">
                    <path class="sort-asc" d="M0.281 13.063l5.969-7.438c0.531-0.688 1.406-0.688 1.938 0l5.969 7.438c0.531 0.688 0.281 1.25-0.625 1.25h-12.625c-0.906 0-1.156-0.563-0.625-1.25z" />
                    <path class="sort-desc" d="M14.156 18.938l-5.969 7.438c-0.531 0.688-1.406 0.688-1.938 0l-5.969-7.438c-0.531-0.688-0.281-1.25 0.625-1.25h12.625c0.906 0 1.156 0.563 0.625 1.25z" />
                  </svg>
                </th>
                <th width="240">說明</th>
                <th width="200" class="sortable" @click="toggleSort('lastDeploymentTime')">
                  最後部署時間
                  <svg :class="['sort-icon', sortKey === 'lastDeploymentTime' ? `is-${sortOrder}` : '']" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-9 0 32 32" fill="currentColor" aria-hidden="true">
                    <path class="sort-asc" d="M0.281 13.063l5.969-7.438c0.531-0.688 1.406-0.688 1.938 0l5.969 7.438c0.531 0.688 0.281 1.25-0.625 1.25h-12.625c-0.906 0-1.156-0.563-0.625-1.25z" />
                    <path class="sort-desc" d="M14.156 18.938l-5.969 7.438c-0.531 0.688-1.406 0.688-1.938 0l-5.969-7.438c-0.531-0.688-0.281-1.25 0.625-1.25h12.625c0.906 0 1.156 0.563 0.625 1.25z" />
                  </svg>
                </th>
                <th width="140">分支</th>
                <th width="460">檢視</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="project in sortedProjects" :key="project.id">
                <tr v-if="!project.demoConfigs || project.demoConfigs.length === 0">
                  <td>
                    <span class="project-title">{{ project.name }}</span>
                    <div v-if="!project.isActive" class="project-status"><span class="status-badge inactive">停用</span></div>
                  </td>
                  <td>
                    {{ project.description || '-' }}
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
                    <div v-if="!project.isActive" class="project-status"><span class="status-badge inactive">停用</span></div>
                  </td>
                  <td v-if="index === 0" :rowspan="project.demoConfigs?.length || 1">
                    {{ project.description || '-' }}
                  </td>
                  <td v-if="index === 0" :rowspan="project.demoConfigs?.length || 1">
                    {{ getLatestDeploymentTime(project) }}
                  </td>
                  <td>{{ demo.branchName || (demo as any).dataValues?.branchName || '未定義' }}</td>
                  <td>
                    <div class="action-buttons-wrapper">
                    <div :ref="(el) => setActionButtonsRef(el, `list-${demo.id}`)" :class="['action-buttons', { 'is-expanded': expandedActionButtons.has(`list-${demo.id}`) }]">
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
                    <button v-if="overflowingActionButtons.has(`list-${demo.id}`) && !expandedActionButtons.has(`list-${demo.id}`)" class="show-more" @click="expandActionButtons(`list-${demo.id}`)">
                      顯示全部
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
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
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
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
const expandedActionButtons = ref(new Set<string>())
const overflowingActionButtons = ref(new Set<string>())
const actionButtonsElements = new Map<string, HTMLElement>()
let actionButtonsResizeObserver: ResizeObserver | undefined

const updateActionButtonsOverflow = () => {
  const overflowing = new Set<string>()
  actionButtonsElements.forEach((element, key) => {
    if (element.scrollHeight > element.clientHeight + 1) overflowing.add(key)
  })
  overflowingActionButtons.value = overflowing
}

const setActionButtonsRef = (element: unknown, key: string) => {
  if (!(element instanceof HTMLElement)) return
  if (actionButtonsElements.get(key) === element) return
  actionButtonsElements.set(key, element)
  actionButtonsResizeObserver?.observe(element)
  nextTick(updateActionButtonsOverflow)
}

const expandActionButtons = (key: string) => {
  expandedActionButtons.value = new Set(expandedActionButtons.value).add(key)
}

watch([userProjects, viewMode], async () => {
  await nextTick()
  updateActionButtonsOverflow()
})

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

// 排序設定（專案名稱 / 最後部署時間，同時僅一個欄位排序）
type SortKey = 'name' | 'lastDeploymentTime'
type SortOrder = 'asc' | 'desc'
const SORT_STORAGE_KEY = 'dashboard-sort'
const sortKey = ref<SortKey>('name')
const sortOrder = ref<SortOrder>('asc')

const initSort = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SORT_STORAGE_KEY) || 'null')
    if ((saved?.key === 'name' || saved?.key === 'lastDeploymentTime') && (saved?.order === 'asc' || saved?.order === 'desc')) {
      sortKey.value = saved.key
      sortOrder.value = saved.order
    }
  } catch {
    // 忽略無效的儲存值
  }
}

const showSortMenu = ref(false)
const sortOptions: { key: SortKey; order: SortOrder; label: string }[] = [
  { key: 'name', order: 'asc', label: '專案名稱（A-Z）' },
  { key: 'name', order: 'desc', label: '專案名稱（Z-A）' },
  { key: 'lastDeploymentTime', order: 'asc', label: '最後部署時間（舊到新）' },
  { key: 'lastDeploymentTime', order: 'desc', label: '最後部署時間（新到舊）' },
]

const saveSort = () => {
  localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ key: sortKey.value, order: sortOrder.value }))
}

// 網格視圖排序選單
const selectSort = (key: SortKey, order: SortOrder) => {
  sortKey.value = key
  sortOrder.value = order
  saveSort()
  showSortMenu.value = false
}

// 點擊同欄位切換升冪/降冪，點擊其他欄位則改為該欄位升冪
const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  saveSort()
}

// 取得專案最新部署時間戳記，無部署紀錄回傳 null
const getLatestDeploymentTimestamp = (project: Project) => {
  const times = (project.demoConfigs || [])
    .map((d) => d.lastDeploymentTime)
    .filter(Boolean)
    .map((t) => new Date(t).getTime())
  return times.length ? Math.max(...times) : null
}

const sortedProjects = computed(() => {
  const direction = sortOrder.value === 'asc' ? 1 : -1
  return [...userProjects.value].sort((a, b) => {
    if (sortKey.value === 'name') {
      return a.name.localeCompare(b.name, 'zh-Hant', { sensitivity: 'base', numeric: true }) * direction
    }
    const timeA = getLatestDeploymentTimestamp(a)
    const timeB = getLatestDeploymentTimestamp(b)
    // 無部署紀錄的專案固定排在最後
    if (timeA === null || timeB === null) return timeA === timeB ? 0 : timeA === null ? 1 : -1
    return (timeA - timeB) * direction
  })
})

// 組件掛載時檢查用戶登入狀態
onMounted(() => {
  actionButtonsResizeObserver = new ResizeObserver(updateActionButtonsOverflow)
  actionButtonsElements.forEach((element) => actionButtonsResizeObserver?.observe(element))
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    // 如果沒有用戶信息，重定向到登入頁
    router.push('/login')
    return
  }

  // 初始化視圖模式
  initViewMode()
  initSort()

  // 自動檢查後端狀態
  checkBackendStatus()

  // 載入用戶專案
  loadUserProjects()
})

onBeforeUnmount(() => actionButtonsResizeObserver?.disconnect())

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
  const maxTime = getLatestDeploymentTimestamp(project)
  if (maxTime === null) return '-'
  return formatDateTime(new Date(maxTime).toISOString())
}
</script>
