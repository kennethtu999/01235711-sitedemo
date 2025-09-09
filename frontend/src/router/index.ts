import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/users',
      name: 'userManagement',
      component: () => import('../views/UserManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/projects',
      name: 'projectManagement',
      component: () => import('../views/ProjectManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
  ],
})

// 導航守衛 - 檢查用戶是否已登入
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  
  // 如果路由需要認證但用戶未登入，重定向到登入頁
  if (to.meta.requiresAuth && !token) {
    next('/login')
  }
  // 如果路由需要管理員權限但用戶不是管理員，重定向到儀表板
  else if (to.meta.requiresAdmin && (!user || user.role !== 'admin')) {
    next('/dashboard')
  }
  // 如果用戶已登入但訪問登入頁，重定向到儀表板
  else if (to.name === 'login' && token) {
    next('/dashboard')
  }
  // 其他情況正常導航
  else {
    next()
  }
})

export default router
