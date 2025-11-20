<template>
  <div class="inner-wrapper">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>群組管理</h1>
        </div>
        <div class="header-right">
          <button @click="showCreateGroupModal = true" class="btn btn-md btn-primary">
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
            <span>新增群組</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 主要內容區域：左右分欄 -->
    <div class="page-main main-content">
      <!-- 左側：群組列表 -->
      <div class="groups-panel">
        <h2>群組列表</h2>
        <div class="groups-list">
          <div
            v-for="group in groups"
            :key="group.id"
            class="card group-card"
            :class="{ active: selectedGroup?.id === group.id }"
            @click="selectGroup(group)"
          >
            <div class="group-header">
              <h3>{{ group.name }}</h3>
              <div class="group-badges">
                <span v-if="group.isAdminGroup" class="badge badge-admin">管理員</span>
                <span class="badge badge-users">{{ group.users?.length || 0 }} 人</span>
              </div>
            </div>

            <div class="group-info">
              <p v-if="group.description" class="group-description">{{ group.description }}</p>
              <div class="group-role">
                <span class="role-badge" :class="`role-${group.role}`">
                  {{ getRoleLabel(group.role) }}
                </span>
              </div>
            </div>

            <div class="group-actions">
              <button @click.stop="editGroup(group)" class="btn btn-sm btn-secondary"> 編輯 </button>
              <button @click.stop="deleteGroup(group.id)" class="btn btn-sm btn-danger" :disabled="group.isAdminGroup">
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：選中群組的使用者管理 -->
      <div class="users-panel">
        <div v-if="selectedGroup">
          <div class="users-panel-header">
            <h2>{{ selectedGroup.name }} - 使用者管理</h2>
            <button @click="showAddUserModal(selectedGroup)" class="btn btn-md btn-outline"> 新增使用者 </button>
          </div>
          <!-- 使用者列表 -->
          <div class="users-list">
            <div v-for="user in selectedGroup.users" :key="user.id" class="user-item">
              <div class="user-info">
                <span class="user-name">{{ user.username }}</span>
              </div>
              <button @click="removeUserFromGroup(selectedGroup.id, user.id)" class="btn btn-sm btn-outline-danger">
                移除
              </button>
            </div>
            <div v-if="!selectedGroup.users || selectedGroup.users.length === 0" class="no-users"> 暫無使用者 </div>
          </div>
        </div>

        <div v-else class="no-selection">
          <p>請選擇一個群組來管理使用者</p>
        </div>
      </div>
    </div>

    <!-- 新增/編輯群組模態框 -->
    <div v-if="showCreateGroupModal || showEditGroupModal" class="modal-overlay">
      <div class="modal">
        <h3>{{ showCreateGroupModal ? '新增群組' : '編輯群組' }}</h3>
        <form @submit.prevent="saveGroup">
          <div class="form-group">
            <label>群組名稱</label>
            <input v-model="groupForm.name" type="text" required :disabled="editingGroup?.isAdminGroup" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="groupForm.description"></textarea>
          </div>
          <div class="form-group">
            <label>群組角色</label>
            <select v-model="groupForm.role">
              <option value="viewer">檢視者</option>
              <option value="editor">編輯者</option>
              <option value="admin">管理員</option>
            </select>
            <small class="form-help"> 管理員角色擁有所有專案權限，等同於管理員群組 </small>
          </div>
          <div class="action-buttons">
            <button type="button" @click="closeModals" class="btn btn-md btn-secondary"> 取消 </button>
            <button type="submit" class="btn btn-md btn-primary"> 儲存 </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 新增使用者模態框 -->
    <div v-if="showAddUserModalFlag" class="modal-overlay">
      <div class="modal large-modal">
        <h3>新增使用者到群組</h3>
        <form @submit.prevent="addUsersToGroup">
          <div class="form-group">
            <label>選擇使用者（可多選）</label>
            <div class="users-selection">
              <table class="users-table">
                <tbody>
                  <tr v-for="user in sortedAvailableUsers" :key="user.id" class="user-row">
                    <td class="checkbox-cell">
                      <input
                        type="checkbox"
                        :id="`user-${user.id}`"
                        :value="user.id"
                        v-model="selectedUserIds"
                        class="user-checkbox"
                      />
                    </td>
                    <td class="username-cell">
                      <label :for="`user-${user.id}`" class="username">{{ user.username }} ({{ user.email }})</label>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="sortedAvailableUsers.length === 0" class="no-users"> 沒有可新增的使用者 </div>
            </div>
          </div>
          <div class="action-buttons">
            <button type="button" @click="closeModals" class="btn btn-md btn-secondary"> 取消 </button>
            <button type="submit" :disabled="selectedUserIds.length === 0" class="btn btn-md btn-primary">
              {{ selectedUserIds.length > 0 ? `新增 ${selectedUserIds.length} 個使用者` : '新增' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

// 定義類型接口
interface User {
  id: number
  username: string
  email: string
}

interface Group {
  id: number
  name: string
  description?: string
  role: 'viewer' | 'editor' | 'admin'
  isAdminGroup?: boolean
  users?: User[]
}

interface GroupForm {
  name: string
  description: string
  role: 'viewer' | 'editor' | 'admin'
}

// 響應式數據
const groups = ref<Group[]>([])
const users = ref<User[]>([])
const selectedGroup = ref<Group | null>(null)
const showCreateGroupModal = ref(false)
const showEditGroupModal = ref(false)
const showAddUserModalFlag = ref(false)
const editingGroup = ref<Group | null>(null)
const currentGroup = ref<Group | null>(null)

// 表單數據
const groupForm = ref<GroupForm>({
  name: '',
  description: '',
  role: 'viewer',
})

const userForm = ref({
  userId: '',
})

// 多選使用者
const selectedUserIds = ref<number[]>([])

// 計算屬性
const availableUsers = computed(() => {
  if (!currentGroup.value) return users.value
  const groupUserIds = currentGroup.value.users?.map((u) => u.id) || []
  return users.value.filter((user) => !groupUserIds.includes(user.id))
})

// 按字母順序排列的可用使用者列表
const sortedAvailableUsers = computed(() => {
  return [...availableUsers.value].sort((a, b) => a.username.localeCompare(b.username))
})

// 方法
const loadGroups = async () => {
  try {
    const response = await api.get('/groups')
    groups.value = response.data.data
  } catch (error) {
    console.error('載入群組失敗:', error)
  }
}

const loadUsers = async () => {
  try {
    const response = await api.get('/admin/users')
    users.value = response.data.data
  } catch (error) {
    console.error('載入使用者失敗:', error)
  }
}

const saveGroup = async () => {
  try {
    if (showCreateGroupModal.value) {
      await api.post('/groups', groupForm.value)
    } else {
      if (editingGroup.value) {
        await api.put(`/groups/${editingGroup.value.id}`, groupForm.value)
      }
    }
    await loadGroups()
    closeModals()
  } catch (error) {
    console.error('儲存群組失敗:', error)
  }
}

const editGroup = (group: Group) => {
  editingGroup.value = group
  groupForm.value = {
    name: group.name,
    description: group.description || '',
    role: group.role || 'viewer',
  }
  showEditGroupModal.value = true
}

const deleteGroup = async (groupId: number) => {
  if (!confirm('確定要刪除這個群組嗎？')) return

  try {
    await api.delete(`/groups/${groupId}`)
    await loadGroups()
  } catch (error) {
    console.error('刪除群組失敗:', error)
  }
}

const showAddUserModal = (group: Group) => {
  currentGroup.value = group
  selectedUserIds.value = []
  showAddUserModalFlag.value = true
}

const addUsersToGroup = async () => {
  if (!currentGroup.value || selectedUserIds.value.length === 0) return

  try {
    // 批量新增使用者到群組
    for (const userId of selectedUserIds.value) {
      await api.post(`/groups/${currentGroup.value.id}/users`, { userId })
    }
    await loadGroups()
    closeModals()
  } catch (error) {
    console.error('新增使用者到群組失敗:', error)
  }
}

const removeUserFromGroup = async (groupId: number, userId: number) => {
  if (!confirm('確定要從群組中移除這個使用者嗎？')) return

  try {
    await api.delete(`/groups/${groupId}/users/${userId}`)
    await loadGroups()
    // 如果移除的是當前選中群組的使用者，更新選中群組
    if (selectedGroup.value?.id === groupId) {
      selectedGroup.value = groups.value.find((g) => g.id === groupId) || null
    }
  } catch (error) {
    console.error('從群組移除使用者失敗:', error)
  }
}

// 選擇群組
const selectGroup = (group: Group) => {
  selectedGroup.value = group
}

// 獲取角色標籤
const getRoleLabel = (role: string) => {
  const roleLabels: Record<string, string> = {
    viewer: '檢視者',
    editor: '編輯者',
    admin: '管理員',
  }
  return roleLabels[role] || role
}

const closeModals = () => {
  showCreateGroupModal.value = false
  showEditGroupModal.value = false
  showAddUserModalFlag.value = false
  editingGroup.value = null
  currentGroup.value = null
  groupForm.value = { name: '', description: '', role: 'viewer' }
  selectedUserIds.value = []
}

// 生命週期
onMounted(() => {
  loadGroups()
  loadUsers()
})
</script>

<style scoped>
.main-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 70.4px);
  padding-left: 0;
}

