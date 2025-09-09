<template>
  <div class="login-container">
    <n-card class="login-card" :bordered="false">
      <template #header>
        <div class="login-header">
          <h1 class="login-title">網站管理</h1>
          <p class="login-subtitle">請登入以繼續</p>
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
          >
            {{ isLoading ? '登入中...' : '登入' }}
          </n-button>
        </n-form-item>
      </n-form>
      
      <n-divider>測試功能</n-divider>
      
      <div class="test-section">
        <n-button 
          @click="testApiConnection" 
          :loading="isTestingApi"
          block
          secondary
        >
          {{ isTestingApi ? '測試中...' : '測試後端連接' }}
        </n-button>
        
        <n-collapse v-if="apiTestResult" class="api-result">
          <n-collapse-item title="API 測試結果" name="1">
            <n-code :code="apiTestResult" language="json" />
          </n-collapse-item>
        </n-collapse>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NDivider, NCollapse, NCollapseItem, NCode, NAlert } from 'naive-ui'
import { apiService, type LoginCredentials } from '@/api'

const router = useRouter()

// 表單數據
const loginForm = reactive({
  username: '',
  password: ''
})

// 狀態管理
const isLoading = ref(false)
const isTestingApi = ref(false)
const errorMessage = ref('')
const apiTestResult = ref('')

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

// 測試 API 連接
const testApiConnection = async () => {
  isTestingApi.value = true
  apiTestResult.value = ''
  
  try {
    const response = await apiService.getStatus()
    apiTestResult.value = JSON.stringify(response.data, null, 2)
  } catch (error) {
    apiTestResult.value = `錯誤: ${error}`
  } finally {
    isTestingApi.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
}

.login-title {
  margin-bottom: 8px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
}

.login-subtitle {
  margin-bottom: 0;
  font-size: 14px;
  opacity: 0.7;
}

.login-form {
  margin-bottom: 24px;
}

.test-section {
  margin-top: 16px;
}

.api-result {
  margin-top: 16px;
}

.error-alert {
  margin-top: 16px;
}

/* 響應式設計 */
@media (max-width: 480px) {
  .login-container {
    padding: 12px;
  }
  
  .login-title {
    font-size: 20px;
  }
}

@media (max-width: 360px) {
  .login-title {
    font-size: 18px;
  }
  
  .login-subtitle {
    font-size: 13px;
  }
}

/* 橫向模式優化 */
@media (max-height: 600px) and (orientation: landscape) {
  .login-container {
    align-items: flex-start;
    padding-top: 20px;
  }
}

/* 大螢幕優化 */
@media (min-width: 768px) {
  .login-title {
    font-size: 24px;
  }
}

@media (min-width: 1024px) {
  .login-container {
    padding: 24px;
  }
  
  .login-card {
    max-width: 450px;
  }
  
  .login-title {
    font-size: 28px;
  }
  
  .login-subtitle {
    font-size: 16px;
  }
}

@media (min-width: 1440px) {
  .login-container {
    padding: 32px;
  }
  
  .login-card {
    max-width: 500px;
  }
  
  .login-title {
    font-size: 32px;
  }
  
  .login-subtitle {
    font-size: 17px;
  }
}

@media (min-width: 1920px) {
  .login-container {
    padding: 40px;
  }
  
  .login-card {
    max-width: 550px;
  }
  
  .login-title {
    font-size: 36px;
  }
  
  .login-subtitle {
    font-size: 18px;
  }
}
</style>

