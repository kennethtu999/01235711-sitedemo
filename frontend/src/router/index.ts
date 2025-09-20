import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import OIDCCallbackView from '../views/OIDCCallbackView.vue'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/auth/oidc/callback',
      name: 'oidcCallback',
      component: OIDCCallbackView,
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
    {
      path: '/admin/hook-logs',
      name: 'hookLogManagement',
      component: () => import('../views/HookLogManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/user-guide',
      name: 'userGuide',
      component: () => import('../views/UserGuideView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/groups',
      name: 'groupManagement',
      component: () => import('../views/GroupManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/import-export',
      name: 'importExport',
      component: () => import('../views/ImportExportView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // Catch-all route for unmatched paths (including /)
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      redirect: '/login'
    },
  ],
})

// 導航守衛 - 檢查用戶是否已登入
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  
  console.log('路由守衛檢查:', {
    to: to.path,
    requiresAuth: to.meta.requiresAuth,
    requiresAdmin: to.meta.requiresAdmin,
    user: user,
    token: !!token
  })
  
  // 如果路由需要認證但用戶未登入，重定向到登入頁
  if (to.meta.requiresAuth && !token) {
    console.log('需要認證但未登入，重定向到登入頁')
    // 清除可能存在的無效token
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    next('/login')
  }
  // 如果路由需要管理員權限但用戶不是管理員，重定向到儀表板
  else if (to.meta.requiresAdmin && (!user || user.role !== 'admin')) {
    console.log('需要管理員權限但用戶不是管理員，重定向到儀表板')
    next('/dashboard')
  }
  // 如果用戶已登入但訪問登入頁，重定向到儀表板
  else if (to.name === 'login' && token) {
    console.log('已登入但訪問登入頁，重定向到儀表板')
    next('/dashboard')
  }
  // 其他情況正常導航
  else {
    console.log('正常導航到:', to.path)
    next()
  }
})

export default router
