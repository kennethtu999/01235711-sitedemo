<template>
  <div class="inner-wrapper">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>專案管理</h1>
        </div>
        <div class="header-right">
          <button @click="showCreateProjectModal = true" class="btn btn-md btn-primary">
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
              class="feather feather-plus mr-1"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>新增專案</span>
          </button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <!-- 專案列表 -->
      <div class="panel">
        <div class="panel-header">
          <h2>專案列表</h2>
          <div class="action-buttons">
            <button @click="refreshProjects" :disabled="isLoading" class="btn btn-md btn-secondary">
              <span v-if="isLoading">載入中...</span>
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
                <p class="project-description">
                  {{ project.description || '無描述' }}
                </p>
                <div class="project-meta">
                  <span class="github-url">{{ project.githubRepoUrl }}</span>
                  <span v-if="project.githubRepoName" class="github-repo-name">{{ project.githubRepoName }}</span>
                  <span :class="['status-badge', project.isActive ? 'active' : 'inactive']">
                    {{ project.isActive ? '啟用' : '停用' }}
                  </span>
                </div>
              </div>
              <div class="project-actions">
                <button
                  @click="triggerProjectHook(project)"
                  class="btn btn-sm btn-outline"
                  title="執行 Hook"
                  :disabled="!project.isActive || isTriggeringHook"
                >
                  {{ isTriggeringHook ? '執行中...' : '執行 Hook' }}
                </button>
                <button @click="manageProjectGroups(project)" class="btn btn-sm btn-outline" title="管理專案群組">
                  管理群組
                </button>
                <button @click="editProject(project)" class="btn btn-sm btn-outline" title="編輯專案">編輯</button>
                <button @click="deleteProject(project)" class="btn btn-sm btn-danger" title="刪除專案">刪除</button>
              </div>
            </div>

            <!-- Demo 配置列表 -->
            <div class="demo-configs-section">
              <div class="demo-configs-header">
                <h4>Demo 配置</h4>
                <button @click="openCreateDemoConfigModal(project)" class="btn btn-sm btn-success">
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
                    class="feather feather-plus mr-1"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>新增 Demo 配置</span>
                </button>
              </div>

              <div v-if="project.demoConfigs && project.demoConfigs.length === 0" class="no-demo-configs">
                <p>此專案尚未配置任何 Demo</p>
              </div>

              <div v-else class="demo-configs-list">
                <div v-for="demoConfig in project.demoConfigs" :key="demoConfig.id" class="demo-config-card">
                  <div class="demo-config-info">
                    <div class="demo-config-header">
                      <h5 class="demo-config-name">
                        {{ demoConfig.displayName || demoConfig.branchName }}
                      </h5>
                      <span :class="['deployment-status', demoConfig.deploymentStatus]">
                        {{ getDeploymentStatusText(demoConfig.deploymentStatus) }}
                      </span>
                    </div>
                    <div class="demo-config-details">
                      <p>
                        <strong>分支:</strong>
                        {{ demoConfig.branchName }}
                      </p>
                      <p>
                        <strong>路徑:</strong>
                        {{ demoConfig.demoPath }}
                      </p>
                      <p v-if="demoConfig.subSiteFolders">
                        <strong>子站點資料夾:</strong>
                        {{ demoConfig.subSiteFolders }}
                      </p>
                      <p v-if="demoConfig.subSiteDisplayName">
                        <strong>子站點顯示名稱:</strong>
                        {{ demoConfig.subSiteDisplayName }}
                      </p>
                      <p v-if="demoConfig.description">
                        <strong>描述:</strong>
                        {{ demoConfig.description }}
                      </p>
                      <p v-if="demoConfig.lastDeploymentTime">
                        <strong>最後部署:</strong>
                        {{ formatDate(demoConfig.lastDeploymentTime) }}
                      </p>
                    </div>
                  </div>

                  <div class="demo-config-actions">
                    <div class="demo-config-buttons">
                      <button @click="editDemoConfig(demoConfig)" class="btn btn-sm btn-outline">編輯</button>
                      <button @click="deleteDemoConfig(demoConfig)" class="btn btn-sm btn-danger">刪除</button>
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
    <div v-if="showCreateProjectModal || showEditProjectModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ showCreateProjectModal ? '新增專案' : '編輯專案' }}</h3>
          <button @click="closeProjectModal" class="btn btn-sm btn-ghost">×</button>
        </div>

        <form @submit.prevent="submitProjectForm" class="modal-form">
          <div class="form-group">
            <label for="projectName">專案名稱 *</label>
            <input id="projectName" v-model="projectFormData.name" type="text" required placeholder="請輸入專案名稱" />
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
              type="text"
              required
              placeholder="https://github.com/username/repository"
            />
          </div>

          <div class="form-group">
            <label for="githubRepoName">GitHub 倉庫名稱 *</label>
            <input
              id="githubRepoName"
              v-model="projectFormData.githubRepoName"
              type="text"
              required
              placeholder="例如: my-awesome-project"
            />
            <small class="form-help-text">請手動輸入 GitHub 倉庫名稱</small>
          </div>

          <div v-if="showEditProjectModal" class="form-group">
            <label class="checkbox-label">
              <input v-model="projectFormData.isActive" type="checkbox" />
              啟用專案
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeProjectModal" class="btn btn-md btn-secondary">取消</button>
            <button type="submit" :disabled="isSubmitting" class="btn btn-md btn-primary">
              {{ isSubmitting ? '處理中...' : showCreateProjectModal ? '新增' : '更新' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 新增/編輯 Demo 配置模態框 -->
    <div v-if="showCreateDemoConfigModal || showEditDemoConfigModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            {{ showCreateDemoConfigModal ? '新增 Demo 配置' : '編輯 Demo 配置' }}
          </h3>
          <button @click="closeDemoConfigModal" class="btn btn-sm btn-ghost">×</button>
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
            <label for="subSiteFolders">子站點資料夾</label>
            <input
              id="subSiteFolders"
              v-model="demoConfigFormData.subSiteFolders"
              type="text"
              placeholder="例如: rc1,rc2 或 main,develop"
            />
            <small class="form-help-text">多個資料夾請用逗號分隔</small>
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
            <label for="subSiteDisplayName">子站點顯示名稱</label>
            <input
              id="subSiteDisplayName"
              v-model="demoConfigFormData.subSiteDisplayName"
              type="text"
              placeholder="例如: 子站點1,子站點2"
            />
            <small class="form-help-text">多個資料夾請用逗號分隔</small>
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
              <input v-model="demoConfigFormData.isActive" type="checkbox" />
              啟用配置
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeDemoConfigModal" class="btn btn-md btn-secondary">取消</button>
            <button type="submit" :disabled="isSubmitting" class="btn btn-md btn-primary">
              {{ isSubmitting ? '處理中...' : showCreateDemoConfigModal ? '新增' : '更新' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 執行 Hook 模態框 -->
    <div v-if="showTriggerHookModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>執行專案 Hook</h3>
          <button @click="closeTriggerHookModal" class="btn btn-sm btn-ghost">×</button>
        </div>

        <form @submit.prevent="submitTriggerHook" class="modal-form">
          <div class="form-group">
            <label for="hookBranch">分支名稱</label>
            <input
              id="hookBranch"
              v-model="hookFormData.branch"
              type="text"
              placeholder="例如: main, develop, feature/xxx"
            />
            <small class="form-help-text">留空將使用 main 分支</small>
          </div>

          <div class="form-group">
            <p class="hook-info">
              <strong>專案:</strong>
              {{ currentProject?.name }}
              <br />
              <strong>倉庫:</strong>
              {{ currentProject?.githubRepoName }}
            </p>
            <p class="hook-warning">此操作將觸發專案的所有匹配 Demo 配置進行部署。</p>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeTriggerHookModal" class="btn btn-md btn-secondary">取消</button>
            <button type="submit" :disabled="isTriggeringHook" class="btn btn-md btn-primary">
              {{ isTriggeringHook ? '執行中...' : '執行 Hook' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 管理專案群組模態框 -->
    <div v-if="showManageProjectGroupsModal" class="modal-overlay">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>管理專案群組 - {{ currentProject?.name }}</h3>
          <button @click="closeManageProjectGroupsModal" class="btn btn-sm btn-ghost">×</button>
        </div>

        <div class="modal-body">
          <!-- 現有群組列表 -->
          <div class="current-groups-section">
            <div class="current-groups-header">
              <h4>現有群組 ({{ projectGroups?.length || 0 }})</h4>
            </div>
            <div v-if="projectGroups && projectGroups.length > 0" class="current-groups-list">
              <div v-for="group in projectGroups" :key="group.id" class="current-group-item">
                <div class="group-info">
                  <span class="group-name">{{ group.name }}</span>
                  <span v-if="group.isAdminGroup" class="admin-badge">管理員群組</span>
                  <span class="group-role">({{ getRoleLabel(group.role) }})</span>
                </div>
                <div class="group-actions">
                  <button @click="removeProjectGroup(group.id)" class="btn btn-sm btn-danger">移除</button>
                </div>
              </div>
            </div>
            <div v-else class="no-groups">
              <p>此專案尚未加入任何群組</p>
            </div>
          </div>

          <!-- 添加新群組 -->
          <div class="add-groups-section">
            <h4>添加群組</h4>
            <div class="groups-selection">
              <div class="groups-checkboxes">
                <table class="groups-table">
                  <tbody>
                    <tr v-for="group in availableGroups" :key="group.id" class="group-row">
                      <td class="checkbox-cell">
                        <input v-model="selectedGroupIds" :value="group.id" type="checkbox" class="group-checkbox" />
                      </td>
                      <td class="group-info-cell">
                        <div class="group-info">
                          <span class="group-name">{{ group.name }}</span>
                          <span v-if="group.isAdminGroup" class="admin-badge">管理員群組</span>
                          <span class="group-role">({{ getRoleLabel(group.role) }})</span>
                          <span v-if="group.description" class="group-description">{{ group.description }}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="availableGroups.length === 0" class="no-groups">沒有可新增的群組</div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="closeManageProjectGroupsModal" class="btn btn-md btn-secondary">取消</button>
          <button
            @click="addSelectedGroups"
            :disabled="isSubmitting || selectedGroupIds.length === 0"
            class="btn btn-md btn-primary"
          >
            {{ isSubmitting ? '處理中...' : '添加群組' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 刪除確認模態框 -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content delete-modal">
        <div class="modal-header">
          <h3>確認刪除</h3>
          <button @click="closeDeleteModal" class="btn btn-sm btn-ghost">×</button>
        </div>

        <div class="modal-body">
          <p>
            您確定要刪除{{ deleteType === 'project' ? '專案' : 'Demo 配置' }}
            <strong>
              {{
                deleteType === 'project'
                  ? (itemToDelete as Project)?.name
                  : (itemToDelete as DemoConfig)?.displayName || (itemToDelete as DemoConfig)?.branchName
              }}
            </strong>
            嗎？
          </p>
          <p class="warning-text">此操作無法復原。</p>
        </div>

        <div class="form-actions">
          <button @click="closeDeleteModal" class="btn btn-md btn-secondary">取消</button>
          <button @click="confirmDelete" :disabled="isDeleting" class="btn btn-md btn-danger">
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
  type UpdateDemoConfigData,
  type AddProjectUsersData,
} from '@/api'
import api from '@/api'

const router = useRouter()

// 狀態管理
const projects = ref<Project[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const isTriggeringHook = ref(false)

// 模態框狀態
const showCreateProjectModal = ref(false)
const showEditProjectModal = ref(false)
const showCreateDemoConfigModal = ref(false)
const showEditDemoConfigModal = ref(false)
const showManageProjectGroupsModal = ref(false)
const showTriggerHookModal = ref(false)
const showDeleteModal = ref(false)

// 表單數據
const projectFormData = ref<CreateProjectData & UpdateProjectData & { isActive: boolean; githubRepoName: string }>({
  name: '',
  description: '',
  githubRepoUrl: '',
  githubRepoName: '',
  isActive: true,
})

const demoConfigFormData = ref({
  branchName: '',
  demoPath: '/',
  subSiteFolders: '',
  displayName: '',
  subSiteDisplayName: '',
  description: '',
  isActive: true,
})

const hookFormData = ref<{ branch: string }>({
  branch: '',
})

// 當前操作的項目
const currentProject = ref<Project | null>(null)
const currentDemoConfig = ref<DemoConfig | null>(null)
const itemToDelete = ref<Project | DemoConfig | null>(null)
const deleteType = ref<'project' | 'demoConfig'>('project')

// 專案群組管理
const allGroups = ref<any[]>([])
const projectGroups = ref<any[]>([])
const selectedGroupIds = ref<number[]>([])

// 獲取角色標籤
const getRoleLabel = (role: string) => {
  const roleLabels: Record<string, string> = {
    viewer: '檢視者',
    editor: '編輯者',
    admin: '管理員',
  }
  return roleLabels[role] || role
}

// 計算可用群組（排除已經在專案中的群組）
const availableGroups = computed(() => {
  if (!projectGroups.value) return allGroups.value
  const currentGroupIds = projectGroups.value.map((g) => g.id) || []
  return allGroups.value.filter((group) => !currentGroupIds.includes(group.id))
})

// 組件掛載時載入數據
onMounted(() => {
  loadData()
})

// 載入所有數據
const loadData = async () => {
  isLoading.value = true
  try {
    const [projectsResponse, groupsResponse] = await Promise.all([apiService.getProjects(), api.get('/admin/groups')])
    projects.value = projectsResponse.data.data
    allGroups.value = groupsResponse.data.data
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

// 更新當前專案數據
const updateCurrentProject = () => {
  if (!currentProject.value) return

  // 從重新載入的專案列表中找到對應的專案
  const updatedProject = projects.value.find((p) => p.id === currentProject.value!.id)
  if (updatedProject) {
    currentProject.value = updatedProject
  }
}

// 群組管理方法
const manageProjectGroups = async (project: Project) => {
  currentProject.value = project
  showManageProjectGroupsModal.value = true

  try {
    const response = await api.get(`/admin/projects/${project.id}/groups`)
    projectGroups.value = response.data.data
  } catch (error: any) {
    console.error('載入專案群組失敗:', error)
    alert('載入專案群組失敗，請稍後再試')
  }
}

const removeProjectGroup = async (groupId: number) => {
  if (!currentProject.value) return

  if (!confirm('確定要移除此群組嗎？')) return

  isSubmitting.value = true
  try {
    await api.delete(`/admin/projects/${currentProject.value.id}/groups/${groupId}`)
    // 重新載入專案群組
    await manageProjectGroups(currentProject.value)
  } catch (error: any) {
    console.error('移除群組失敗:', error)
    const message = error.response?.data?.message || '移除失敗，請稍後再試'
    alert(message)
  } finally {
    isSubmitting.value = false
  }
}

const addSelectedGroups = async () => {
  if (!currentProject.value || selectedGroupIds.value.length === 0) return

  isSubmitting.value = true
  try {
    const data = {
      groupIds: selectedGroupIds.value,
    }
    await api.post(`/admin/projects/${currentProject.value.id}/groups`, data)
    selectedGroupIds.value = []
    // 重新載入專案群組
    await manageProjectGroups(currentProject.value)
  } catch (error: any) {
    console.error('添加群組失敗:', error)
    const message = error.response?.data?.message || '添加失敗，請稍後再試'
    alert(message)
  } finally {
    isSubmitting.value = false
  }
}

// 專案相關操作
const editProject = (project: Project) => {
  projectFormData.value = {
    name: project.name,
    description: project.description || '',
    githubRepoUrl: project.githubRepoUrl,
    githubRepoName: project.githubRepoName || '',
    isActive: project.isActive,
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

// 觸發專案 Hook
const triggerProjectHook = (project: Project) => {
  if (!project.isActive) {
    alert('專案未啟用，無法執行 Hook')
    return
  }
  currentProject.value = project
  hookFormData.value.branch = ''
  showTriggerHookModal.value = true
}

// Demo 配置相關操作
const editDemoConfig = (demoConfig: DemoConfig) => {
  demoConfigFormData.value = {
    branchName: demoConfig.branchName,
    demoPath: demoConfig.demoPath,
    subSiteFolders: demoConfig.subSiteFolders || '',
    displayName: demoConfig.displayName || '',
    subSiteDisplayName: demoConfig.subSiteDisplayName || '',
    description: demoConfig.description || '',
    isActive: demoConfig.isActive,
  }
  currentDemoConfig.value = demoConfig
  showEditDemoConfigModal.value = true
}

const deleteDemoConfig = (demoConfig: DemoConfig) => {
  itemToDelete.value = demoConfig
  deleteType.value = 'demoConfig'
  showDeleteModal.value = true
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

const closeManageProjectGroupsModal = () => {
  showManageProjectGroupsModal.value = false
  currentProject.value = null
  projectGroups.value = []
  selectedGroupIds.value = []
}

const closeTriggerHookModal = () => {
  showTriggerHookModal.value = false
  currentProject.value = null
  hookFormData.value.branch = ''
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
    githubRepoName: '',
    isActive: true,
  }
  currentProject.value = null
}

const resetDemoConfigForm = () => {
  demoConfigFormData.value = {
    branchName: '',
    demoPath: '/',
    subSiteFolders: '',
    displayName: '',
    subSiteDisplayName: '',
    description: '',
    isActive: true,
  }
  currentDemoConfig.value = null
}

// 提交專案表單
const submitProjectForm = async () => {
  isSubmitting.value = true
  try {
    if (showCreateProjectModal.value) {
      await apiService.createProject(projectFormData.value)
    } else if (showEditProjectModal.value && currentProject.value) {
      const updateData: UpdateProjectData = {
        name: projectFormData.value.name,
        description: projectFormData.value.description,
        githubRepoUrl: projectFormData.value.githubRepoUrl,
        githubRepoName: projectFormData.value.githubRepoName,
        isActive: projectFormData.value.isActive,
      }
      await apiService.updateProject(currentProject.value.id, updateData)
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
    } else if (showEditDemoConfigModal.value && currentDemoConfig.value) {
      // 使用解構賦值和明確的屬性
      const formData = demoConfigFormData.value
      const updateData: UpdateDemoConfigData = {
        branchName: formData.branchName,
        demoPath: formData.demoPath,
        subSiteFolders: formData.subSiteFolders,
        displayName: formData.displayName,
        subSiteDisplayName: formData.subSiteDisplayName,
        description: formData.description,
        isActive: formData.isActive,
      }
      await apiService.updateDemoConfig(currentDemoConfig.value.id, updateData)
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

// 提交觸發 Hook
const submitTriggerHook = async () => {
  if (!currentProject.value) return

  isTriggeringHook.value = true
  try {
    const branch = hookFormData.value.branch.trim() || undefined
    await apiService.triggerProjectHook(currentProject.value.id, branch)
    closeTriggerHookModal()
    loadData()
  } catch (error: any) {
    console.error('觸發 Hook 失敗:', error)
    const message = error.response?.data?.message || '觸發 Hook 失敗，請稍後再試'
    alert(message)
  } finally {
    isTriggeringHook.value = false
  }
}

// 確認刪除
const confirmDelete = async () => {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    if (deleteType.value === 'project') {
      await apiService.deleteProject((itemToDelete.value as Project).id)
    } else {
      await apiService.deleteDemoConfig((itemToDelete.value as DemoConfig).id)
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
    failed: '部署失敗',
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW')
}
</script>

<style scoped>
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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

.github-repo-name {
  color: #28a745;
  font-size: 12px;
  font-weight: 500;
  background: #d4edda;
  padding: 2px 6px;
  border-radius: 4px;
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

.demo-config-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.trigger-hook-button,
.edit-demo-button,
.delete-demo-button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.trigger-hook-button {
  background: #17a2b8;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.trigger-hook-button:hover:not(:disabled) {
  background: #138496;
}

.trigger-hook-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.manage-users-button {
  background: #6f42c1;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
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

.checkbox-label input[type='checkbox'] {
  width: auto;
  margin: 0;
}

.form-help-text {
  display: block;
  margin-top: 4px;
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
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

.user-checkbox-label input[type='checkbox'] {
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

.hook-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.5;
}

.hook-warning {
  background: #fff3cd;
  color: #856404;
  padding: 12px;
  border-radius: 6px;
  margin: 0;
  font-size: 14px;
  border: 1px solid #ffeaa7;
}

.delete-modal .delete-button {
  background: #dc3545;
  color: white;
}

.delete-modal .delete-button:hover:not(:disabled) {
  background: #c82333;
}

/* 群組選擇表格樣式 */
.groups-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0;
  background: white;
}

.groups-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.group-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #e0e0e0;
}

.group-row:hover {
  background-color: #f8f9fa;
}

.group-row:last-child {
  border-bottom: none;
}

.checkbox-cell {
  width: 40px;
  padding: 12px 8px;
  vertical-align: middle;
  text-align: center;
}

.group-info-cell {
  padding: 12px 8px;
  vertical-align: middle;
  word-wrap: break-word;
}

.group-checkbox {
  margin: 0;
  transform: scale(1.1);
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-name {
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.admin-badge {
  display: inline-block;
  background: #dc3545;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  margin-right: 8px;
}

.group-role {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.group-description {
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  margin-top: 2px;
}
</style>
