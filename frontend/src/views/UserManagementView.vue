<template>
  <div class="inner-wrapper">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>使用者管理</h1>
        </div>
        <div class="header-right">
          <button @click="showCreateModal = true" class="btn btn-md btn-primary">
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
            <span>新增使用者</span>
          </button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <!-- 使用者列表 -->
      <div class="panel">
        <div class="panel-header">
          <h2>使用者列表</h2>
          <div class="action-buttons">
            <button @click="refreshUsers" :disabled="isLoading" class="btn btn-md btn-secondary">
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
          <p>載入使用者資料中...</p>
        </div>

        <div v-else-if="users.length === 0" class="empty-state">
          <p>目前沒有使用者</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>使用者名稱</th>
                <th>電子郵件</th>
                <th>角色</th>
                <th>狀態</th>
                <th>最後登入</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>
                  <span>{{ user.username }}</span>
                  <span v-if="user.twoFactorEnabled" class="two-factor-badge">2FA</span>
                </td>
                <td>{{ user.email || '-' }}</td>
                <td>
                  <span :class="['role-badge', user.role]">{{ user.role === 'admin' ? '管理員' : '使用者' }}</span>
                </td>
                <td>
                  <span :class="['status-badge', user.isActive ? 'active' : 'inactive']">
                    {{ user.isActive ? '啟用' : '停用' }}
                  </span>
                </td>
                <td>
                  {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : '從未登入' }}
                </td>
                <td>
                  <div class="action-buttons">
                    <button @click="editUser(user)" class="btn btn-sm btn-outline" title="編輯使用者"> 編輯 </button>
                    <button
                      @click="deleteUser(user)"
                      class="btn btn-sm btn-danger"
                      title="刪除使用者"
                      :disabled="user.role === 'admin' && adminCount <= 1"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- 新增/編輯使用者模態框 -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ showCreateModal ? '新增使用者' : '編輯使用者' }}</h3>
          <button @click="closeModal" class="btn btn-sm btn-ghost">×</button>
        </div>

        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-group">
            <label for="username">使用者名稱 *</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              :disabled="showEditModal"
              placeholder="請輸入使用者名稱"
            />
          </div>

          <div class="form-group">
            <label for="email">電子郵件</label>
            <input id="email" v-model="formData.email" type="email" placeholder="請輸入電子郵件" />
          </div>

          <div class="form-group">
            <label for="password">{{ showCreateModal ? '密碼 *' : '新密碼 (留空則不修改)' }}</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              :required="showCreateModal"
              placeholder="請輸入密碼"
            />
          </div>

          <div class="form-group">
            <label for="role">角色</label>
            <select id="role" v-model="formData.role">
              <option value="user">使用者</option>
              <option value="admin">管理員</option>
            </select>
          </div>

          <div v-if="showEditModal" class="form-group">
            <label class="checkbox-label">
              <input v-model="formData.isActive" type="checkbox" />
              啟用帳號
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-md btn-secondary"> 取消 </button>
            <button type="submit" :disabled="isSubmitting" class="btn btn-md btn-primary">
              {{ isSubmitting ? '處理中...' : showCreateModal ? '新增' : '更新' }}
            </button>
          </div>
        </form>
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
          <p
            >您確定要刪除使用者 <strong>{{ userToDelete?.username }}</strong> 嗎？</p
          >
          <p class="warning-text">此操作無法復原。</p>
        </div>

        <div class="form-actions">
          <button @click="closeDeleteModal" class="btn btn-md btn-secondary"> 取消 </button>
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
import { apiService, type User, type CreateUserData, type UpdateUserData } from '@/api'

const router = useRouter()

// 狀態管理
const users = ref<User[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)

// 模態框狀態
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// 表單數據
const formData = ref<CreateUserData & UpdateUserData & { isActive: boolean }>({
  username: '',
  email: '',
  password: '',
  role: 'user',
  isActive: true,
})

// 要刪除的使用者
const userToDelete = ref<User | null>(null)

// 計算屬性
const adminCount = computed(() => users.value.filter((user) => user.role === 'admin').length)

// 組件掛載時載入使用者列表
onMounted(() => {
  loadUsers()
})

// 載入使用者列表
const loadUsers = async () => {
  isLoading.value = true
  try {
    const response = await apiService.getUsers()
    users.value = response.data.data
  } catch (error) {
    console.error('載入使用者失敗:', error)
    alert('載入使用者失敗，請稍後再試')
  } finally {
    isLoading.value = false
  }
}

// 重新整理使用者列表
const refreshUsers = () => {
  loadUsers()
}

// 編輯使用者
const editUser = (user: User) => {
  formData.value = {
    username: user.username,
    email: user.email || '',
    password: '',
    role: user.role as 'admin' | 'user',
    isActive: user.isActive,
  }
  userToDelete.value = user
  showEditModal.value = true
}

// 刪除使用者
const deleteUser = (user: User) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

// 關閉模態框
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

// 關閉刪除模態框
const closeDeleteModal = () => {
  showDeleteModal.value = false
  userToDelete.value = null
}

// 重置表單
const resetForm = () => {
  formData.value = {
    username: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true,
  }
}

// 提交表單
const submitForm = async () => {
  isSubmitting.value = true
  try {
    if (showCreateModal.value) {
      // 新增使用者
      await apiService.createUser(formData.value)
    } else if (showEditModal.value && userToDelete.value) {
      // 編輯使用者
      const updateData: UpdateUserData = {
        username: formData.value.username,
        email: formData.value.email,
        role: formData.value.role,
        isActive: formData.value.isActive,
      }

      // 只有當密碼不為空時才更新密碼
      if (formData.value.password) {
        updateData.password = formData.value.password
      }

      await apiService.updateUser(userToDelete.value.id, updateData)
    }

    closeModal()
    loadUsers()
  } catch (error: any) {
    console.error('操作失敗:', error)
    const message = error.response?.data?.message || '操作失敗，請稍後再試'
    alert(message)
  } finally {
    isSubmitting.value = false
  }
}

// 確認刪除
const confirmDelete = async () => {
  if (!userToDelete.value) return

  isDeleting.value = true
  try {
    await apiService.deleteUser(userToDelete.value.id)
    closeDeleteModal()
    loadUsers()
  } catch (error: any) {
    console.error('刪除失敗:', error)
    const message = error.response?.data?.message || '刪除失敗，請稍後再試'
    alert(message)
  } finally {
    isDeleting.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW')
}
</script>
