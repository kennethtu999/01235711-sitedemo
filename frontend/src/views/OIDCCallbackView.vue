<template>
  <div class="callback-container">
    <n-card class="callback-card" :bordered="false">
      <template #header>
        <div class="callback-header">
          <h1 class="page-title">正在處理登入...</h1>
          <p class="page-subtitle">請稍候，我們正在驗證您的身份</p>
        </div>
      </template>
      
      <div class="callback-content">
        <n-spin size="large" />
        <p class="loading-text">{{ loadingMessage }}</p>
      </div>
      
      <n-alert 
        v-if="errorMessage" 
        type="error" 
        :show-icon="true"
        class="error-alert"
      >
        {{ errorMessage }}
      </n-alert>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NCard, NSpin, NAlert } from 'naive-ui'
import { apiService } from '@/api'

const router = useRouter()
const route = useRoute()

// 狀態管理
const loadingMessage = ref('正在驗證身份...')
const errorMessage = ref('')

// 處理 OIDC 回調
const handleOIDCCallback = async () => {
  try {
    // 從 URL 參數中獲取 token 和 success 狀態
    const { token, success, error, error_description } = route.query
    
    // 檢查是否有錯誤
    if (error) {
      const errorMsg = Array.isArray(error_description) 
        ? error_description[0] || error_description.join(', ')
        : error_description
      const fallbackError = Array.isArray(error) 
        ? error[0] || error.join(', ')
        : error
      throw new Error(errorMsg || fallbackError)
    }
    
    // 檢查是否成功並有 token
    if (success === 'true' && token) {
      loadingMessage.value = '正在完成登入...'
      
      // 存儲 token
      localStorage.setItem('token', token as string)
      
      // 驗證 token 並獲取用戶資訊
      try {
        const response = await apiService.getCurrentUser()
        const user = response.data.user
        
        // 存儲用戶資訊
        localStorage.setItem('user', JSON.stringify(user))
        
        // 觸發自定義事件通知其他組件用戶信息已更新
        window.dispatchEvent(new CustomEvent('userUpdated'))
        
        loadingMessage.value = '登入成功！'
        
        // 延遲一下再跳轉，讓用戶看到成功訊息並確保所有組件都已更新
        setTimeout(() => {
          // 使用 replace 而不是 push，避免用戶可以返回到回調頁面
          router.replace('/dashboard')
        }, 1000)
        
        return
      } catch (error) {
        // Token 無效，清除本地存儲
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        throw new Error('Token 驗證失敗')
      }
    } else {
      throw new Error('缺少必要的認證參數')
    }
    
  } catch (error: unknown) {
    console.error('OIDC 回調處理失敗:', error)
    
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '登入失敗，請稍後再試'
    }
    
    loadingMessage.value = '登入失敗'
    
    // 3 秒後跳轉回登入頁面
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
}

// 組件掛載時處理回調
onMounted(() => {
  handleOIDCCallback()
})
</script>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-page-sm);
}

.callback-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.callback-header {
  text-align: center;
}

.callback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  margin: var(--spacing-lg) 0;
}

.loading-text {
  margin: 0;
  color: var(--text-color-secondary);
}

.error-alert {
  margin-top: var(--spacing-md);
}

/* 響應式設計 */
@media (max-width: 480px) {
  .callback-container {
    padding: var(--spacing-sm);
  }
}

/* 大螢幕優化 */
@media (min-width: 768px) {
  .callback-card {
    max-width: 450px;
  }
}
</style>
