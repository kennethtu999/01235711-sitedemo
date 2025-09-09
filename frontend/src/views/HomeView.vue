<script setup lang="ts">
import { NCard, NSpace, NH1, NP, NButton, NGrid, NGridItem } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <main>
    <n-space vertical size="large" style="padding: 24px; max-width: 1200px; margin: 0 auto;">
      <n-card>
        <template #header>
          <n-h1 style="margin: 0; text-align: center">歡迎使用靜態網站 Demo 管理平台</n-h1>
        </template>
        <n-p style="text-align: center; margin: 0">
          這是一個基於 Naive UI OS 主題的現代化管理平台，支援自動檢測系統主題並提供一致的使用者體驗。
        </n-p>
      </n-card>
      
      <n-grid :cols="3" :x-gap="20" :y-gap="20" responsive="screen">
        <n-grid-item>
          <n-card hoverable>
            <template #header>
              <n-h3 style="margin: 0">OS 主題支援</n-h3>
            </template>
            <n-p style="margin-bottom: 16px">
              自動檢測並適配系統的明暗主題，提供一致的使用者體驗。
            </n-p>
            <n-button type="primary" block>
              了解更多
            </n-button>
          </n-card>
        </n-grid-item>
        
        <n-grid-item>
          <n-card hoverable>
            <template #header>
              <n-h3 style="margin: 0">現代化設計</n-h3>
            </template>
            <n-p style="margin-bottom: 16px">
              採用 Naive UI 組件庫，提供美觀且功能豐富的介面設計。
            </n-p>
            <n-button type="primary" block>
              查看組件
            </n-button>
          </n-card>
        </n-grid-item>
        
        <n-grid-item>
          <n-card hoverable>
            <template #header>
              <n-h3 style="margin: 0">響應式佈局</n-h3>
            </template>
            <n-p style="margin-bottom: 16px">
              支援各種螢幕尺寸，確保在不同設備上都有良好的使用體驗。
            </n-p>
            <n-button type="primary" block>
              測試響應式
            </n-button>
          </n-card>
        </n-grid-item>
      </n-grid>
      
      <n-card>
        <template #header>
          <n-h3 style="margin: 0">開始使用</n-h3>
        </template>
        <n-p style="margin-bottom: 16px">
          點擊下方按鈕開始使用管理平台，體驗 Naive UI OS 主題的強大功能。
        </n-p>
        <n-button type="primary" size="large" @click="goToLogin">
          前往登入頁面
        </n-button>
      </n-card>
    </n-space>
  </main>
</template>
