import { onMounted, onUnmounted, ref } from 'vue'
import { useApi } from './useApi'

type SectionType = 'listening' | 'reading' | 'writing'

// Shared reactive state for connection status (used by ExamHeader)
const isOnline = ref(true)
const lastHealthCheckTime = ref<number>(0)

export const useConnectionStatus = () => {
  return {
    isOnline,
    lastHealthCheckTime,
  }
}

export const useHealthCheck = (section: SectionType, getTimerSeconds: () => number) => {
  const { post } = useApi()
  let healthInterval: number | null = null

  const sendHealthCheck = async () => {
    try {
      const timer = getTimerSeconds()
      await post('/api/exam/health', {
        section,
        timer,
      })
      isOnline.value = true
      lastHealthCheckTime.value = Date.now()
    } catch {
      isOnline.value = false
    }
  }

  const startHealthCheck = () => {
    // Send immediately
    sendHealthCheck()

    // Then send every 10 seconds
    healthInterval = window.setInterval(() => {
      sendHealthCheck()
    }, 10000)
  }

  const stopHealthCheck = () => {
    if (healthInterval) {
      clearInterval(healthInterval)
      healthInterval = null
    }
  }

  onMounted(() => {
    startHealthCheck()
  })

  onUnmounted(() => {
    stopHealthCheck()
  })

  return {
    isOnline,
    sendHealthCheck,
    startHealthCheck,
    stopHealthCheck,
  }
}
