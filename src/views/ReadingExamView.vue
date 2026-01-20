<template>
  <div class="exam-view">
    <ExamHeader :timer="remainingTimeFormatted" :is-timer-low="isTimerLow" />

    <div class="main-content">
      <!-- Shared sticky header -->
      <div class="reading-header">
        <div class="header-info">
          <span class="part-label">Part {{ readingStore.currentPart }}</span>
          <p class="instruction">Read the text and answer questions {{ getQuestionsRange }}</p>
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
      :current-question="currentQuestion"
      :total-pages="totalParts"
      :part-orders="partOrders"
      :part-stats="readingStore.partStats"
      :answers="readingStore.answers"
      @change-page="handlePageChange"
      @change-question="handleQuestionChange"
      @submit="handleSubmit"
    />

    <ReadingCompletedModal :is-visible="readingStore.isCompleted" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue'
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
const currentQuestion = ref(0)

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
  readingStore.setFinalized(true)
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

// Handle focus/click on inputs to update footer
const handleInputFocus = (e: Event) => {
  const target = e.target as HTMLElement

  // Check if it's a gap input
  if (target.classList.contains('gap-input')) {
    const gap = (target as HTMLInputElement).dataset.gap
    if (gap) {
      currentQuestion.value = parseInt(gap, 10)
    }
    return
  }

  // Check if it's a match dropzone
  if (target.classList.contains('match-dropzone') || target.closest('.match-dropzone')) {
    const dropzone = target.classList.contains('match-dropzone')
      ? target
      : target.closest('.match-dropzone')
    const gap = (dropzone as HTMLElement)?.dataset.gap
    if (gap) {
      currentQuestion.value = parseInt(gap, 10)
    }
    return
  }

  // Check if it's inside a multiple choice question
  const mcQuestion = target.closest('[data-question-number]')
  if (mcQuestion) {
    const qNum = (mcQuestion as HTMLElement).dataset.questionNumber
    if (qNum) {
      currentQuestion.value = parseInt(qNum, 10)
    }
  }
}

onMounted(() => {
  setupGlobalListeners()
  startTimer()
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('focusin', handleInputFocus)
  document.addEventListener('click', handleInputFocus)
})

onUnmounted(() => {
  cleanupGlobalListeners()
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('focusin', handleInputFocus)
  document.removeEventListener('click', handleInputFocus)
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

const handleQuestionChange = async (questionNumber: number): Promise<void> => {
  currentQuestion.value = questionNumber

  await nextTick()

  // Find the input or dropzone with the matching data-gap attribute
  const container = document.querySelector('.question-panel .questions-container')
  if (!container) return

  // Try gap input first
  let element = container.querySelector<HTMLInputElement>(
    `.gap-input[data-gap="${questionNumber}"]`
  )

  // If not found, try match dropzone
  if (!element) {
    element = container.querySelector<HTMLElement>(
      `.match-dropzone[data-gap="${questionNumber}"]`
    ) as HTMLInputElement
  }

  // If not found, try multiple choice option with matching question number
  if (!element) {
    const mcQuestion = container.querySelector(
      `[data-question-number="${questionNumber}"]`
    )
    if (mcQuestion) {
      mcQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }

  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (element.tagName === 'INPUT') {
      element.focus()
    }
  }
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
  top: 85px;
  bottom: 72px;
  left: 0;
  right: 0;
}

.reading-header {
  background: white;
  padding: 12px 24px;
  flex-shrink: 0;
}

.header-info {
  background: #e8e8e8;
  padding: 16px 20px;
  border-radius: 8px;
  border-left: 4px solid #9ca3af;
}

.part-label {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
  display: block;
  margin-bottom: 4px;
}

.instruction {
  font-size: 14px;
  color: #4b5563;
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
