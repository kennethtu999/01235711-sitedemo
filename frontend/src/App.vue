<script setup lang="ts">
import { RouterView, useRoute } from "vue-router";
import {
  NConfigProvider,
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
  NLayout,
  NLayoutContent,
  darkTheme,
  lightTheme,
} from "naive-ui";
import { computed, ref } from "vue";
import SidebarMenu from "./components/SidebarMenu.vue";

// OS theme detection
const isDark = computed(() => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
});

const theme = computed(() => (isDark.value ? darkTheme : lightTheme));

// 檢查是否需要顯示側邊欄
const route = useRoute();
const showSidebar = computed(() => {
  return route.name !== "login" && route.name !== "home";
});

// 側邊欄收合狀態
const sidebarCollapsed = ref(true);

// 計算內容區域的左邊距
const contentMarginLeft = computed(() => {
  if (!showSidebar.value) return "0px";
  return sidebarCollapsed.value ? "64px" : "240px";
});
</script>

<template>
  <NConfigProvider :theme="theme">
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <div id="app">
            <NLayout v-if="showSidebar" has-sider>
              <SidebarMenu @update:collapsed="sidebarCollapsed = $event" />
              <NLayoutContent :style="{ marginLeft: contentMarginLeft }">
                <RouterView />
              </NLayoutContent>
            </NLayout>
            <RouterView v-else />
          </div>
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
#app {
  min-height: 100vh;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
    "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
