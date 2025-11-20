<template>
  <n-layout-sider
    :collapsed="collapsed"
    :collapsed-width="64"
    :width="240"
    show-trigger
    collapse-mode="width"
    :collapsed-icon-size="20"
    :inverted="false"
    bordered
    class="fixed-sidebar"
    @collapse="handleCollapse"
    @expand="handleExpand"
  >
    <div class="sidebar-header">
      <div class="sidebar-header-content" :class="{ collapsed: collapsed }">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path fill="var(--color-primary)" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <n-text v-if="!collapsed" strong class="text-lg font-semibold">網站管理</n-text>
      </div>
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
        <n-text v-if="!collapsed" class="text-sm text-secondary"> 歡迎，{{ user?.username || '使用者' }} </n-text>
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
                <path
                  fill="currentColor"
                  d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"
                />
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
import { computed, ref, h, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NIcon, NLayoutSider, NMenu, NSpace, NText } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { apiService, type User } from '@/api'

const router = useRouter()
const route = useRoute()

// 定義 emit
const emit = defineEmits<{
  'update:collapsed': [collapsed: boolean]
}>()

const collapsed = ref(true)
const user = ref<User | null>(null)

// 處理收合狀態變化
const handleCollapse = () => {
  collapsed.value = true
  emit('update:collapsed', true)
}

const handleExpand = () => {
  collapsed.value = false
  emit('update:collapsed', false)
}

// 獲取用戶信息
const getUserInfo = () => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
  } else {
    user.value = null
  }
}

// 監聽localStorage變化
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'user') {
    getUserInfo()
  }
}

// 監聽自定義事件（用於OIDC回調後的用戶信息更新）
const handleUserUpdate = () => {
  getUserInfo()
}

// 初始化用戶信息
getUserInfo()

// 組件掛載時添加事件監聽
onMounted(() => {
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('userUpdated', handleUserUpdate)
})

// 組件卸載時移除事件監聽
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('userUpdated', handleUserUpdate)
})

// 當前路由
const currentRoute = computed(() => route.name as string)

// 創建圖標組件
const DashboardIcon = () =>
  h(NIcon, null, {
    default: () =>
      h('svg', { viewBox: '0 0 24 24' }, [
        h('path', {
          fill: 'currentColor',
          d: 'M10 13C10.5523 13 11 13.4477 11 14V21C11 21.5523 10.5523 22 10 22H3C2.44772 22 2 21.5523 2 21V14C2 13.4477 2.44772 13 3 13H10ZM21 13C21.5523 13 22 13.4477 22 14V21C22 21.5523 21.5523 22 21 22H14C13.4477 22 13 21.5523 13 21V14C13 13.4477 13.4477 13 14 13H21ZM4 20H9V15H4V20ZM15 20H20V15H15V20ZM10 2C10.5523 2 11 2.44772 11 3V10C11 10.5523 10.5523 11 10 11H3C2.44772 11 2 10.5523 2 10V3C2 2.44772 2.44772 2 3 2H10ZM21 2C21.5523 2 22 2.44772 22 3V10C22 10.5523 21.5523 11 21 11H14C13.4477 11 13 10.5523 13 10V3C13 2.44772 13.4477 2 14 2H21ZM4 9H9V4H4V9ZM15 9H20V4H15V9Z',
        }),
      ]),
  })

