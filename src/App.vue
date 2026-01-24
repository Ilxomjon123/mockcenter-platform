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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #1e293b;
  background: #f8fafc;
}

#app {
  min-height: 100vh;
}

/* Disable text selection on buttons */
button {
  user-select: none;
  -webkit-user-select: none;
}

/* Better input styling */
input,
textarea,
select {
  font-family: inherit;
}

/* Placeholder styling */
::placeholder {
  color: #94a3b8;
  opacity: 1;
}
</style>
