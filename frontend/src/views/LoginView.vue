<template>
  <div class="login-container">
    <n-card class="login-card" :bordered="false">
      <template #header>
        <div class="login-header">
          <h1 class="page-title">網站管理</h1>
          <p class="page-subtitle">請登入以繼續</p>
        </div>
      </template>
      
      <n-form @submit.prevent="handleLogin" class="login-form">
        <n-form-item label="使用者名稱" required>
          <n-input
            v-model:value="loginForm.username"
            type="text"
            placeholder="請輸入使用者名稱"
            size="large"
            :disabled="isLoading"
          />
        </n-form-item>
        
        <n-form-item 
          label="密碼" 
          required
          :validation-status="passwordValidationStatus"
          :feedback="passwordFeedback"
        >
          <n-input
            v-model:value="loginForm.password"
            type="password"
            placeholder="請輸入密碼（至少10個字符）"
            size="large"
            :disabled="isLoading"
            show-password-on="click"
            @input="validatePassword"
            @keyup.enter="handleLogin"
          />
        </n-form-item>
        
        <n-form-item>
          <n-button 
            type="primary"
            size="large"
            block
            :loading="isLoading"
            @click="handleLogin"
            class="login-button"
          >
            {{ isLoading ? '登入中...' : '登入' }}
          </n-button>
        </n-form-item>
      </n-form>
      
      <!-- 分隔線 -->
      <n-divider>或</n-divider>
      
      <!-- OIDC 登入選項 -->
      <div class="oidc-login-section">
        <n-button 
          v-for="provider in oidcProviders"
          :key="provider.name"
          type="info"
          size="large"
          block
          :loading="isOIDCLoading"
          @click="handleOIDCLogin(provider)"
          class="oidc-button"
        >
          <template #icon>
            <n-icon>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path :d="getProviderIcon(provider.name)" fill="currentColor"/>
              </svg>
            </n-icon>
          </template>
          SSO 登入
        </n-button>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NAlert, NDivider, NIcon } from 'naive-ui'
import { apiService, type LoginCredentials, type OIDCProvider } from '@/api'

const router = useRouter()

// 表單數據
const loginForm = reactive({
  username: '',
  password: ''
})

// 狀態管理
const isLoading = ref(false)
const isOIDCLoading = ref(false)
const errorMessage = ref('')
const oidcProviders = ref<OIDCProvider[]>([])

// 密碼驗證狀態
const passwordValidationStatus = ref<'error' | 'warning' | 'success' | undefined>(undefined)
const passwordFeedback = ref('')

// 密碼驗證函數
const validatePassword = () => {
  const password = loginForm.password
  if (!password) {
    passwordValidationStatus.value = undefined
    passwordFeedback.value = ''
    return
  }
  
  if (password.length < 10) {
    passwordValidationStatus.value = 'error'
    passwordFeedback.value = `密碼長度不足，還需要 ${10 - password.length} 個字符`
  } else {
    passwordValidationStatus.value = 'success'
    passwordFeedback.value = '密碼長度符合要求'
  }
}

// 處理登入
const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // 驗證輸入
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      errorMessage.value = '請輸入使用者名稱和密碼'
      return
    }

    // 驗證密碼長度
    if (loginForm.password.length < 10) {
      errorMessage.value = '密碼必須至少10個字符'
      passwordValidationStatus.value = 'error'
      passwordFeedback.value = '密碼長度不足'
      return
    }

    // 發送登入請求
    const credentials: LoginCredentials = {
      username: loginForm.username.trim(),
      password: loginForm.password
    }

    const response = await apiService.login(credentials)
    const data = response.data

    // 檢查是否需要 2FA (階段五會處理)
    if (data.requires2FA) {
      errorMessage.value = '此帳號已啟用兩步驟驗證，請在階段五完成後使用'
      return
    }

    // 登入成功，存儲 token 和使用者資訊
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    // 觸發自定義事件通知其他組件用戶信息已更新
    window.dispatchEvent(new CustomEvent('userUpdated'))
    
    console.log('登入成功:', data.user)
    
    // 跳轉到儀表板
    router.push('/dashboard')
  } catch (error: unknown) {
    console.error('登入失敗:', error)
    
    // 處理錯誤訊息
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }, status?: number } }
      if (axiosError.response?.data?.message) {
        errorMessage.value = axiosError.response.data.message
      } else if (axiosError.response?.status === 401) {
        errorMessage.value = '使用者名稱或密碼錯誤'
      } else if (axiosError.response?.status === 0 || !axiosError.response) {
        errorMessage.value = '無法連接到後端服務，請檢查服務是否正常運行'
      } else {
        errorMessage.value = '登入失敗，請稍後再試'
      }
    } else {
      errorMessage.value = '登入失敗，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

// 獲取 OIDC 提供者
const loadOIDCProviders = async () => {
  try {
    const response = await apiService.getOIDCProviders()
    oidcProviders.value = response.data.providers
  } catch (error) {
    console.error('獲取 OIDC 提供者失敗:', error)
    // 不顯示錯誤，因為 OIDC 是可選功能
  }
}

// 處理 OIDC 登入
const handleOIDCLogin = async (provider: OIDCProvider) => {
  isOIDCLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await apiService.startOIDCAuth(provider.name)
    const { authUrl } = response.data
    
    // 重定向到 OIDC 提供者的授權頁面
    window.location.href = authUrl
  } catch (error: unknown) {
    console.error('OIDC 登入失敗:', error)
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      if (axiosError.response?.data?.message) {
        errorMessage.value = axiosError.response.data.message
      } else {
        errorMessage.value = 'OIDC 登入失敗，請稍後再試'
      }
    } else {
      errorMessage.value = 'OIDC 登入失敗，請稍後再試'
    }
  } finally {
    isOIDCLoading.value = false
  }
}

// 獲取提供者圖標
const getProviderIcon = (providerName: string): string => {
  const icons: Record<string, string> = {
    keycloak: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z'
  }
  return icons[providerName] || 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
}

// 組件掛載時載入 OIDC 提供者
onMounted(() => {
  loadOIDCProviders()
})

</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-page-sm);
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
}

.login-form {
  margin-bottom: var(--spacing-lg);
}


.error-alert {
  margin-top: var(--spacing-md);
}

/* 響應式設計 */
@media (max-width: 480px) {
  .login-container {
    padding: var(--spacing-sm);
  }
}

/* 橫向模式優化 */
@media (max-height: 600px) and (orientation: landscape) {
  .login-container {
    align-items: flex-start;
    padding-top: var(--spacing-lg);
  }
}

/* 按鈕樣式 - 統一字體大小 */
.login-button {
  font-size: var(--font-size-lg) !important;
}

/* OIDC 登入區域樣式 */
.oidc-login-section {
  margin-top: var(--spacing-md);
}

.oidc-button {
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-lg) !important;
}

.oidc-button:last-child {
  margin-bottom: 0;
}

/* 大螢幕優化 */
@media (min-width: 768px) {
  .login-card {
    max-width: 450px;
  }
}

@media (min-width: 1024px) {
  .login-container {
    padding: var(--spacing-page-md);
  }
  
  .login-card {
    max-width: 500px;
  }
}

@media (min-width: 1440px) {
  .login-container {
    padding: var(--spacing-page-lg);
  }
  
  .login-card {
    max-width: 550px;
  }
}
</style>

