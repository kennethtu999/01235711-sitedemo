<template>
  <n-layout-sider
    :collapsed="collapsed"
    :collapsed-width="64"
    :width="240"
    show-trigger
    collapse-mode="width"
    :collapsed-icon-size="22"
    :inverted="false"
    bordered
    @collapse="collapsed = true"
    @expand="collapsed = false"
  >
    <div class="sidebar-header">
      <n-space align="center" :size="collapsed ? 0 : 12">
        <n-icon size="24" color="var(--color-primary)">
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </n-icon>
        <n-text v-if="!collapsed" strong class="text-lg font-semibold">網站管理</n-text>
      </n-space>
    </div>

    <n-menu
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
      :value="currentRoute"
      @update:value="handleMenuSelect"
    />

    <!-- 用戶信息和登出按鈕 -->
    <div class="sidebar-footer">
      <n-space vertical size="small">
        <n-text v-if="!collapsed" class="text-sm text-secondary">
          歡迎，{{ user?.username || '使用者' }}
        </n-text>
        <n-button 
          type="error" 
          size="small" 
          :block="!collapsed"
          :style="{ width: collapsed ? '32px' : '100%' }"
          @click="handleLogout"
        >
          <template #icon>
            <n-icon>
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z" />
              </svg>
            </n-icon>
          </template>
          <span v-if="!collapsed">登出</span>
        </n-button>
      </n-space>
    </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NIcon, NLayoutSider, NMenu, NSpace, NText } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { apiService, type User } from '@/api'

const router = useRouter()
const route = useRoute()

const collapsed = ref(true)
const user = ref<User | null>(null)

// 獲取用戶信息
const getUserInfo = () => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
  }
}

// 初始化用戶信息
getUserInfo()

// 當前路由
const currentRoute = computed(() => route.name as string)

// 創建圖標組件
const DashboardIcon = () => h(NIcon, null, {
  default: () => h('svg', { viewBox: '0 0 24 24' }, [
    h('path', { fill: 'currentColor', d: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' })
  ])
})

const UserIcon = () => h(NIcon, null, {
  default: () => h('svg', { viewBox: '0 0 24 24' }, [
    h('path', { fill: 'currentColor', d: 'M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.37-2.01.99L12 10.5 10.01 7.99A2.5 2.5 0 0 0 8 7H5.46c-.8 0-1.54.37-2.01.99L1 14.37V16h2v6h2v-6h.5l1-6h2l1 6H10v6h2v-6h.5l1-6h2l1 6H16v6h2z' })
  ])
})

const ProjectIcon = () => h(NIcon, null, {
  default: () => h('svg', { viewBox: '0 0 24 24' }, [
    h('path', { fill: 'currentColor', d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' })
  ])
})

const HookLogIcon = () => h(NIcon, null, {
  default: () => h('svg', { viewBox: '0 0 24 24' }, [
    h('path', { fill: 'currentColor', d: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' })
  ])
})

// 選單選項 - 根據用戶權限動態生成
const menuOptions = computed(() => {
  const baseOptions: MenuOption[] = [
    {
      label: '儀表板',
      key: 'dashboard',
      icon: DashboardIcon
    }
  ]
  
  // 只有管理員才能看到管理功能
  if (user.value && user.value.role === 'admin') {
    baseOptions.push(
      {
        label: '使用者管理',
        key: 'userManagement',
        icon: UserIcon
      },
      {
        label: '專案管理',
        key: 'projectManagement',
        icon: ProjectIcon
      },
      {
        label: 'Hook Log 管理',
        key: 'hookLogManagement',
        icon: HookLogIcon
      }
    )
  }
  
  return baseOptions
})

// 處理選單選擇
const handleMenuSelect = (key: string) => {
  console.log('選單選擇:', key)
  console.log('用戶信息:', user.value)
  
  if (key === 'dashboard') {
    router.push('/dashboard')
  } else if (key === 'userManagement') {
    console.log('導航到使用者管理')
    router.push('/admin/users')
  } else if (key === 'projectManagement') {
    console.log('導航到專案管理')
    router.push('/admin/projects')
  } else if (key === 'hookLogManagement') {
    console.log('導航到 Hook Log 管理')
    router.push('/admin/hook-logs')
  }
}

// 處理登出
const handleLogout = async () => {
  try {
    // 調用後端登出 API
    await apiService.logout()
  } catch (error) {
    console.error('登出 API 調用失敗:', error)
    // 即使 API 調用失敗，也要清除本地存儲
  } finally {
    // 清除本地存儲
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 重定向到登入頁
    router.push('/login')
  }
}
</script>

<style scoped>
.sidebar-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-primary);
  margin-bottom: var(--spacing-sm);
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
  box-sizing: border-box;
}

:deep(.n-menu-item-content) {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
}

:deep(.n-menu-item-content--collapsed) {
  justify-content: center;
}

:deep(.n-layout-sider) {
  background: var(--color-bg-primary);
  position: relative;
}

:deep(.n-menu) {
  margin-bottom: 80px; /* 為底部用戶信息區域留出空間 */
}

:deep(.sidebar-footer .n-button) {
  min-width: unset;
  max-width: 100%;
}

:deep(.sidebar-footer .n-button--block) {
  width: 100% !important;
}
</style>