<template>
  <header class="exam-header">
    <div class="header-left">
      <div class="logo">IELTS</div>
      <div class="test-info">
        <div class="test-id">Test taker ID</div>
        <div v-if="timer" class="timer-display" :class="{ 'timer-low': isTimerLow }">
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
      <div class="wifi-wrapper">
        <div class="wifi-status" :class="{ online: isOnline, offline: !isOnline }">
          <svg class="icon wifi-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
        </div>
        <div class="wifi-tooltip" :class="{ online: isOnline, offline: !isOnline }">
          <div class="tooltip-status">
            <span class="status-dot"></span>
            <span class="status-text">{{ isOnline ? 'Connected' : 'Disconnected' }}</span>
          </div>
          <p class="tooltip-message">
            {{ isOnline ? 'Your internet connection is stable. Your answers are being saved automatically.' : 'No internet connection. Your answers will be saved once the connection is restored.' }}
          </p>
        </div>
      </div>
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <button v-if="!isRunningInTauri" class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'">
        <!-- Expand icon (enter fullscreen) -->
        <svg v-if="!isFullscreen" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4h4" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 8V4h-4" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v4h4" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 16v4h-4" />
        </svg>
        <!-- Compress icon (exit fullscreen) -->
        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4v4H5" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4v4h4" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20v-4H5" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 20v-4h4" />
        </svg>
      </button>
      <button class="options-btn" @click="isOptionsOpen = true" title="Options">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <button v-if="!isRunningInTauri" class="logout-btn" @click="handleLogout" title="Logout">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  </header>

  <OptionsModal :is-open="isOptionsOpen" @close="isOptionsOpen = false" />

  <ConfirmModal
    :is-open="isLogoutModalOpen"
    title="Logout"
    message="Are you sure you want to logout?"
    confirm-text="Yes, logout"
    cancel-text="Cancel"
    type="danger"
    @confirm="confirmLogout"
    @cancel="isLogoutModalOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import OptionsModal from './OptionsModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { isTauri } from '@/composables/useTauri'

interface Props {
  timer?: string
  isTimerLow?: boolean
}

withDefaults(defineProps<Props>(), {
  timer: '',
  isTimerLow: false
})

const authStore = useAuthStore()
const isOptionsOpen = ref(false)
const isLogoutModalOpen = ref(false)
const isOnline = ref(true)
const isFullscreen = ref(false)
const isRunningInTauri = isTauri()
let checkInterval: number | null = null

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

const checkInternetConnection = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/health`, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    })

    clearTimeout(timeoutId)
    isOnline.value = response.ok
  } catch {
    // If fetch fails, try with navigator.onLine as fallback
    isOnline.value = navigator.onLine
  }
}

const handleOnlineChange = () => {
  if (navigator.onLine) {
    checkInternetConnection()
  } else {
    isOnline.value = false
  }
}

onMounted(() => {
  checkInternetConnection()
  checkInterval = window.setInterval(checkInternetConnection, 10000)

  window.addEventListener('online', handleOnlineChange)
  window.addEventListener('offline', handleOnlineChange)
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // Check initial fullscreen state
  isFullscreen.value = !!document.fullscreenElement
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
  window.removeEventListener('online', handleOnlineChange)
  window.removeEventListener('offline', handleOnlineChange)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

const handleLogout = () => {
  isLogoutModalOpen.value = true
}

const confirmLogout = () => {
  isLogoutModalOpen.value = false
  authStore.logout()
}
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
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  color: #dc2626;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.test-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.test-id {
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.timer-display.timer-low {
  color: #dc2626;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #fecaca;
  animation: pulse-warning 1.5s ease-in-out infinite;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.timer-icon {
  width: 16px;
  height: 16px;
}

@keyframes pulse-warning {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 5px rgba(220, 38, 38, 0.15);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 20px;
  height: 20px;
  color: #9ca3af;
  transition: color 0.2s ease;
}

.wifi-wrapper {
  position: relative;
}

.wifi-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.wifi-status.online .wifi-icon {
  color: #22c55e;
}

.wifi-status.offline {
  background: #fef2f2;
  animation: pulse-offline 1.5s ease-in-out infinite;
}

.wifi-status.offline .wifi-icon {
  color: #dc2626;
}

@keyframes pulse-offline {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.wifi-tooltip {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 240px;
  padding: 12px 14px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-5px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.wifi-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 12px;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 2px;
  transform: rotate(45deg);
  box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.04);
}

.wifi-wrapper:hover .wifi-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.tooltip-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.wifi-tooltip.online .status-dot {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

.wifi-tooltip.offline .status-dot {
  background: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(220, 38, 38, 0.3);
  }
}

.status-text {
  font-size: 13px;
  font-weight: 600;
}

.wifi-tooltip.online .status-text {
  color: #16a34a;
}

.wifi-tooltip.offline .status-text {
  color: #dc2626;
}

.tooltip-message {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.fullscreen-btn,
.options-btn,
.logout-btn {
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

.options-btn:hover {
  background: #f3f4f6;
}

.options-btn:hover .icon {
  color: #374151;
}

.options-btn:active {
  transform: scale(0.95);
  background: #e5e7eb;
}

.logout-btn:hover {
  background: #fef2f2;
}

.logout-btn:hover .icon {
  color: #dc2626;
}

.logout-btn:active {
  transform: scale(0.95);
  background: #fee2e2;
}
</style>
