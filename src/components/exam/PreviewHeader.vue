<template>
  <header class="exam-header">
    <div class="header-left">
      <div class="logo">IELTS</div>
      <div class="test-info">
        <div class="preview-badge">Preview Mode</div>
        <div v-if="timer" class="timer-display">
          <svg class="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="timer-time">{{ timer }}</span>
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="wifi-status online">
        <svg class="icon wifi-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      </div>
      <button class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'">
        <svg v-if="!isFullscreen" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4h4" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 8V4h-4" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v4h4" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 16v4h-4" />
        </svg>
        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4v4H5" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4v4h4" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20v-4H5" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 20v-4h4" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  timer?: string
}

withDefaults(defineProps<Props>(), {
  timer: '',
})

const isFullscreen = ref(false)

const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (err) {
    console.error('Fullscreen error:', err)
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  isFullscreen.value = !!document.fullscreenElement
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.exam-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  height: var(--header-height, 61px);
}

@media (max-width: 640px) {
  .exam-header {
    padding: 8px 12px;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

@media (max-width: 640px) {
  .header-left {
    gap: 10px;
  }
}

.logo {
  color: #dc2626;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

@media (max-width: 640px) {
  .logo {
    font-size: 18px;
  }
}

.test-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 640px) {
  .test-info {
    gap: 8px;
  }
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid #f59e0b;
}

.timer-display {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

@media (max-width: 640px) {
  .timer-display {
    padding: 4px 10px;
    font-size: 13px;
    gap: 4px;
  }
}

.timer-icon {
  width: 16px;
  height: 16px;
}

@media (max-width: 640px) {
  .timer-icon {
    width: 14px;
    height: 14px;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 640px) {
  .header-right {
    gap: 4px;
  }
}

.icon {
  width: 20px;
  height: 20px;
  color: #9ca3af;
  transition: color 0.2s ease;
}

@media (max-width: 640px) {
  .icon {
    width: 18px;
    height: 18px;
  }
}

.wifi-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

@media (max-width: 640px) {
  .wifi-status {
    display: none;
  }
}

.wifi-status.online .wifi-icon {
  color: #22c55e;
}

.fullscreen-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 640px) {
  .fullscreen-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
  }
}

.fullscreen-btn:hover {
  background: #f3f4f6;
}

.fullscreen-btn:hover .icon {
  color: #374151;
}

.fullscreen-btn:active {
  transform: scale(0.95);
  background: #e5e7eb;
}
</style>
