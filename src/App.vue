<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

onMounted(() => {
  settingsStore.initializeSettings()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}

#app {
  min-height: 100vh;
}
</style>
