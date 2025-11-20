<template>
  <div class="inner-wrapper">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>Hook Log 管理</h1>
        </div>
      </div>
    </header>
    <main class="page-main">
      <div class="panel">
        <div class="panel-header">
          <h2>Hook Log 列表</h2>
          <div class="action-buttons">
            <button @click="refreshData" :disabled="loading" class="btn btn-md btn-secondary">
              <span v-if="loading">載入中...</span>
              <template v-else>
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
                  class="feather feather-refresh-cw mr-1"
                >
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                <span>重新整理</span>
              </template>
            </button>
          </div>
        </div>

        <!-- 統計卡片 -->
        <n-grid :cols="4" :x-gap="16" class="mx-4 mt-4">
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
        <n-space class="m-4">
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
          <button @click="applyFilters" class="btn btn-md btn-primary">篩選</button>
          <button @click="clearFilters" class="btn btn-md btn-secondary">清除</button>
          <button @click="showTriggerHookModal = true" v-if="projects.length > 0" class="btn btn-md btn-secondary">
            觸發 Hook
          </button>
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
      </div>
    </main>

    <!-- 觸發 Hook 模態框 -->
    <n-modal v-model:show="showTriggerHookModal" preset="card" title="觸發專案 Hook" style="width: 500px">
      <n-form :model="triggerHookForm" ref="triggerHookFormRef">
        <n-form-item label="選擇專案" path="projectId" :rule="{ required: true, message: '請選擇專案' }">
          <n-select
            v-model:value="triggerHookForm.projectId"
            placeholder="請選擇專案"
            :options="projectOptions.filter((p) => p.value !== '')"
            @update:value="onProjectChange"
          />
        </n-form-item>
        <n-form-item label="分支名稱" path="branch">
          <n-input v-model:value="triggerHookForm.branch" placeholder="例如: main, develop, feature/xxx" />
          <template #feedback> 留空將使用 main 分支 </template>
        </n-form-item>
        <n-form-item v-if="selectedProject">
          <n-alert type="info" title="專案資訊">
            <template #header>
              <strong>專案:</strong> {{ selectedProject.name }}<br />
              <strong>倉庫:</strong> {{ selectedProject.githubRepoName }}
            </template>
          </n-alert>
        </n-form-item>
        <n-form-item>
          <n-alert type="warning" title="注意事項"> 此操作將觸發專案的所有匹配 Demo 配置進行部署。 </n-alert>
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <button @click="closeTriggerHookModal" class="btn btn-md btn-secondary">取消</button>
          <button
            @click="submitTriggerHook"
            :disabled="!triggerHookForm.projectId || isTriggeringHook"
            class="btn btn-md btn-primary"
          >
            {{ isTriggeringHook ? '執行中...' : '執行 Hook' }}
          </button>
        </n-space>
      </template>
    </n-modal>

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
          <n-descriptions-item label="開始時間">{{
            formatDateTime(selectedHookLog.startDateTime)
          }}</n-descriptions-item>
          <n-descriptions-item label="結束時間">{{
            selectedHookLog.endDateTime ? formatDateTime(selectedHookLog.endDateTime) : '-'
          }}</n-descriptions-item>
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
import {
  NSpace,
  NGrid,
  NGridItem,
  NStatistic,
  NSelect,
  NDataTable,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NText,
  NDivider,
  NCode,
  NForm,
  NFormItem,
  NInput,
  NAlert,
  useMessage,
} from 'naive-ui'
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
  period: '7 days',
})
const projects = ref<Project[]>([])
const showDetailModal = ref(false)
const selectedHookLog = ref<HookLog | null>(null)
const showTriggerHookModal = ref(false)
const isTriggeringHook = ref(false)
const selectedProject = ref<Project | null>(null)

// 篩選器
const filters = reactive({
  status: '' as string,
  projectId: '' as string,
})

// 觸發 Hook 表單
const triggerHookForm = reactive({
  projectId: '' as string,
  branch: '' as string,
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
  ...projects.value.map((project) => ({
    label: project.name,
    value: project.id,
  })),
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
    title: '狀態',
    key: 'status',
    width: 100,
    render: (row: HookLog) => {
      return h(NTag, { type: getStatusType(row.status) }, { default: () => getStatusText(row.status) })
    },
  },
  {
    title: '開始時間',
    key: 'startDateTime',
    width: 160,
    render: (row: HookLog) => formatDateTime(row.startDateTime),
  },
  {
    title: '處理時間',
    key: 'processingTimeMs',
    width: 100,
    render: (row: HookLog) => (row.processingTimeMs ? `${row.processingTimeMs}ms` : '-'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: HookLog) => {
      return h('div', { class: 'action-buttons', style: 'display: flex; gap: 8px; align-items: center;' }, [
        h(
          'button',
          {
            class: 'btn btn-sm btn-outline',
            onClick: () => showDetail(row),
          },
          '詳情'
        ),
        h(
          'button',
          {
            class: 'btn btn-sm btn-outline',
            onClick: () => reExecute(row.id),
            disabled: reExecutingIds.value.includes(row.id),
          },
          reExecutingIds.value.includes(row.id) ? '執行中...' : '重新執行'
        ),
      ])
    },
  },
]

const reExecutingIds = ref<number[]>([])

// 方法
const getStatusType = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'default'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失敗'
    case 'pending':
      return '處理中'
    default:
      return status
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
  await Promise.all([loadHookLogs(), loadStats()])
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
    reExecutingIds.value = reExecutingIds.value.filter((id) => id !== hookLogId)
  }
}

// 觸發 Hook 相關方法
const onProjectChange = (projectId: string) => {
  const project = projects.value.find((p) => p.id.toString() === projectId)
  selectedProject.value = project || null
}

const closeTriggerHookModal = () => {
  showTriggerHookModal.value = false
  triggerHookForm.projectId = ''
  triggerHookForm.branch = ''
  selectedProject.value = null
}

const submitTriggerHook = async () => {
  if (!triggerHookForm.projectId) {
    message.error('請選擇專案')
    return
  }

  const project = projects.value.find((p) => p.id.toString() === triggerHookForm.projectId)
  if (!project) {
    message.error('專案不存在')
    return
  }

  if (!project.isActive) {
    message.error('專案未啟用，無法執行 Hook')
    return
  }

  isTriggeringHook.value = true
  try {
    const branch = triggerHookForm.branch.trim() || undefined
    await apiService.triggerProjectHook(project.id, branch)
    message.success('Hook 執行已開始，請查看下方列表了解執行狀態')
    closeTriggerHookModal()
    // 延遲刷新數據，讓用戶看到新的記錄
    setTimeout(() => {
      refreshData()
    }, 1000)
  } catch (error: unknown) {
    console.error('觸發 Hook 失敗:', error)
    const errorMessage =
      error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '觸發 Hook 失敗，請稍後再試'
    message.error(errorMessage || '觸發 Hook 失敗，請稍後再試')
  } finally {
    isTriggeringHook.value = false
  }
}

// 生命週期
onMounted(() => {
  loadProjects()
  refreshData()
})
</script>

<style scoped>
:deep(.n-data-table__pagination) {
  margin: 16px;
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

/* 載入動畫 */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-primary);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
