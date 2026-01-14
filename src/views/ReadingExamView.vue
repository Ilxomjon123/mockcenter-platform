<template>
  <div class="exam-view">
    <ExamHeader />

    <div class="main-content">
      <!-- Shared sticky header -->
      <div class="reading-header">
        <div class="header-info">
          <span class="part-label">Part {{ readingStore.currentPart }}</span>
          <p class="instruction">Read the text and answer questions {{ getQuestionsRange }}</p>
        </div>
        <div class="timer-display" :class="{ 'timer-low': isTimerLow }">
          <svg class="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="timer-time">{{ remainingTimeFormatted }}</span>
        </div>
      </div>

      <!-- Panels container -->
      <div class="panels-container">
        <ReadingPassagePanel
          :width="leftWidth"
          :passage="readingStore.currentPassage"
        />

        <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" />

        <ReadingQuestionPanel />
      </div>
    </div>

    <ExamFooter
      :current-page="readingStore.currentPart"
      :total-pages="totalParts"
      :part-orders="partOrders"
      @change-page="handlePageChange"
      @submit="handleSubmit"
    />

    <ReadingCompletedModal :is-visible="readingStore.isCompleted" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useReadingStore } from '@/stores/readingStore'
import { useResizable } from '@/composables/useResizable'
import { useGlobalReadingDragDrop } from '@/composables/useGlobalReadingDragDrop'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import ReadingPassagePanel from '@/components/reading/ReadingPassagePanel.vue'
import ReadingQuestionPanel from '@/components/reading/ReadingQuestionPanel.vue'
import ResizableDivider from '@/components/exam/ResizableDivider.vue'
import ReadingCompletedModal from '@/components/reading/ReadingCompletedModal.vue'

const readingStore = useReadingStore()
const { leftWidth, isDragging, startDrag } = useResizable()
const { setupGlobalListeners, cleanupGlobalListeners } = useGlobalReadingDragDrop()

// 60 minutes in milliseconds
const SIXTY_MINUTES_MS = 60 * 60 * 1000
let timerInterval: number | null = null
const currentTime = ref(Date.now())

const remainingTimeMs = computed(() => {
  const start = readingStore.startTime || currentTime.value
  return Math.max(0, SIXTY_MINUTES_MS - (currentTime.value - start))
})

const remainingTimeFormatted = computed(() => {
  const remaining = remainingTimeMs.value
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const isTimerLow = computed(() => {
  const remaining = remainingTimeMs.value
  return remaining > 0 && remaining < 5 * 60 * 1000 // Less than 5 minutes
})

const startTimer = () => {
  if (!readingStore.startTime) {
    readingStore.setStartTime(Date.now())
  }

  timerInterval = window.setInterval(() => {
    currentTime.value = Date.now()
    if (remainingTimeMs.value <= 0 && !readingStore.isCompleted) {
      handleAutoSubmit()
    }
  }, 1000)
}

const handleAutoSubmit = () => {
  readingStore.setCompleted(true, false) // isManual = false
  if (timerInterval) {
    clearInterval(timerInterval)
  }
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (!readingStore.isCompleted) {
    e.preventDefault()
    // Standard conformant browsers require returnValue to be set
    e.returnValue = ''
  }
}

onMounted(() => {
  setupGlobalListeners()
  startTimer()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  cleanupGlobalListeners()
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const getQuestionsRange = computed((): string => {
  const part = readingStore.currentPart
  const stats = readingStore.partStats[part]
  if (stats) {
    return `${stats.start}-${stats.end}`
  }
  return ''
})

const totalParts = computed((): number => {
  return readingStore.test?.parts.length || 0
})

const partOrders = computed((): number[] => {
  // Return part orders from test
  return readingStore.test?.parts.map((p) => p.order) || []
})

const handlePageChange = (page: number): void => {
  // page here is the order value from API
  readingStore.setPart(page)
}

const handleSubmit = (): void => {
  readingStore.setCompleted(true, true) // isManual = true
}
</script>

<style scoped>
.exam-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 64px;
  bottom: 72px;
  left: 0;
  right: 0;
}

.reading-header {
  background: #f5f5f5;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: monospace;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  transition: all 0.3s ease;
}

.timer-display.timer-low {
  color: #dc2626;
  background: #fee2e2;
  border-color: #fecaca;
  animation: pulse 2s infinite;
}

.timer-icon {
  width: 20px;
  height: 20px;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.part-label {
  font-weight: 600;
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

.instruction {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.panels-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Make header sticky at top */
:deep(.exam-header) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Make footer sticky at bottom */
:deep(.exam-footer) {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}
</style>