const UserIcon = () =>
  h(NIcon, null, {
    default: () =>
      h('svg', { viewBox: '0 0 24 24' }, [
        h('path', {
          fill: 'currentColor',
          d: 'M16 14C17.3261 14 18.5975 14.5272 19.5352 15.4648C20.4728 16.4025 21 17.6739 21 19V21C21 21.5523 20.5523 22 20 22C19.4477 22 19 21.5523 19 21V19C19 18.2044 18.6837 17.4415 18.1211 16.8789C17.6289 16.3867 16.9835 16.0829 16.2969 16.0146L16 16H8C7.20435 16 6.44152 16.3163 5.87891 16.8789C5.3163 17.4415 5 18.2044 5 19V21C5 21.5523 4.55228 22 4 22C3.44772 22 3 21.5523 3 21V19C3 17.6739 3.52716 16.4025 4.46484 15.4648C5.40253 14.5272 6.67392 14 8 14H16ZM12 2C14.7614 2 17 4.23858 17 7C17 9.76142 14.7614 12 12 12C9.23858 12 7 9.76142 7 7C7 4.23858 9.23858 2 12 2ZM12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4Z',
        }),
      ]),
  })

const ProjectIcon = () =>
  h(NIcon, null, {
    default: () =>
      h('svg', { viewBox: '0 0 24 24' }, [
        h('path', {
          fill: 'currentColor',
          d: 'M20 8C20.5523 8 21 8.44772 21 9C21 9.55228 20.5523 10 20 10H4C3.44772 10 3 9.55228 3 9C3 8.44772 3.44772 8 4 8H20Z',
        }),
        h('path', {
          fill: 'currentColor',
          d: 'M20 14C20.5523 14 21 14.4477 21 15C21 15.5523 20.5523 16 20 16H4C3.44772 16 3 15.5523 3 15C3 14.4477 3.44772 14 4 14H20Z',
        }),
        h('path', {
          fill: 'currentColor',
          d: 'M10.1107 2.00619C10.6596 2.06717 11.0554 2.56182 10.9945 3.11068L8.99447 21.1107C8.93348 21.6596 8.43884 22.0554 7.88998 21.9945C7.34111 21.9335 6.94526 21.4388 7.00619 20.89L9.00619 2.88998C9.06717 2.34111 9.56182 1.94526 10.1107 2.00619Z',
        }),
        h('path', {
          fill: 'currentColor',
          d: 'M16.1107 2.00619C16.6596 2.06717 17.0554 2.56182 16.9945 3.11068L14.9945 21.1107C14.9335 21.6596 14.4388 22.0554 13.89 21.9945C13.3411 21.9335 12.9453 21.4388 13.0062 20.89L15.0062 2.88998C15.0672 2.34111 15.5618 1.94526 16.1107 2.00619Z',
        }),
      ]),
  })

const HookLogIcon = () =>
  h(NIcon, null, {
    default: () =>
      h('svg', { viewBox: '0 0 24 24' }, [
        h('path', {
          fill: 'currentColor',
          d: 'M14 1C14.0864 1 14.17 1.01163 14.25 1.03223C14.2588 1.0345 14.2676 1.03655 14.2764 1.03906C14.3259 1.0533 14.3738 1.0714 14.4199 1.09277C14.4252 1.09522 14.4303 1.09805 14.4355 1.10059C14.4819 1.12307 14.5263 1.14864 14.5684 1.17773C14.5747 1.1821 14.5807 1.18689 14.5869 1.19141C14.6295 1.22234 14.6699 1.25586 14.707 1.29297L20.707 7.29297C20.8662 7.45212 20.9719 7.6646 20.9951 7.90137C20.9984 7.934 21 7.96692 21 8V20C21 20.7957 20.6837 21.5585 20.1211 22.1211C19.5585 22.6837 18.7957 23 18 23H6C5.20435 23 4.44152 22.6837 3.87891 22.1211C3.3163 21.5585 3 20.7956 3 20V4C3 3.20435 3.3163 2.44152 3.87891 1.87891C4.44152 1.3163 5.20435 1 6 1H14ZM6 3C5.73478 3 5.48051 3.10543 5.29297 3.29297C5.10543 3.48051 5 3.73478 5 4V20C5 20.2652 5.10543 20.5195 5.29297 20.707C5.48051 20.8946 5.73478 21 6 21H18C18.2652 21 18.5195 20.8946 18.707 20.707C18.8946 20.5195 19 20.2652 19 20V9H14C13.4477 9 13 8.55228 13 8V3H6ZM16 16C16.5523 16 17 16.4477 17 17C17 17.5523 16.5523 18 16 18H8C7.44772 18 7 17.5523 7 17C7 16.4477 7.44772 16 8 16H16ZM16 12C16.5523 12 17 12.4477 17 13C17 13.5523 16.5523 14 16 14H8C7.44772 14 7 13.5523 7 13C7 12.4477 7.44772 12 8 12H16ZM10 8C10.5523 8 11 8.44772 11 9C11 9.55228 10.5523 10 10 10H8C7.44772 10 7 9.55228 7 9C7 8.44772 7.44772 8 8 8H10ZM15 7H17.5859L15 4.41406V7Z',
        }),
      ]),
  })

