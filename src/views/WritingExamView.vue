<template>
  <div class="exam-view">
    <ExamHeader :timer="remainingTimeFormatted" :is-timer-low="isTimerLow" />

    <div class="main-content">
      <div class="writing-header">
        <div class="header-info">
          <span class="part-label">Part {{ writingStore.currentPage }}</span>
          <p v-if="instructionText" class="instruction">{{ instructionText }}</p>
        </div>
      </div>

      <div class="panels-container">
        <WritingQuestionPanel :page="writingStore.currentPage" :width="leftWidth" />

        <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" />

        <WritingAnswerPanel v-model="currentAnswer" />
      </div>
    </div>

    <ExamFooter
      :current-page="writingStore.currentPage"
      :total-pages="totalPages"
      :part-orders="partOrders"
      @change-page="handlePageChange"
      @submit="handleSubmit"
    />

    <WritingCompletedModal :is-visible="writingStore.isCompleted" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useWritingStore } from '@/stores/writingStore'
import { useResizable } from '@/composables/useResizable'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import WritingQuestionPanel from '@/components/writing/WritingQuestionPanel.vue'
import WritingAnswerPanel from '@/components/writing/WritingAnswerPanel.vue'
import ResizableDivider from '@/components/exam/ResizableDivider.vue'
import WritingCompletedModal from '@/components/writing/WritingCompletedModal.vue'

const writingStore = useWritingStore()
const { leftWidth, isDragging, startDrag } = useResizable()

// 60 minutes in milliseconds
const SIXTY_MINUTES_MS = 60 * 60 * 1000
let timerInterval: number | null = null
const currentTime = ref(Date.now())

const remainingTimeMs = computed(() => {
  const start = writingStore.startTime || currentTime.value
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
  if (!writingStore.startTime) {
    writingStore.setStartTime(Date.now())
  }

  timerInterval = window.setInterval(() => {
    currentTime.value = Date.now()
    if (remainingTimeMs.value <= 0 && !writingStore.isCompleted) {
      handleAutoSubmit()
    }
  }, 1000)
}

const handleAutoSubmit = () => {
  writingStore.setCompleted(true, false) // isManual = false
  if (timerInterval) {
    clearInterval(timerInterval)
  }
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (!writingStore.isCompleted) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  startTimer()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const currentAnswer = computed({
  get: (): string => writingStore.currentAnswer,
  set: (value: string): void => writingStore.updateAnswer(value),
})

const instructionText = computed(() => {
  if (writingStore.currentPage === 1) {
    return 'You should spend about 20 minutes on this task. Write at least 150 words.'
  } else if (writingStore.currentPage === 2) {
    return 'You should spend about 40 minutes on this task. Write at least 250 words.'
  }
  return ''
})

const totalPages = computed((): number => {
  return writingStore.test?.parts.length || 0
})

const partOrders = computed((): number[] => {
  return writingStore.test?.parts.map((p) => p.order).sort((a, b) => a - b) || []
})

const handlePageChange = (page: number): void => {
  writingStore.setPage(page)
}

const handleSubmit = (): void => {
  writingStore.setCompleted(true, true) // isManual = true
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

.writing-header {
  background: white;
  padding: 12px 24px;
  flex-shrink: 0;
}

.header-info {
  background: #f1f2ed;
  padding: 16px 20px;
  border-radius: 3px;
  border: 1px solid #d1d5db;
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
