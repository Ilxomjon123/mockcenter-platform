<template>
  <header class="exam-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="exam-title">
          <router-link to="/practice/dashboard">IELTS Practice</router-link>
        </h1>
        <span v-if="modeStore.isPracticeMode" class="mode-badge practice">Practice Mode</span>
        <span v-else class="mode-badge exam">Exam Mode</span>
      </div>

      <div class="header-right">
        <div class="timer" v-if="showTimer">
          <svg class="timer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <span class="timer-display">{{ formatTime(remainingTime) }}</span>
        </div>

        <button v-if="modeStore.isPracticeMode" class="menu-btn" @click="showMenu = !showMenu">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <transition name="slide">
      <div v-if="showMenu" class="dropdown-menu">
        <router-link to="/practice/dashboard" class="menu-item">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Dashboard
        </router-link>
        <router-link to="/practice/history" class="menu-item">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Exam History
        </router-link>
        <button class="menu-item logout" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Sign Out
        </button>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useModeStore } from '@/stores/modeStore'
import { useAuthStore } from '@/stores/authStore'
import { useListeningStore } from '@/stores/listeningStore'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'

const route = useRoute()
const router = useRouter()
const modeStore = useModeStore()
const authStore = useAuthStore()

const showMenu = ref(false)
const remainingTime = ref(0)
let timerInterval: number | null = null

const showTimer = computed(() => {
  const routeName = route.name as string
  return (
    routeName.includes('listening') ||
    routeName.includes('reading') ||
    routeName.includes('writing')
  )
})

const getTimerDuration = () => {
  const routeName = route.name as string
  if (routeName.includes('listening')) return 30 * 60 // 30 minutes
  if (routeName.includes('reading')) return 60 * 60 // 60 minutes
  if (routeName.includes('writing')) return 60 * 60 // 60 minutes
  return 0
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  const duration = getTimerDuration()
  remainingTime.value = duration

  timerInterval = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      clearInterval(timerInterval!)
      // Auto-submit if needed
      handleSubmitExam()
    }
  }, 1000)
}

const handleSubmitExam = async () => {
  const confirmed = confirm('Time is up! Would you like to submit your exam?')
  if (!confirmed) return

  const result = await authStore.submitExam()

  if (result.success) {
    const redirectRoute = modeStore.isPracticeMode ? 'practice-completed' : 'exam-completed'
    router.push({
      name: redirectRoute,
      query: {
        l_c: result.results.listening_count,
        r_c: result.results.reading_count,
        l_s: result.results.listening_score,
        r_s: result.results.reading_score,
        o: result.results.overall,
      },
    })
  }
}

const handleLogout = async () => {
  await authStore.logout()
  showMenu.value = false
}

onMounted(() => {
  if (showTimer.value) {
    startTimer()
  }
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.exam-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.exam-title a {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}

.exam-title a:hover {
  color: #059669;
}

.mode-badge {
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mode-badge.practice {
  background: #ecfdf5;
  color: #059669;
}

.mode-badge.exam {
  background: #fef2f2;
  color: #dc2626;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.timer-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.timer-display {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #f9fafb;
  color: #111827;
}

.menu-btn svg {
  width: 24px;
  height: 24px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 24px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 100;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  text-align: left;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f9fafb;
}

.menu-item.logout {
  color: #dc2626;
  border-top: 1px solid #e5e7eb;
  margin-top: 4px;
  padding-top: 16px;
}

.menu-item svg {
  width: 18px;
  height: 18px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 640px) {
  .header-content {
    padding: 12px 16px;
  }

  .exam-title {
    font-size: 16px;
  }

  .timer {
    padding: 6px 12px;
  }

  .timer-display {
    font-size: 16px;
  }
}
</style>
