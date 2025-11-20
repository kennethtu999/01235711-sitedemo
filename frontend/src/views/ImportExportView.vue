<template>
  <div class="import-export-view">
    <div class="header">
      <h1>資料匯入/匯出管理</h1>
      <p class="description"> 管理系統資料的匯入與匯出功能，支援 Project 和 Demo 資料的備份與還原 </p>
    </div>

    <div class="content">
      <!-- 匯出區域 -->
      <div class="section">
        <h2>資料匯出</h2>
        <div class="export-options">
          <div class="option-group">
            <h3>匯出選項</h3>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="exportOptions.includeUsers" type="checkbox" />
                包含用戶資料
              </label>
              <label class="checkbox-label">
                <input v-model="exportOptions.includeGroups" type="checkbox" />
                包含群組資料
              </label>
              <label class="checkbox-label">
                <input v-model="exportOptions.includePermissions" type="checkbox" />
                包含權限關係
              </label>
            </div>
          </div>

          <div class="action-buttons">
            <button @click="exportAllData" :disabled="isExporting" class="btn btn-primary">
              <i class="icon">📤</i>
              {{ isExporting ? '匯出中...' : '匯出所有資料' }}
            </button>
            <button @click="downloadExportFile" :disabled="isExporting" class="btn btn-secondary">
              <i class="icon">💾</i>
              下載匯出檔案
            </button>
          </div>
        </div>

        <!-- 專案選擇匯出 -->
        <div class="project-export">
          <h3>匯出特定專案</h3>
          <div class="project-selector">
            <select v-model="selectedProjectId" class="form-select">
              <option value="">選擇專案</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
            <button @click="exportProjectData" :disabled="!selectedProjectId || isExporting" class="btn btn-outline">
              匯出專案資料
            </button>
          </div>
        </div>
      </div>

      <!-- 匯入區域 -->
      <div class="section">
        <h2>資料匯入</h2>
        <div class="import-options">
          <div class="option-group">
            <h3>匯入選項</h3>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="importOptions.overwriteExisting" type="checkbox" />
                覆蓋現有資料
              </label>
              <label class="checkbox-label">
                <input v-model="importOptions.skipDuplicates" type="checkbox" />
                跳過重複資料
              </label>
              <label class="checkbox-label">
                <input v-model="importOptions.dryRun" type="checkbox" />
                試運行（不實際執行）
              </label>
            </div>
          </div>

          <div class="file-upload">
            <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleFileDrop">
              <input ref="fileInput" type="file" accept=".json" @change="handleFileSelect" style="display: none" />
              <div class="upload-content">
                <i class="icon">📁</i>
                <p>點擊選擇檔案或拖拽檔案到此處</p>
                <p class="file-info">支援 JSON 格式</p>
              </div>
            </div>
            <div v-if="selectedFile" class="selected-file">
              <i class="icon">📄</i>
              <span>{{ selectedFile.name }}</span>
              <button @click="clearFile" class="btn-remove">×</button>
            </div>
          </div>

          <div class="action-buttons">
            <button @click="validateImportData" :disabled="!importData || isImporting" class="btn btn-outline">
              <i class="icon">🔍</i>
              驗證資料
            </button>
            <button @click="importDataAction" :disabled="!importData || isImporting" class="btn btn-primary">
              <i class="icon">📥</i>
              {{ isImporting ? '匯入中...' : '開始匯入' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 結果顯示區域 -->
      <div v-if="result" class="section result-section">
        <div class="result-header">
          <h2>執行結果</h2>
          <button @click="clearImportState" class="btn btn-outline btn-sm">
            <i class="icon">🗑️</i>
            清空狀態
          </button>
        </div>
        <div class="result-content">
          <div class="result-summary">
            <div class="summary-item" :class="{ success: result.success, error: !result.success }">
              <i class="icon">{{ result.success ? '✅' : '❌' }}</i>
              <span>{{ result.message }}</span>
            </div>
          </div>

          <div v-if="result.result" class="result-details">
            <div class="detail-section">
              <h4>匯入統計</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="label">用戶:</span>
                  <span class="value">{{ result.result.imported?.users || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">群組:</span>
                  <span class="value">{{ result.result.imported?.groups || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">專案:</span>
                  <span class="value">{{ result.result.imported?.projects || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">Demo 配置:</span>
                  <span class="value">{{ result.result.imported?.demoConfigs || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">專案用戶權限:</span>
                  <span class="value">{{ result.result.imported?.projectUsers || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">群組專案權限:</span>
                  <span class="value">{{ result.result.imported?.groupProjects || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">Demo 用戶權限:</span>
                  <span class="value">{{ result.result.imported?.demoConfigUsers || 0 }}</span>
                </div>
              </div>
            </div>

            <div v-if="result.result.errors?.length > 0" class="detail-section">
              <h4>錯誤訊息</h4>
              <div class="error-list">
                <div v-for="(error, index) in result.result.errors" :key="index" class="error-item">
                  {{ error }}
                </div>
              </div>
            </div>

            <div v-if="result.result.warnings?.length > 0" class="detail-section">
              <h4>警告訊息</h4>
              <div class="warning-list">
                <div v-for="(warning, index) in result.result.warnings" :key="index" class="warning-item">
                  {{ warning }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()

// 響應式資料
const isExporting = ref(false)
const isImporting = ref(false)
const selectedFile = ref<File | null>(null)
const importData = ref<any>(null)
const result = ref<any>(null)
const projects = ref<any[]>([])
const selectedProjectId = ref('')

// 匯出選項
const exportOptions = ref({
  includeUsers: true,
  includeGroups: true,
  includePermissions: true,
})

// 匯入選項
const importOptions = ref({
  overwriteExisting: false,
  skipDuplicates: true,
  dryRun: false,
})

// 載入專案列表
const loadProjects = async () => {
  try {
    const response = await api.get('/groups/projects')
    projects.value = response.data.data || []
  } catch (error) {
    console.error('載入專案列表失敗:', error)
  }
}

// 匯出所有資料
const exportAllData = async () => {
  try {
    isExporting.value = true
    const params = new URLSearchParams({
      includeUsers: exportOptions.value.includeUsers.toString(),
      includeGroups: exportOptions.value.includeGroups.toString(),
      includePermissions: exportOptions.value.includePermissions.toString(),
    })

    const response = await api.get(`/import-export/export?${params}`)

    // 下載檔案
    const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    result.value = {
      success: true,
      message: '資料匯出成功',
    }
  } catch (error: any) {
    console.error('匯出失敗:', error)
    result.value = {
      success: false,
      message: error.response?.data?.message || '匯出失敗',
    }
  } finally {
    isExporting.value = false
  }
}

// 下載匯出檔案
const downloadExportFile = async () => {
  try {
    isExporting.value = true
    const response = await api.get('/import-export/download', {
      responseType: 'blob',
    })

    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    result.value = {
      success: true,
      message: '檔案下載成功',
    }
  } catch (error: any) {
    console.error('下載失敗:', error)
    result.value = {
      success: false,
      message: error.response?.data?.message || '下載失敗',
    }
  } finally {
    isExporting.value = false
  }
}

// 匯出專案資料
const exportProjectData = async () => {
  if (!selectedProjectId.value) return

  try {
    isExporting.value = true
    const params = new URLSearchParams({
      includeUsers: exportOptions.value.includeUsers.toString(),
      includeGroups: exportOptions.value.includeGroups.toString(),
      includePermissions: exportOptions.value.includePermissions.toString(),
    })

    const response = await api.get(`/import-export/export/project/${selectedProjectId.value}?${params}`)

    // 下載檔案
    const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `project-export-${selectedProjectId.value}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    result.value = {
      success: true,
      message: '專案資料匯出成功',
    }
  } catch (error: any) {
    console.error('專案匯出失敗:', error)
    result.value = {
      success: false,
      message: error.response?.data?.message || '專案匯出失敗',
    }
  } finally {
    isExporting.value = false
  }
}

// 觸發檔案選擇
const triggerFileInput = () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  fileInput?.click()
}

// 處理檔案選擇
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    readFile(target.files[0])
  }
}

// 處理檔案拖拽
const handleFileDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectedFile.value = event.dataTransfer.files[0]
    readFile(event.dataTransfer.files[0])
  }
}

// 讀取檔案內容
const readFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      importData.value = JSON.parse(content)
      result.value = null
    } catch (error) {
      console.error('檔案解析失敗:', error)
      result.value = {
        success: false,
        message: '檔案格式錯誤，請選擇有效的 JSON 檔案',
      }
    }
  }
  reader.readAsText(file)
}

// 清除檔案
const clearFile = () => {
  selectedFile.value = null
  importData.value = null
  result.value = null
}

// 清空匯入狀態
const clearImportState = () => {
  selectedFile.value = null
  importData.value = null
  result.value = null
  // 重置檔案輸入
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

// 驗證匯入資料
const validateImportData = async () => {
  if (!importData.value) return

  try {
    isImporting.value = true
    const response = await api.post('/import-export/validate', {
      importData: importData.value,
    })

    result.value = response.data

    // 如果驗證成功，顯示成功訊息但不清空狀態（用戶可能還想匯入）
    if (response.data.success) {
      console.log('資料驗證成功')
    }
  } catch (error: any) {
    console.error('驗證失敗:', error)
    result.value = {
      success: false,
      message: error.response?.data?.message || '驗證失敗',
    }
  } finally {
    isImporting.value = false
  }
}

// 匯入資料
const importDataAction = async () => {
  if (!importData.value) return

  try {
    isImporting.value = true
    const response = await api.post('/import-export/import', {
      importData: importData.value,
      ...importOptions.value,
    })

    result.value = response.data

    // 如果匯入成功，清空狀態
    if (response.data.success) {
      // 延遲清空，讓用戶看到成功訊息
      setTimeout(() => {
        clearImportState()
      }, 3000)
    }
  } catch (error: any) {
    console.error('匯入失敗:', error)
    result.value = {
      success: false,
      message: error.response?.data?.message || '匯入失敗',
    }
  } finally {
    isImporting.value = false
  }
}

// 組件掛載時載入專案列表
onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.import-export-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.description {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

.export-options,
.import-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.option-group h3 {
  color: #34495e;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-outline:hover:not(:disabled) {
  background: #3498db;
  color: white;
}

.project-export {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.project-export h3 {
  color: #34495e;
  margin-bottom: 1rem;
}

.project-selector {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.form-select {
  padding: 0.5rem;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  min-width: 200px;
}

.file-upload {
  margin: 1rem 0;
}

.upload-area {
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-content .icon {
  font-size: 2rem;
}

.file-info {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.btn-remove {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  margin-left: auto;
}

.result-section {
  margin-top: 2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-summary {
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-summary.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result-summary.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-section h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-item .label {
  font-weight: 500;
}

.stat-item .value {
  color: #3498db;
  font-weight: 600;
}

.error-list,
.warning-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-item {
  padding: 0.5rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  font-size: 0.9rem;
}

.warning-item {
  padding: 0.5rem;
  background: #fff3cd;
  color: #856404;
  border-radius: 4px;
  font-size: 0.9rem;
}

.icon {
  font-style: normal;
}

@media (max-width: 768px) {
  .import-export-view {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .project-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
