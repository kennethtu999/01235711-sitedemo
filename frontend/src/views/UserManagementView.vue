<template>
  <div class="user-management-container">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button @click="goBack" class="back-button">
            <span>←</span> 返回儀表板
          </button>
          <h1>使用者管理</h1>
        </div>
        <div class="header-right">
          <button @click="showCreateModal = true" class="create-button">
            + 新增使用者
          </button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <!-- 使用者列表 -->
      <div class="users-section">
        <div class="section-header">
          <h2>使用者列表</h2>
          <div class="section-actions">
            <button @click="refreshUsers" :disabled="isLoading" class="refresh-button">
              {{ isLoading ? '載入中...' : '重新整理' }}
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

        <div v-else class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>使用者名稱</th>
                <th>電子郵件</th>
                <th>角色</th>
                <th>狀態</th>
                <th>最後登入</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="user-row">
                <td class="username-cell">
                  <div class="user-info">
                    <span class="username">{{ user.username }}</span>
                    <span v-if="user.twoFactorEnabled" class="two-factor-badge">2FA</span>
                  </div>
                </td>
                <td class="email-cell">{{ user.email || '-' }}</td>
                <td class="role-cell">
                  <span :class="['role-badge', user.role]">{{ user.role === 'admin' ? '管理員' : '使用者' }}</span>
                </td>
                <td class="status-cell">
                  <span :class="['status-badge', user.isActive ? 'active' : 'inactive']">
                    {{ user.isActive ? '啟用' : '停用' }}
                  </span>
                </td>
                <td class="last-login-cell">
                  {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : '從未登入' }}
                </td>
                <td class="created-at-cell">{{ formatDate(user.createdAt) }}</td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button @click="editUser(user)" class="edit-button" title="編輯使用者">
                      編輯
                    </button>
                    <button 
                      @click="deleteUser(user)" 
                      class="delete-button" 
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
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showCreateModal ? '新增使用者' : '編輯使用者' }}</h3>
          <button @click="closeModal" class="close-button">×</button>
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
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="請輸入電子郵件"
            />
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
              <input
                v-model="formData.isActive"
                type="checkbox"
              />
              啟用帳號
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-button">
              取消
            </button>
            <button type="submit" :disabled="isSubmitting" class="submit-button">
              {{ isSubmitting ? '處理中...' : (showCreateModal ? '新增' : '更新') }}
            </button>
          </div>
        </form>
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
          <p>您確定要刪除使用者 <strong>{{ userToDelete?.username }}</strong> 嗎？</p>
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
  isActive: true
})

// 要刪除的使用者
const userToDelete = ref<User | null>(null)

// 計算屬性
const adminCount = computed(() => users.value.filter(user => user.role === 'admin').length)

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

// 返回儀表板
const goBack = () => {
  router.push('/dashboard')
}

// 編輯使用者
const editUser = (user: User) => {
  formData.value = {
    username: user.username,
    email: user.email || '',
    password: '',
    role: user.role as 'admin' | 'user',
    isActive: user.isActive
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
    isActive: true
  }
}

// 提交表單
const submitForm = async () => {
  isSubmitting.value = true
  try {
    if (showCreateModal.value) {
      // 新增使用者
      await apiService.createUser(formData.value)
      alert('使用者新增成功')
    } else if (showEditModal.value && userToDelete.value) {
      // 編輯使用者
      const updateData: UpdateUserData = {
        username: formData.value.username,
        email: formData.value.email,
        role: formData.value.role,
        isActive: formData.value.isActive
      }
      
      // 只有當密碼不為空時才更新密碼
      if (formData.value.password) {
        updateData.password = formData.value.password
      }
      
      await apiService.updateUser(userToDelete.value.id, updateData)
      alert('使用者更新成功')
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
    alert('使用者刪除成功')
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

<style scoped>
.user-management-container {
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

.users-section {
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

.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.users-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.users-table td {
  font-size: 14px;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
}

.two-factor-badge {
  background: #17a2b8;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.admin {
  background: #dc3545;
  color: white;
}

.role-badge.user {
  background: #6c757d;
  color: white;
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

.action-buttons {
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

.delete-button:hover:not(:disabled) {
  background: #c82333;
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
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

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-button,
.submit-button {
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
  
  .users-table-container {
    font-size: 12px;
  }
  
  .users-table th,
  .users-table td {
    padding: 8px 12px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
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
  
  .users-table th,
  .users-table td {
    padding: 16px 20px;
    font-size: 15px;
  }
  
  .modal-content {
    max-width: 600px;
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
  
  .users-table th,
  .users-table td {
    padding: 18px 24px;
    font-size: 16px;
  }
  
  .modal-content {
    max-width: 700px;
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
  
  .users-table th,
  .users-table td {
    padding: 20px 28px;
    font-size: 17px;
  }
  
  .modal-content {
    max-width: 800px;
  }
}
</style>