const UserGuideIcon = () =>
  h(NIcon, null, {
    default: () =>
      h('svg', { viewBox: '0 0 24 24' }, [
        h('path', {
          fill: 'currentColor',
          d: 'M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1ZM12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12 11C12.5523 11 13 11.4477 13 12V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V12C11 11.4477 11.4477 11 12 11ZM12.0098 7C12.5621 7 13.0098 7.44772 13.0098 8C13.0098 8.55228 12.5621 9 12.0098 9H12C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7H12.0098Z',
        }),
      ]),
  })

const GroupIcon = () =>
  h(NIcon, null, {
    default: () =>
      h('svg', { viewBox: '0 0 24 24' }, [
        h('path', {
          fill: 'currentColor',
          d: 'M13 14C14.3261 14 15.5975 14.5272 16.5352 15.4648C17.4728 16.4025 18 17.6739 18 19V21C18 21.5523 17.5523 22 17 22C16.4477 22 16 21.5523 16 21V19C16 18.2044 15.6837 17.4415 15.1211 16.8789C14.6289 16.3867 13.9835 16.0829 13.2969 16.0146L13 16H5C4.20435 16 3.44152 16.3163 2.87891 16.8789C2.3163 17.4415 2 18.2044 2 19V21C2 21.5523 1.55228 22 1 22C0.447715 22 0 21.5523 0 21V19C0 17.6739 0.527162 16.4025 1.46484 15.4648C2.40253 14.5272 3.67392 14 5 14H13ZM19.0322 14.8789C19.1703 14.3442 19.7153 14.0231 20.25 14.1611C21.3225 14.4381 22.2735 15.063 22.9521 15.9385C23.6307 16.8139 23.9991 17.8904 24 18.998V20.999C23.9998 21.5511 23.5521 21.9989 23 21.999C22.4478 21.999 22.0002 21.5512 22 20.999V19L21.9893 18.752C21.9411 18.1759 21.7274 17.6238 21.3711 17.1641C20.9639 16.6388 20.3935 16.2629 19.75 16.0967C19.2154 15.9586 18.8943 15.4136 19.0322 14.8789ZM9 2C11.7614 2 14 4.23858 14 7C14 9.76142 11.7614 12 9 12C6.23858 12 4 9.76142 4 7C4 4.23858 6.23858 2 9 2ZM15.0312 2.88086C15.1683 2.34603 15.7132 2.02337 16.248 2.16016C17.3235 2.43551 18.2773 3.06161 18.958 3.93848C19.6385 4.81534 20.0078 5.89398 20.0078 7.00391L20.0039 7.21191C19.9608 8.24812 19.5959 9.2473 18.958 10.0693C18.2773 10.9463 17.3236 11.5723 16.248 11.8477C15.7131 11.9845 15.1682 11.6619 15.0312 11.127C14.8945 10.5921 15.2171 10.0472 15.752 9.91016C16.3972 9.74494 16.9695 9.36991 17.3779 8.84375C17.7352 8.38342 17.949 7.83011 17.9971 7.25293L18.0078 7.00391C18.0078 6.33786 17.7863 5.69021 17.3779 5.16406C16.9695 4.63804 16.3971 4.26284 15.752 4.09766C15.2171 3.96054 14.8943 3.41579 15.0312 2.88086ZM9 4C7.34315 4 6 5.34315 6 7C6 8.65685 7.34315 10 9 10C10.6569 10 12 8.65685 12 7C12 5.34315 10.6569 4 9 4Z',
        }),
      ]),
  })

