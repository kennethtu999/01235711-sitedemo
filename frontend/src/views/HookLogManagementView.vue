<template>
  <div class="hook-log-management">
    <n-card title="Hook Log 管理" class="mb-4">
      <template #header-extra>
        <n-space>
          <n-button @click="refreshData" :loading="loading">
            <template #icon>
              <n-icon>
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </n-icon>
            </template>
            刷新
          </n-button>
        </n-space>
      </template>

      <!-- 統計卡片 -->
      <n-grid :cols="4" :x-gap="16" class="mb-4">
        <n-grid-item>
          <n-statistic label="總計" :value="stats.total" />
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="成功" :value="stats.success" class="text-green-600" />
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="失敗" :value="stats.failed" class="text-red-600" />
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="成功率" :value="`${stats.successRate}%`" />
        </n-grid-item>
      </n-grid>

      <!-- 篩選器 -->
      <n-space class="mb-4">
        <n-select
          v-model:value="filters.status"
          placeholder="選擇狀態"
          clearable
          :options="statusOptions"
          style="width: 120px"
        />
        <n-select
          v-model:value="filters.projectId"
          placeholder="選擇專案"
          clearable
          :options="projectOptions"
          style="width: 200px"
        />
        <n-button @click="applyFilters" type="primary">篩選</n-button>
        <n-button @click="clearFilters">清除</n-button>
      </n-space>

      <!-- Hook Log 表格 -->
      <n-data-table
        :columns="columns"
        :data="hookLogs"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        :row-key="(row) => row.id"
        :max-height="600"
      />
    </n-card>

    <!-- Hook Log 詳情模態框 -->
    <n-modal v-model:show="showDetailModal" preset="card" title="Hook Log 詳情" style="width: 80%; max-width: 1000px">
      <div v-if="selectedHookLog" class="hook-log-detail">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="ID">{{ selectedHookLog.id }}</n-descriptions-item>
          <n-descriptions-item label="專案名稱">{{ selectedHookLog.projectName }}</n-descriptions-item>
          <n-descriptions-item label="倉庫名稱">{{ selectedHookLog.githubRepoName }}</n-descriptions-item>
          <n-descriptions-item label="分支">{{ selectedHookLog.branch }}</n-descriptions-item>
          <n-descriptions-item label="狀態">
            <n-tag :type="getStatusType(selectedHookLog.status)">
              {{ getStatusText(selectedHookLog.status) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="事件類型">{{ selectedHookLog.webhookEventType || 'N/A' }}</n-descriptions-item>
          <n-descriptions-item label="開始時間">{{ formatDateTime(selectedHookLog.startDateTime) }}</n-descriptions-item>
          <n-descriptions-item label="結束時間">{{ selectedHookLog.endDateTime ? formatDateTime(selectedHookLog.endDateTime) : '-' }}</n-descriptions-item>
          <n-descriptions-item label="處理時間">
            {{ selectedHookLog.processingTimeMs ? `${selectedHookLog.processingTimeMs}ms` : 'N/A' }}
          </n-descriptions-item>
          <n-descriptions-item label="錯誤訊息" v-if="selectedHookLog.errorMessage">
            <n-text type="error">{{ selectedHookLog.errorMessage }}</n-text>
          </n-descriptions-item>
        </n-descriptions>

        <!-- 部署結果 -->
        <div v-if="selectedHookLog.deploymentResults" class="mt-4">
          <n-divider>部署結果</n-divider>
          <n-code :code="JSON.stringify(selectedHookLog.deploymentResults, null, 2)" language="json" />
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { NCard, NButton, NSpace, NGrid, NGridItem, NStatistic, NSelect, NDataTable, NModal, NDescriptions, NDescriptionsItem, NTag, NText, NDivider, NCode, NIcon, useMessage } from 'naive-ui'
// import { Refresh } from '@vicons/ionicons5'
import { apiService, type HookLog, type HookLogStats, type Project } from '@/api'

// 響應式數據
const loading = ref(false)
const hookLogs = ref<HookLog[]>([])
const stats = ref<HookLogStats>({
  total: 0,
  success: 0,
  failed: 0,
  pending: 0,
  successRate: '0',
  avgProcessingTimeMs: 0,
  period: '7 days'
})
const projects = ref<Project[]>([])
const showDetailModal = ref(false)
const selectedHookLog = ref<HookLog | null>(null)

// 篩選器
const filters = reactive({
  status: '' as string,
  projectId: '' as string,
})

// 分頁
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

// 狀態選項
const statusOptions = [
  { label: '全部', value: '', type: 'ignored' as const },
  { label: '成功', value: 'success' },
  { label: '失敗', value: 'failed' },
  { label: '處理中', value: 'pending' },
]

// 專案選項
const projectOptions = computed(() => [
  { label: '全部', value: '', type: 'ignored' as const },
  ...projects.value.map(project => ({
    label: project.name,
    value: project.id
  }))
])

const message = useMessage()

// 表格列定義
const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    sorter: true,
  },
  {
    title: '專案名稱',
    key: 'projectName',
    width: 150,
    ellipsis: true,
  },
  {
    title: '倉庫名稱',
    key: 'githubRepoName',
    width: 200,
    ellipsis: true,
  },
  {
    title: '分支',
    key: 'branch',
    width: 120,
  },
  {
    title: '狀態',
    key: 'status',
    width: 100,
    render: (row: HookLog) => {
      return h(NTag, { type: getStatusType(row.status) }, { default: () => getStatusText(row.status) })
    }
  },
  {
    title: '開始時間',
    key: 'startDateTime',
    width: 160,
    render: (row: HookLog) => formatDateTime(row.startDateTime),
  },
  {
    title: '結束時間',
    key: 'endDateTime',
    width: 160,
    render: (row: HookLog) => row.endDateTime ? formatDateTime(row.endDateTime) : '-',
  },
  {
    title: '處理時間',
    key: 'processingTimeMs',
    width: 100,
    render: (row: HookLog) => row.processingTimeMs ? `${row.processingTimeMs}ms` : '-',
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: HookLog) => {
      return h('div', { class: 'flex gap-2' }, [
        h(NButton, {
          size: 'small',
          type: 'primary',
          onClick: () => showDetail(row)
        }, { default: () => '詳情' }),
        h(NButton, {
          size: 'small',
          type: 'info',
          onClick: () => reExecute(row.id),
          loading: reExecutingIds.value.includes(row.id)
        }, { default: () => '重新執行' })
      ])
    }
  }
]

