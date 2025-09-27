import axios from 'axios'

// 創建 axios 實例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 請求攔截器 - 添加 JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 響應攔截器 - 處理錯誤
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期或無效，清除本地存儲並重定向到登入頁
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // 觸發自定義事件通知其他組件用戶信息已清除
      window.dispatchEvent(new CustomEvent('userUpdated'))
      
      // 使用 router 進行導航，避免頁面刷新
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// 類型定義
export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: {
    id: number
    username: string
    role: string
    email: string
    name?: string
    loginMethod?: string
    lastLoginAt: string
  }
}

export interface OIDCProvider {
  name: string
  displayName: string
  authUrl: string
}

export interface OIDCProvidersResponse {
  providers: OIDCProvider[]
}

export interface OIDCAuthResponse {
  authUrl: string
}

export interface User {
  id: number
  username: string
  role: string
  email: string
  isActive: boolean
  twoFactorEnabled: boolean
  lastLoginAt: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: number
  name: string
  description: string
  githubRepoUrl: string
  githubRepoName: string
  isActive: boolean
  lastSyncAt: string
  createdAt: string
  updatedAt: string
  demoConfigs?: DemoConfig[]
  authorizedUsers?: ProjectUser[]
}

export interface ProjectUser {
  id: number
  projectId: number
  userId: number
  grantedAt: string
  grantedBy: number
  role: 'viewer' | 'editor' | 'admin'
  user?: User
}

export interface DemoConfig {
  id: number
  projectId: number
  branchName: string
  demoPath: string
  subSiteFolders?: string
  displayName: string
  description: string
  deploymentStatus: 'pending' | 'deploying' | 'success' | 'failed'
  lastDeploymentTime: string
  deploymentError: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  demoUrl?: string
  demoUrls?: Array<{ name: string; url: string }>
}

export interface CreateUserData {
  username: string
  password: string
  email?: string
  role?: 'admin' | 'user'
}

export interface UpdateUserData {
  username?: string
  password?: string
  email?: string
  role?: 'admin' | 'user'
  isActive?: boolean
}

export interface CreateProjectData {
  name: string
  description?: string
  githubRepoUrl: string
  githubRepoName: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  githubRepoUrl?: string
  githubRepoName?: string
  isActive?: boolean
}

export interface CreateDemoConfigData {
  branchName: string
  demoPath?: string
  subSiteFolders?: string
  displayName?: string
  description?: string
}

export interface UpdateDemoConfigData {
  branchName?: string
  demoPath?: string
  subSiteFolders?: string
  displayName?: string
  description?: string
  isActive?: boolean
}

export interface AddProjectUsersData {
  userIds: number[]
  role?: 'viewer' | 'editor' | 'admin'
}

export interface UpdateProjectUserRoleData {
  role: 'viewer' | 'editor' | 'admin'
}

export interface HookLog {
  id: number
  projectId: number
  projectName: string
  githubRepoName: string
  branch: string
  startDateTime: string
  endDateTime?: string
  status: 'pending' | 'success' | 'failed'
  webhookEventType?: string
  repositoryFullName?: string
  errorMessage?: string
  deploymentResults?: any
  processingTimeMs?: number
  createdAt: string
  updatedAt: string
}

export interface HookLogStats {
  total: number
  success: number
  failed: number
  pending: number
  successRate: string
  avgProcessingTimeMs: number
  period: string
}

