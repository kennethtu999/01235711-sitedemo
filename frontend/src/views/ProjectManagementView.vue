<template>
  <div class="project-management-container">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button @click="goBack" class="back-button">
            <span>←</span> 返回儀表板
          </button>
          <h1>專案管理</h1>
        </div>
        <div class="header-right">
          <button @click="showCreateProjectModal = true" class="create-button">
            + 新增專案
          </button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <!-- 專案列表 -->
      <div class="projects-section">
        <div class="section-header">
          <h2>專案列表</h2>
          <div class="section-actions">
            <button @click="refreshProjects" :disabled="isLoading" class="refresh-button">
              {{ isLoading ? '載入中...' : '重新整理' }}
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>載入專案資料中...</p>
        </div>

        <div v-else-if="projects.length === 0" class="empty-state">
          <p>目前沒有專案</p>
        </div>

        <div v-else class="projects-list">
          <div v-for="project in projects" :key="project.id" class="project-card">
            <div class="project-header">
              <div class="project-info">
                <h3 class="project-name">{{ project.name }}</h3>
                <p class="project-description">{{ project.description || '無描述' }}</p>
                <div class="project-meta">
                  <span class="github-url">{{ project.githubRepoUrl }}</span>
                  <span :class="['status-badge', project.isActive ? 'active' : 'inactive']">
                    {{ project.isActive ? '啟用' : '停用' }}
                  </span>
                </div>
              </div>
              <div class="project-actions">
                <button @click="editProject(project)" class="edit-button" title="編輯專案">
                  編輯
                </button>
                <button @click="deleteProject(project)" class="delete-button" title="刪除專案">
                  刪除
                </button>
              </div>
            </div>

            <!-- Demo 配置列表 -->
            <div class="demo-configs-section">
              <div class="demo-configs-header">
                <h4>Demo 配置</h4>
                <button @click="openCreateDemoConfigModal(project)" class="add-demo-button">
                  + 新增 Demo 配置
                </button>
              </div>

              <div v-if="project.demoConfigs && project.demoConfigs.length === 0" class="no-demo-configs">
                <p>此專案尚未配置任何 Demo</p>
              </div>

              <div v-else class="demo-configs-list">
                <div v-for="demoConfig in project.demoConfigs" :key="demoConfig.id" class="demo-config-card">
                  <div class="demo-config-info">
                    <div class="demo-config-header">
                      <h5 class="demo-config-name">{{ demoConfig.displayName || demoConfig.branchName }}</h5>
                      <span :class="['deployment-status', demoConfig.deploymentStatus]">
                        {{ getDeploymentStatusText(demoConfig.deploymentStatus) }}
                      </span>
                    </div>
                    <div class="demo-config-details">
                      <p><strong>分支:</strong> {{ demoConfig.branchName }}</p>
                      <p><strong>路徑:</strong> {{ demoConfig.demoPath }}</p>
                      <p v-if="demoConfig.description"><strong>描述:</strong> {{ demoConfig.description }}</p>
                      <p v-if="demoConfig.lastDeploymentTime">
                        <strong>最後部署:</strong> {{ formatDate(demoConfig.lastDeploymentTime) }}
                      </p>
                    </div>
                  </div>

                  <div class="demo-config-actions">
                    <div class="authorized-users">
                      <h6>授權使用者 ({{ demoConfig.authorizedUsers?.length || 0 }})</h6>
                      <div v-if="demoConfig.authorizedUsers && demoConfig.authorizedUsers.length > 0" class="users-list">
                        <span v-for="user in demoConfig.authorizedUsers" :key="user.id" class="user-badge">
                          {{ user.username }}
                        </span>
                      </div>
                      <div v-else class="no-users">
                        <p>無授權使用者</p>
                      </div>
                    </div>

                    <div class="demo-config-buttons">
                      <button @click="manageDemoConfigUsers(demoConfig)" class="manage-users-button">
                        管理授權
                      </button>
                      <button @click="editDemoConfig(demoConfig)" class="edit-demo-button">
                        編輯
                      </button>
                      <button @click="deleteDemoConfig(demoConfig)" class="delete-demo-button">
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 新增/編輯專案模態框 -->
    <div v-if="showCreateProjectModal || showEditProjectModal" class="modal-overlay" @click="closeProjectModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showCreateProjectModal ? '新增專案' : '編輯專案' }}</h3>
          <button @click="closeProjectModal" class="close-button">×</button>
        </div>
        
        <form @submit.prevent="submitProjectForm" class="modal-form">
          <div class="form-group">
            <label for="projectName">專案名稱 *</label>
            <input
              id="projectName"
              v-model="projectFormData.name"
              type="text"
              required
              placeholder="請輸入專案名稱"
            />
          </div>

          <div class="form-group">
            <label for="projectDescription">專案描述</label>
            <textarea
              id="projectDescription"
              v-model="projectFormData.description"
              rows="3"
              placeholder="請輸入專案描述"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="githubRepoUrl">GitHub 倉庫 URL *</label>
            <input
              id="githubRepoUrl"
              v-model="projectFormData.githubRepoUrl"
              type="url"
              required
              placeholder="https://github.com/username/repository"
            />
          </div>

          <div v-if="showEditProjectModal" class="form-group">
            <label class="checkbox-label">
              <input
                v-model="projectFormData.isActive"
                type="checkbox"
              />
              啟用專案
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeProjectModal" class="cancel-button">
              取消
            </button>
            <button type="submit" :disabled="isSubmitting" class="submit-button">
              {{ isSubmitting ? '處理中...' : (showCreateProjectModal ? '新增' : '更新') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 新增/編輯 Demo 配置模態框 -->
    <div v-if="showCreateDemoConfigModal || showEditDemoConfigModal" class="modal-overlay" @click="closeDemoConfigModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showCreateDemoConfigModal ? '新增 Demo 配置' : '編輯 Demo 配置' }}</h3>
          <button @click="closeDemoConfigModal" class="close-button">×</button>
        </div>
        
        <form @submit.prevent="submitDemoConfigForm" class="modal-form">
          <div class="form-group">
            <label for="branchName">分支名稱 *</label>
            <input
              id="branchName"
              v-model="demoConfigFormData.branchName"
              type="text"
              required
              placeholder="例如: main, develop, feature/xxx"
            />
          </div>

          <div class="form-group">
            <label for="demoPath">Demo 路徑</label>
            <input
              id="demoPath"
              v-model="demoConfigFormData.demoPath"
              type="text"
              placeholder="例如: /, /dist, /build"
            />
          </div>

          <div class="form-group">
            <label for="displayName">顯示名稱</label>
            <input
              id="displayName"
              v-model="demoConfigFormData.displayName"
              type="text"
              placeholder="例如: 主分支 Demo, 開發版本"
            />
          </div>

          <div class="form-group">
            <label for="demoDescription">描述</label>
            <textarea
              id="demoDescription"
              v-model="demoConfigFormData.description"
              rows="3"
              placeholder="請輸入 Demo 配置描述"
            ></textarea>
          </div>

          <div v-if="showEditDemoConfigModal" class="form-group">
            <label class="checkbox-label">
              <input
                v-model="demoConfigFormData.isActive"
                type="checkbox"
              />
              啟用配置
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeDemoConfigModal" class="cancel-button">
              取消
            </button>
            <button type="submit" :disabled="isSubmitting" class="submit-button">
              {{ isSubmitting ? '處理中...' : (showCreateDemoConfigModal ? '新增' : '更新') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 管理 Demo 配置授權使用者模態框 -->
    <div v-if="showManageUsersModal" class="modal-overlay" @click="closeManageUsersModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>管理授權使用者 - {{ currentDemoConfig?.displayName || currentDemoConfig?.branchName }}</h3>
          <button @click="closeManageUsersModal" class="close-button">×</button>
        </div>
        
        <div class="modal-body">
          <div class="users-selection">
            <h4>選擇授權使用者</h4>
            <div class="users-checkboxes">
              <label v-for="user in allUsers" :key="user.id" class="user-checkbox-label">
                <input
                  v-model="selectedUserIds"
                  :value="user.id"
                  type="checkbox"
                />
                <span class="user-info">
                  <span class="username">{{ user.username }}</span>
                  <span class="user-role">({{ user.role === 'admin' ? '管理員' : '使用者' }})</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="closeManageUsersModal" class="cancel-button">
            取消
          </button>
          <button @click="saveUserAuthorizations" :disabled="isSubmitting" class="submit-button">
            {{ isSubmitting ? '處理中...' : '儲存授權' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 刪除確認模態框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h3>確認刪除</h3>
          <button @click="closeDeleteModal" class="close-button">×</button>
        </div>
        
        <div class="modal-body">
          <p>您確定要刪除{{ deleteType === 'project' ? '專案' : 'Demo 配置'}} <strong>{{ itemToDelete?.name || itemToDelete?.displayName || itemToDelete?.branchName }}</strong> 嗎？</p>
          <p class="warning-text">此操作無法復原。</p>
        </div>

        <div class="form-actions">
          <button @click="closeDeleteModal" class="cancel-button">
            取消
          </button>
          <button @click="confirmDelete" :disabled="isDeleting" class="delete-button">
            {{ isDeleting ? '刪除中...' : '確認刪除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  apiService, 
  type Project, 
  type DemoConfig, 
  type User,
  type CreateProjectData, 
  type UpdateProjectData,
  type CreateDemoConfigData,
  type UpdateDemoConfigData
} from '@/api'

const router = useRouter()

// 狀態管理
const projects = ref<Project[]>([])
const allUsers = ref<User[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)

// 模態框狀態
const showCreateProjectModal = ref(false)
const showEditProjectModal = ref(false)
const showCreateDemoConfigModal = ref(false)
const showEditDemoConfigModal = ref(false)
const showManageUsersModal = ref(false)
const showDeleteModal = ref(false)

// 表單數據
const projectFormData = ref<CreateProjectData & UpdateProjectData & { isActive: boolean }>({
  name: '',
  description: '',
  githubRepoUrl: '',
  isActive: true
})

const demoConfigFormData = ref<CreateDemoConfigData & UpdateDemoConfigData & { isActive: boolean }>({
  branchName: '',
  demoPath: '/',
  displayName: '',
  description: '',
  isActive: true
})

// 當前操作的項目
const currentProject = ref<Project | null>(null)
const currentDemoConfig = ref<DemoConfig | null>(null)
const itemToDelete = ref<Project | DemoConfig | null>(null)
const deleteType = ref<'project' | 'demoConfig'>('project')

// 授權使用者選擇
const selectedUserIds = ref<number[]>([])

// 組件掛載時載入數據
onMounted(() => {
  loadData()
})

// 載入所有數據
const loadData = async () => {
  isLoading.value = true
  try {
    const [projectsResponse, usersResponse] = await Promise.all([
      apiService.getProjects(),
      apiService.getUsers()
    ])
    projects.value = projectsResponse.data.data
    allUsers.value = usersResponse.data.data
  } catch (error) {
    console.error('載入數據失敗:', error)
    alert('載入數據失敗，請稍後再試')
  } finally {
    isLoading.value = false
  }
}

// 重新整理數據
const refreshProjects = () => {
  loadData()
}

// 返回儀表板
const goBack = () => {
  router.push('/dashboard')
}

// 專案相關操作
const editProject = (project: Project) => {
  projectFormData.value = {
    name: project.name,
    description: project.description || '',
    githubRepoUrl: project.githubRepoUrl,
    isActive: project.isActive
  }
  currentProject.value = project
  showEditProjectModal.value = true
}

const deleteProject = (project: Project) => {
  itemToDelete.value = project
  deleteType.value = 'project'
  showDeleteModal.value = true
}

const openCreateDemoConfigModal = (project: Project) => {
  currentProject.value = project
  showCreateDemoConfigModal.value = true
}

// Demo 配置相關操作
const editDemoConfig = (demoConfig: DemoConfig) => {
  demoConfigFormData.value = {
    branchName: demoConfig.branchName,
    demoPath: demoConfig.demoPath,
    displayName: demoConfig.displayName || '',
    description: demoConfig.description || '',
    isActive: demoConfig.isActive
  }
  currentDemoConfig.value = demoConfig
  showEditDemoConfigModal.value = true
}

const deleteDemoConfig = (demoConfig: DemoConfig) => {
  itemToDelete.value = demoConfig
  deleteType.value = 'demoConfig'
  showDeleteModal.value = true
}

const manageDemoConfigUsers = (demoConfig: DemoConfig) => {
  currentDemoConfig.value = demoConfig
  selectedUserIds.value = demoConfig.authorizedUsers?.map(user => user.id) || []
  showManageUsersModal.value = true
}

// 關閉模態框
const closeProjectModal = () => {
  showCreateProjectModal.value = false
  showEditProjectModal.value = false
  resetProjectForm()
}

const closeDemoConfigModal = () => {
  showCreateDemoConfigModal.value = false
  showEditDemoConfigModal.value = false
  resetDemoConfigForm()
}

const closeManageUsersModal = () => {
  showManageUsersModal.value = false
  currentDemoConfig.value = null
  selectedUserIds.value = []
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

// 重置表單
const resetProjectForm = () => {
  projectFormData.value = {
    name: '',
    description: '',
    githubRepoUrl: '',
    isActive: true
  }
  currentProject.value = null
}

const resetDemoConfigForm = () => {
  demoConfigFormData.value = {
    branchName: '',
    demoPath: '/',
    displayName: '',
    description: '',
    isActive: true
  }
  currentDemoConfig.value = null
}

// 提交專案表單
const submitProjectForm = async () => {
  isSubmitting.value = true
  try {
    if (showCreateProjectModal.value) {
      await apiService.createProject(projectFormData.value)
      alert('專案新增成功')
    } else if (showEditProjectModal.value && currentProject.value) {
      const updateData: UpdateProjectData = {
        name: projectFormData.value.name,
        description: projectFormData.value.description,
        githubRepoUrl: projectFormData.value.githubRepoUrl,
        isActive: projectFormData.value.isActive
      }
      await apiService.updateProject(currentProject.value.id, updateData)
      alert('專案更新成功')
    }
    
    closeProjectModal()
    loadData()
  } catch (error: any) {
    console.error('操作失敗:', error)
    const message = error.response?.data?.message || '操作失敗，請稍後再試'
    alert(message)
  } finally {
    isSubmitting.value = false
  }
}

// 提交 Demo 配置表單
const submitDemoConfigForm = async () => {
  isSubmitting.value = true
  try {
    if (showCreateDemoConfigModal.value && currentProject.value) {
      await apiService.createDemoConfig(currentProject.value.id, demoConfigFormData.value)
      alert('Demo 配置新增成功')
    } else if (showEditDemoConfigModal.value && currentDemoConfig.value) {
      const updateData: UpdateDemoConfigData = {
        branchName: demoConfigFormData.value.branchName,
        demoPath: demoConfigFormData.value.demoPath,
        displayName: demoConfigFormData.value.displayName,
        description: demoConfigFormData.value.description,
        isActive: demoConfigFormData.value.isActive
      }
      await apiService.updateDemoConfig(currentDemoConfig.value.id, updateData)
      alert('Demo 配置更新成功')
    }
    
    closeDemoConfigModal()
    loadData()
  } catch (error: any) {
    console.error('操作失敗:', error)
    const message = error.response?.data?.message || '操作失敗，請稍後再試'
    alert(message)
  } finally {
    isSubmitting.value = false
  }
}

// 儲存使用者授權
const saveUserAuthorizations = async () => {
  if (!currentDemoConfig.value) return
  
  isSubmitting.value = true
  try {
    // 先移除所有現有授權
    const currentUserIds = currentDemoConfig.value.authorizedUsers?.map(user => user.id) || []
    for (const userId of currentUserIds) {
      await apiService.removeDemoConfigUser(currentDemoConfig.value.id, userId)
    }
    
    // 添加新的授權
    if (selectedUserIds.value.length > 0) {
      await apiService.addDemoConfigUsers(currentDemoConfig.value.id, selectedUserIds.value)
    }
    
    alert('授權更新成功')
    closeManageUsersModal()
    loadData()
  } catch (error: any) {
    console.error('授權更新失敗:', error)
    const message = error.response?.data?.message || '授權更新失敗，請稍後再試'
    alert(message)
  } finally {
    isSubmitting.value = false
  }
}

// 確認刪除
const confirmDelete = async () => {
  if (!itemToDelete.value) return
  
  isDeleting.value = true
  try {
    if (deleteType.value === 'project') {
      await apiService.deleteProject((itemToDelete.value as Project).id)
      alert('專案刪除成功')
    } else {
      await apiService.deleteDemoConfig((itemToDelete.value as DemoConfig).id)
      alert('Demo 配置刪除成功')
    }
    
    closeDeleteModal()
    loadData()
  } catch (error: any) {
    console.error('刪除失敗:', error)
    const message = error.response?.data?.message || '刪除失敗，請稍後再試'
    alert(message)
  } finally {
    isDeleting.value = false
  }
}

// 獲取部署狀態文字
const getDeploymentStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待部署',
    deploying: '部署中',
    success: '部署成功',
    failed: '部署失敗'
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW')
}
</script>

<style scoped>
.project-management-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.back-button:hover {
  background: #5a6268;
}

.header-left h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.create-button {
  padding: 10px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.create-button:hover {
  background: #218838;
}

.page-main {
  padding: 24px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.projects-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.section-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.refresh-button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #0056b3;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.projects-list {
  padding: 24px;
}

.project-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.project-info {
  flex: 1;
}

.project-name {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.project-description {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.github-url {
  color: #007bff;
  font-size: 12px;
  font-family: monospace;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.project-actions {
  display: flex;
  gap: 8px;
}

.edit-button,
.delete-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.edit-button {
  background: #ffc107;
  color: #212529;
}

.edit-button:hover {
  background: #e0a800;
}

.delete-button {
  background: #dc3545;
  color: white;
}

.delete-button:hover {
  background: #c82333;
}

.demo-configs-section {
  padding: 20px;
}

.demo-configs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.demo-configs-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.add-demo-button {
  padding: 6px 12px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-demo-button:hover {
  background: #138496;
}

.no-demo-configs {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.demo-configs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-config-card {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 16px;
  background: #f8f9fa;
}

.demo-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.demo-config-name {
  margin: 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.deployment-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.deployment-status.pending {
  background: #fff3cd;
  color: #856404;
}

.deployment-status.deploying {
  background: #d1ecf1;
  color: #0c5460;
}

.deployment-status.success {
  background: #d4edda;
  color: #155724;
}

.deployment-status.failed {
  background: #f8d7da;
  color: #721c24;
}

.demo-config-details {
  margin-bottom: 16px;
}

.demo-config-details p {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #666;
}

.demo-config-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.authorized-users {
  flex: 1;
}

.authorized-users h6 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 12px;
  font-weight: 600;
}

.users-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.user-badge {
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.no-users {
  color: #666;
  font-size: 12px;
  font-style: italic;
}

.demo-config-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.manage-users-button,
.edit-demo-button,
.delete-demo-button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.manage-users-button {
  background: #6f42c1;
  color: white;
}

.manage-users-button:hover {
  background: #5a32a3;
}

.edit-demo-button {
  background: #ffc107;
  color: #212529;
}

.edit-demo-button:hover {
  background: #e0a800;
}

.delete-demo-button {
  background: #dc3545;
  color: white;
}

.delete-demo-button:hover {
  background: #c82333;
}

/* 模態框樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.large-modal {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #333;
}

.modal-form {
  padding: 24px;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.users-selection h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.users-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.user-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.user-checkbox-label:hover {
  background: #f8f9fa;
}

.user-checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
  color: #333;
}

.user-role {
  color: #666;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-button,
.submit-button,
.delete-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-button {
  background: #6c757d;
  color: white;
}

.cancel-button:hover {
  background: #5a6268;
}

.submit-button {
  background: #007bff;
  color: white;
}

.submit-button:hover:not(:disabled) {
  background: #0056b3;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-modal .modal-body {
  padding: 24px;
}

.delete-modal .modal-body p {
  margin: 0 0 12px 0;
  color: #333;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
}

.delete-modal .delete-button {
  background: #dc3545;
  color: white;
}

.delete-modal .delete-button:hover:not(:disabled) {
  background: #c82333;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .page-main {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .project-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .project-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .demo-configs-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .demo-config-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .demo-config-buttons {
    justify-content: flex-start;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

/* 大螢幕優化 */
@media (min-width: 1200px) {
  .page-main {
    max-width: 1400px;
    padding: 32px 40px;
  }
  
  .header-content {
    max-width: 1400px;
  }
  
  .page-header {
    padding: 20px 40px;
  }
  
  .header-left h1 {
    font-size: 28px;
  }
  
  .section-header h2 {
    font-size: 24px;
  }
  
  .project-name {
    font-size: 20px;
  }
  
  .project-description {
    font-size: 15px;
  }
  
  .demo-configs-header h4 {
    font-size: 18px;
  }
  
  .demo-config-name {
    font-size: 16px;
  }
  
  .modal-content {
    max-width: 600px;
  }
  
  .large-modal {
    max-width: 700px;
  }
}

@media (min-width: 1440px) {
  .page-main {
    max-width: 1600px;
    padding: 40px 60px;
  }
  
  .header-content {
    max-width: 1600px;
  }
  
  .page-header {
    padding: 24px 60px;
  }
  
  .header-left h1 {
    font-size: 32px;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .project-name {
    font-size: 22px;
  }
  
  .project-description {
    font-size: 16px;
  }
  
  .demo-configs-header h4 {
    font-size: 20px;
  }
  
  .demo-config-name {
    font-size: 17px;
  }
  
  .modal-content {
    max-width: 700px;
  }
  
  .large-modal {
    max-width: 800px;
  }
}

@media (min-width: 1920px) {
  .page-main {
    max-width: 1800px;
    padding: 48px 80px;
  }
  
  .header-content {
    max-width: 1800px;
  }
  
  .page-header {
    padding: 32px 80px;
  }
  
  .header-left h1 {
    font-size: 36px;
  }
  
  .section-header h2 {
    font-size: 32px;
  }
  
  .project-name {
    font-size: 24px;
  }
  
  .project-description {
    font-size: 17px;
  }
  
  .demo-configs-header h4 {
    font-size: 22px;
  }
  
  .demo-config-name {
    font-size: 18px;
  }
  
  .modal-content {
    max-width: 800px;
  }
  
  .large-modal {
    max-width: 900px;
  }
}
</style>
