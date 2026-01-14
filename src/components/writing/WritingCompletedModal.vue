<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content">
      <!-- Success Icon -->
      <div class="icon-container">
        <svg class="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#10b981" />
          <path d="M8 12l2.5 2.5L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <h2 class="modal-title">Test Completed</h2>

      <div class="modal-description">
        <p>You have successfully completed all written parts of the IELTS Mock Test.</p>
        <p v-if="!writingStore.isManualSubmit && !isSubmitting" class="auto-finish-text">
          Test will be submitted automatically in <strong>{{ countdown }}</strong> seconds.
        </p>
        <div class="info-box">
          <p class="info-title">Speaking Exam Information:</p>
          <p>Your Speaking exam will be conducted either <strong>offline</strong> at our center or via <strong>Zoom</strong>.</p>
          <p>Please check your dashboard or wait for an administrator to contact you regarding your speaking slot details.</p>
        </div>
      </div>

      <div class="button-group">
        <button v-if="showBackButton" class="back-button" @click="goBack">
          <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back to Writing
        </button>

        <button class="finish-button" @click="finishTest" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loader"></span>
          <template v-else>
            Finish Test
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useWritingStore } from '@/stores/writingStore'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps<{
  isVisible: boolean
}>()

const writingStore = useWritingStore()
const authStore = useAuthStore()
const currentTime = ref(Date.now())
const isSubmitting = ref(false)
const countdown = ref(10)
let timerInterval: number | null = null
let autoFinishInterval: number | null = null

const startAutoFinishTimer = () => {
  if (autoFinishInterval) clearInterval(autoFinishInterval)
  countdown.value = 10
  autoFinishInterval = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (autoFinishInterval) {
        clearInterval(autoFinishInterval)
        autoFinishInterval = null
      }
      finishTest()
    }
  }, 1000)
}

watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal && !writingStore.isManualSubmit) {
      startAutoFinishTimer()
    } else {
      if (autoFinishInterval) {
        clearInterval(autoFinishInterval)
        autoFinishInterval = null
      }
    }
  },
  { immediate: true },
)

onMounted(() => {
  timerInterval = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (autoFinishInterval) {
    clearInterval(autoFinishInterval)
  }
})

const showBackButton = computed(() => {
  // Agar manual submit bo'lsa va vaqt hali tugamagan bo'lsa back button ko'rinadi
  if (!writingStore.isManualSubmit) return false

  const SIXTY_MINUTES_MS = 60 * 60 * 1000
  const startTime = writingStore.startTime || currentTime.value
  const hasTimeRemaining = (currentTime.value - startTime) < SIXTY_MINUTES_MS

  return hasTimeRemaining
})

const goBack = () => {
  writingStore.setCompleted(false, false)
}

const finishTest = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    const result = await authStore.submitExam()
    if (result.success) {
      const { results } = result
      const query = new URLSearchParams({
        l_c: results.listening_count.toString(),
        r_c: results.reading_count.toString(),
        l_s: results.listening_score.toString(),
        r_s: results.reading_score.toString(),
        o: results.overall.toString(),
      }).toString()
      await authStore.logout(`/completed?${query}`)
    } else {
      alert(result.message || 'Error submitting exam')
    }
  } catch (error) {
    console.error('Submission error:', error)
    alert('Something went wrong during submission')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 550px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.icon-container {
  margin-bottom: 24px;
}

.success-icon {
  width: 80px;
  height: 80px;
}

.modal-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 20px 0;
}

.modal-description {
  font-size: 16px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 32px 0;
  text-align: left;
}

.auto-finish-text {
  margin-top: 12px;
  color: #dc2626;
  font-weight: 600;
  text-align: center;
}

.info-box {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.info-title {
  font-weight: 700;
  color: #0369a1;
  margin-bottom: 8px;
}

.button-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #e5e7eb;
}

.finish-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.finish-button:hover {
  background: #2563eb;
}

.finish-button:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.arrow-icon {
  width: 20px;
  height: 20px;
}
</style>