const ImportExportIcon = () =>
  h(NIcon, null, {
    default: () =>
      h('svg', { viewBox: '0 0 24 24' }, [
        h('path', {
          fill: 'currentColor',
          d: 'M4.99992 21V5.41406L2.70696 7.70703C2.31643 8.09756 1.68342 8.09756 1.29289 7.70703C0.902369 7.31651 0.902369 6.68349 1.29289 6.29297L5.29289 2.29297L5.36907 2.22461C5.76184 1.90426 6.34084 1.92685 6.70696 2.29297L10.707 6.29297C11.0975 6.68349 11.0975 7.31651 10.707 7.70703C10.3164 8.09756 9.68342 8.09756 9.29289 7.70703L6.99992 5.41406V21C6.99992 21.5523 6.55221 22 5.99992 22C5.44764 22 4.99992 21.5523 4.99992 21ZM16.9999 3C16.9999 2.44772 17.4476 2 17.9999 2C18.5522 2 18.9999 2.44772 18.9999 3V18.5859L21.2929 16.293C21.6834 15.9024 22.3164 15.9024 22.707 16.293C23.0975 16.6835 23.0975 17.3165 22.707 17.707L18.707 21.707C18.3164 22.0976 17.6834 22.0976 17.2929 21.707L13.2929 17.707C12.9024 17.3165 12.9024 16.6835 13.2929 16.293C13.6834 15.9024 14.3164 15.9024 14.707 16.293L16.9999 18.5859V3Z',
        }),
      ]),
  })

// 選單選項 - 根據用戶權限動態生成
const menuOptions = computed(() => {
  const baseOptions: MenuOption[] = [
    {
      label: '儀表板',
      key: 'dashboard',
      icon: DashboardIcon,
    },
  ]

  // 只有管理員才能看到管理功能
  if (user.value && user.value.role === 'admin') {
    baseOptions.push(
      {
        label: '使用者管理',
        key: 'userManagement',
        icon: UserIcon,
      },
      {
        label: '群組管理',
        key: 'groupManagement',
        icon: GroupIcon,
      },
      {
        label: '專案管理',
        key: 'projectManagement',
        icon: ProjectIcon,
      },
      {
        label: 'Hook Log 管理',
        key: 'hookLogManagement',
        icon: HookLogIcon,
      },
      {
        label: '使用說明',
        key: 'userGuide',
        icon: UserGuideIcon,
      },
      {
        label: '資料匯入/匯出',
        key: 'importExport',
        icon: ImportExportIcon,
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
  } else if (key === 'userGuide') {
    console.log('導航到使用說明')
    router.push('/admin/user-guide')
  } else if (key === 'groupManagement') {
    console.log('導航到群組管理')
    router.push('/admin/groups')
  } else if (key === 'importExport') {
    console.log('導航到資料匯入/匯出')
    router.push('/admin/import-export')
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

    // 觸發自定義事件通知其他組件用戶信息已清除
    window.dispatchEvent(new CustomEvent('userUpdated'))

    // 重定向到登入頁
    router.push('/login')
  }
}
</script>

<style type="text/css" scoped>
/* 強制側邊欄固定定位 */
.fixed-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 10;
}

.sidebar-header {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border-primary);
  margin-bottom: var(--spacing-sm);
}

.sidebar-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 32px;
}

.sidebar-header-content.collapsed {
  gap: 0;
  justify-content: center;
}

.sidebar-header-content.collapsed svg {
  flex-shrink: 0;
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
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