.groups-panel {
  flex: 0 0 300px;
  border-right: 1px solid #e0e0e0;
}

.groups-panel h2 {
  margin-bottom: 20px;
  margin-left: 20px;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 2px 20px 20px 20px;
}

.users-panel {
  flex: 1;
}

.users-panel h2 {
  margin-bottom: 20px;
}

.users-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.group-card {
  padding: 12px;
}

.group-card.active {
  border-color: #007bff;
  background: #f8f9ff;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.group-actions {
  display: flex;
  gap: 10px;
}

.group-info {
  margin-bottom: 20px;
}

.group-badges {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.badge-admin {
  background: #dc3545;
  color: white;
}

.badge-users {
  background: #007bff;
  color: white;
}

.badge-projects {
  background: #28a745;
  color: white;
}

.users-list,
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item,
.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.user-role,
.project-role {
  font-size: 12px;
  color: #666;
  text-transform: capitalize;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.action-buttons {
  justify-content: flex-end;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-outline-primary {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 使用者相關樣式 */
.users-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}

.user-info {
  flex-direction: column;
  flex: 1;
  align-items: flex-start;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-email {
  font-size: 12px;
  color: #666;
}

.group-description {
  font-size: 14px;
  color: #666;
  margin: 5px 0;
  line-height: 1.4;
}

.no-users {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

/* 多選使用者樣式 */
.large-modal {
  max-width: 600px;
}

.users-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.user-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-row:hover {
  background-color: #f8f9fa;
}

.checkbox-cell {
  width: 30px;
  padding: 4px 8px;
  vertical-align: middle;
}

.username-cell {
  padding: 4px 8px;
}

.user-checkbox {
  margin: 0;
}

.username {
  margin: 0;
  cursor: pointer;
}

.form-help {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}

/* 角色標籤樣式 */
.group-role {
  margin-top: 8px;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.role-viewer {
  background-color: #e3f2fd;
  color: #1976d2;
}

.role-editor {
  background-color: #fff3e0;
  color: #f57c00;
}

.role-admin {
  background-color: #ffebee;
  color: #d32f2f;
}
</style>
