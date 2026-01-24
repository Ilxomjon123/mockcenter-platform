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
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
        />
      </svg>
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
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
      <button class="logout-btn" @click="handleLogout" title="Chiqish">
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import OptionsModal from './OptionsModal.vue'

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

const handleLogout = () => {
  if (confirm('Rostdan ham chiqmoqchimisiz?')) {
    authStore.logout()
  }
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
