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
      window.location.href = '/login'
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
    lastLoginAt: string
  }
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
}

export interface DemoConfig {
  id: number
  projectId: number
  branchName: string
  demoPath: string
  displayName: string
  description: string
  deploymentStatus: 'pending' | 'deploying' | 'success' | 'failed'
  lastDeploymentTime: string
  deploymentError: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  authorizedUsers?: User[]
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
}

export interface UpdateProjectData {
  name?: string
  description?: string
  githubRepoUrl?: string
  isActive?: boolean
}

export interface CreateDemoConfigData {
  branchName: string
  demoPath?: string
  displayName?: string
  description?: string
}

export interface UpdateDemoConfigData {
  branchName?: string
  demoPath?: string
  displayName?: string
  description?: string
  isActive?: boolean
}

// API 方法
export const apiService = {
  // 狀態檢查
  getStatus: () => api.get('/status'),
  
  // 認證相關
  login: (credentials: LoginCredentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  
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
  
  // Demo 配置授權管理
  addDemoConfigUsers: (demoConfigId: number, userIds: number[]) => 
    api.post(`/admin/democonfigs/${demoConfigId}/users`, { userIds }),
  removeDemoConfigUser: (demoConfigId: number, userId: number) => 
    api.delete(`/admin/democonfigs/${demoConfigId}/users/${userId}`),
}

export default api

