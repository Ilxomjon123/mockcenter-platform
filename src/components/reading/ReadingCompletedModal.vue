<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content">
      <!-- Checkmark icon -->
      <div class="icon-container" style="background: transparent !important">
        <div class="success-bg">
          <svg
            class="checkmark-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="white"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <h2 class="modal-title">Reading Section Completed</h2>

      <p class="modal-description">
        {{ descriptionText }}
      </p>

      <div class="button-group" style="background: transparent !important">
        <button v-if="showBackButton" class="back-button" @click="goBack">
          <svg
            class="arrow-icon back"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Back
        </button>

        <button class="continue-button" @click="goToNextSection">
          {{ buttonText }}
          <svg
            class="arrow-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'
import { useExamNavigation } from '@/composables/useExamNavigation'

defineProps<{
  isVisible: boolean
}>()

const router = useRouter()
const readingStore = useReadingStore()
const writingStore = useWritingStore()
const { getNextSection } = useExamNavigation()
const currentTime = ref(Date.now())
let timerInterval: number | null = null

onMounted(() => {
  timerInterval = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

const nextSection = computed(() => getNextSection('reading'))

const buttonText = computed(() => {
  if (nextSection.value === 'writing') return 'Continue to Writing'
  return 'Go to Submission'
})

const descriptionText = computed(() => {
  if (nextSection.value === 'writing') {
    return 'You have successfully completed the Reading section. Click the button below to proceed to the Writing section.'
  }
  return 'You have successfully completed the Reading section. Click the button below to submit your exam.'
})

const showBackButton = computed(() => {
  if (!readingStore.isManualSubmit) return false

  // 60 minutes in milliseconds
  const SIXTY_MINUTES = 60 * 60 * 1000
  const startTime = readingStore.startTime || currentTime.value

  return currentTime.value - startTime < SIXTY_MINUTES
})

const goBack = () => {
  readingStore.setCompleted(false)
}

const goToNextSection = () => {
  readingStore.setFinalized(true)
  if (nextSection.value === 'writing') {
    writingStore.setStartTime(Date.now())
    router.push({ name: 'writing' })
  } else {
    router.push({ name: 'submission' })
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
  padding: 48px;
  max-width: 480px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.success-bg {
  width: 80px;
  height: 80px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.15);
}

.checkmark-icon {
  width: 40px;
  height: 40px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
}

.modal-description {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.button-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.back-button:hover {
  background: #e5e7eb;
}

.continue-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.continue-button:hover {
  background: #2563eb;
}

.arrow-icon {
  width: 20px;
  height: 20px;
}

.arrow-icon.back {
  transform: scaleX(1);
}
</style>

<style>
/* Contrast mode overrides - unscoped to work with :root */
:root.contrast-white-on-black .icon-container,
:root.contrast-yellow-on-black .icon-container,
:root.contrast-white-on-black .checkmark-icon,
:root.contrast-yellow-on-black .checkmark-icon,
:root.contrast-white-on-black .button-group,
:root.contrast-yellow-on-black .button-group {
  background: transparent !important;
  background-color: transparent !important;
}

:root.contrast-white-on-black .success-bg {
  background: #10b981 !important;
  box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2) !important;
}

:root.contrast-yellow-on-black .success-bg {
  background: #669900 !important;
  box-shadow: 0 0 0 8px rgba(102, 153, 0, 0.2) !important;
}
</style>