const reExecutingIds = ref<number[]>([])

// 方法
const getStatusType = (status: string) => {
  switch (status) {
    case 'success': return 'success'
    case 'failed': return 'error'
    case 'pending': return 'warning'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'success': return '成功'
    case 'failed': return '失敗'
    case 'pending': return '處理中'
    default: return status
  }
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-TW')
}

const loadHookLogs = async () => {
  try {
    loading.value = true
    const response = await apiService.getHookLogs({
      page: pagination.page,
      limit: pagination.pageSize,
      status: filters.status || undefined,
      projectId: filters.projectId ? parseInt(filters.projectId) : undefined,
    })
    
    if (response.data.success) {
      hookLogs.value = response.data.data.hookLogs
      pagination.itemCount = response.data.data.pagination.total
    }
  } catch (error) {
    console.error('載入 Hook Logs 失敗:', error)
    message.error('載入 Hook Logs 失敗')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await apiService.getHookLogStats({
      projectId: filters.projectId ? parseInt(filters.projectId) : undefined,
      days: 7,
    })
    
    if (response.data.success) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('載入統計數據失敗:', error)
  }
}

const loadProjects = async () => {
  try {
    const response = await apiService.getProjects()
    if (response.data.success) {
      projects.value = response.data.data
    }
  } catch (error) {
    console.error('載入專案列表失敗:', error)
  }
}

const refreshData = async () => {
  await Promise.all([
    loadHookLogs(),
    loadStats(),
  ])
}

const applyFilters = () => {
  pagination.page = 1
  refreshData()
}

const clearFilters = () => {
  filters.status = ''
  filters.projectId = ''
  pagination.page = 1
  refreshData()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadHookLogs()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadHookLogs()
}

const showDetail = async (hookLog: HookLog) => {
  try {
    const response = await apiService.getHookLogById(hookLog.id)
    if (response.data.success) {
      selectedHookLog.value = response.data.data
      showDetailModal.value = true
    }
  } catch (error) {
    console.error('載入 Hook Log 詳情失敗:', error)
    message.error('載入詳情失敗')
  }
}

const reExecute = async (hookLogId: number) => {
  try {
    reExecutingIds.value.push(hookLogId)
    const response = await apiService.reExecuteHookLog(hookLogId)
    if (response.data.success) {
      message.success('重新執行已開始')
      // 延遲刷新數據，讓用戶看到新的記錄
      setTimeout(() => {
        refreshData()
      }, 1000)
    }
  } catch (error) {
    console.error('重新執行失敗:', error)
    message.error('重新執行失敗')
  } finally {
    reExecutingIds.value = reExecutingIds.value.filter(id => id !== hookLogId)
  }
}

// 生命週期
onMounted(() => {
  loadProjects()
  refreshData()
})
</script>

<style scoped>
.hook-log-management {
  padding: 20px;
}

.text-green-600 {
  color: #16a34a;
}

.text-red-600 {
  color: #dc2626;
}

.hook-log-detail {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