export interface HookLogsResponse {
  success: boolean
  data: {
    hookLogs: HookLog[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

export interface HookLogResponse {
  success: boolean
  data: HookLog
}

export interface HookLogStatsResponse {
  success: boolean
  data: HookLogStats
}

export interface Group {
  id: number
  name: string
  description: string
  role: 'viewer' | 'editor' | 'admin'
  isActive: boolean
  isAdminGroup: boolean
  createdAt: string
  updatedAt: string
  users?: User[]
}

export interface CreateGroupData {
  name: string
  description?: string
  role?: 'viewer' | 'editor' | 'admin'
}

export interface UpdateGroupData {
  name?: string
  description?: string
  role?: 'viewer' | 'editor' | 'admin'
}

export interface AddUserToGroupData {
  userId: number
  role?: 'member'
}

// API 方法
export const apiService = {
  // 狀態檢查
  getStatus: () => api.get('/status'),
  
  // 認證相關
  login: (credentials: LoginCredentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  getUserProjects: () => api.get('/auth/projects'),
  
  // OIDC 認證相關
  getOIDCProviders: () => api.get('/auth/oidc/providers'),
  startOIDCAuth: (provider: string, redirectUrl?: string) => {
    const params = redirectUrl ? { redirect: redirectUrl } : {}
    return api.get(`/auth/oidc/${provider}`, { params })
  },
  
  // 使用者管理
  getUsers: () => api.get('/admin/users'),
  createUser: (userData: CreateUserData) => api.post('/admin/users', userData),
  updateUser: (id: number, userData: UpdateUserData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  
  // 專案管理
  getProjects: () => api.get('/admin/projects'),
  createProject: (projectData: CreateProjectData) => api.post('/admin/projects', projectData),
  updateProject: (id: number, projectData: UpdateProjectData) => api.put(`/admin/projects/${id}`, projectData),
  deleteProject: (id: number) => api.delete(`/admin/projects/${id}`),
  
  // Demo 配置管理
  createDemoConfig: (projectId: number, demoConfigData: CreateDemoConfigData) => 
    api.post(`/admin/projects/${projectId}/democonfigs`, demoConfigData),
  updateDemoConfig: (id: number, demoConfigData: UpdateDemoConfigData) => 
    api.put(`/admin/democonfigs/${id}`, demoConfigData),
  deleteDemoConfig: (id: number) => api.delete(`/admin/democonfigs/${id}`),
  
  // 專案授權管理
  addProjectUsers: (projectId: number, data: AddProjectUsersData) => 
    api.post(`/admin/projects/${projectId}/users`, data),
  updateProjectUserRole: (projectId: number, userId: number, data: UpdateProjectUserRoleData) => 
    api.put(`/admin/projects/${projectId}/users/${userId}`, data),
  removeProjectUser: (projectId: number, userId: number) => 
    api.delete(`/admin/projects/${projectId}/users/${userId}`),
  removeAllProjectUsers: (projectId: number) => 
    api.delete(`/admin/projects/${projectId}/users`),
  
  // Hook Log 管理
  getHookLogs: (params?: { page?: number; limit?: number; status?: string; projectId?: number }) => 
    api.get('/hook-logs', { params }),
  getHookLogById: (hookLogId: number) => 
    api.get(`/hook-logs/${hookLogId}`),
  getHookLogStats: (params?: { projectId?: number; days?: number }) => 
    api.get('/hook-logs/stats', { params }),
  reExecuteHookLog: (hookLogId: number) => 
    api.post(`/hook-logs/${hookLogId}/re-execute`),
  
  // 專案 Hook 執行
  triggerProjectHook: (projectId: number, branch?: string) => 
    api.post(`/admin/projects/${projectId}/trigger-hook`, { branch }),
  
  // 群組管理
  getGroups: () => api.get('/groups'),
  createGroup: (groupData: CreateGroupData) => api.post('/groups', groupData),
  updateGroup: (id: number, groupData: UpdateGroupData) => api.put(`/groups/${id}`, groupData),
  deleteGroup: (id: number) => api.delete(`/groups/${id}`),
  addUserToGroup: (groupId: number, data: AddUserToGroupData) => 
    api.post(`/groups/${groupId}/users`, data),
  removeUserFromGroup: (groupId: number, userId: number) => 
    api.delete(`/groups/${groupId}/users/${userId}`),
  getUserGroups: (userId: number) => api.get(`/groups/users/${userId}/groups`),
}

export default api

