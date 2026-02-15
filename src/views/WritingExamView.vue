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

      <!-- Mobile Tab Switcher -->
      <div class="mobile-tabs">
        <button
          class="mobile-tab"
          :class="{ active: activeTab === 'question' }"
          @click="activeTab = 'question'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Task
        </button>
        <button
          class="mobile-tab"
          :class="{ active: activeTab === 'answer' }"
          @click="activeTab = 'answer'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Answer
        </button>
      </div>

      <div class="panels-container">
        <WritingQuestionPanel
          :page="writingStore.currentPage"
          :width="leftWidth"
          :class="{ 'mobile-hidden': activeTab !== 'question' }"
        />

        <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" class="hide-mobile" />

        <WritingAnswerPanel
          v-model="currentAnswer"
          :class="{ 'mobile-hidden': activeTab !== 'answer' }"
        />
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
import { useHealthCheck } from '@/composables/useHealthCheck'

const writingStore = useWritingStore()
const { leftWidth, isDragging, startDrag } = useResizable()

// Mobile tab state
const activeTab = ref<'question' | 'answer'>('question')

// 60 minutes in milliseconds
const SIXTY_MINUTES_MS = 60 * 60 * 1000

// Health check - send current section and timer to backend
const getTimerSeconds = () => {
  const start = writingStore.startTime || Date.now()
  return Math.max(0, Math.floor((SIXTY_MINUTES_MS - (Date.now() - start)) / 1000))
}
useHealthCheck('writing', getTimerSeconds)

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
  top: var(--header-height, 61px);
  bottom: var(--footer-height, 72px);
  left: 0;
  right: 0;
}

@media (max-width: 640px) {
  .main-content {
    top: var(--header-height, 52px);
    bottom: var(--footer-height, 120px);
  }
}

.writing-header {
  background: white;
  padding: 16px 24px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .writing-header {
    padding: 8px 12px;
  }
}

.header-info {
  background: #f1f2ed;
  padding: 10px 16px;
  border-radius: 3px;
  border: 1px solid #d1d5db;
}

@media (max-width: 640px) {
  .header-info {
    padding: 8px 12px;
  }
}

.part-label {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
  display: block;
  margin-bottom: 4px;
}

@media (max-width: 640px) {
  .part-label {
    font-size: 14px;
    margin-bottom: 2px;
  }
}

.instruction {
  font-size: 14px;
  color: #4b5563;
  margin: 0;
}

@media (max-width: 640px) {
  .instruction {
    font-size: 12px;
  }
}

/* Mobile Tab Switcher */
.mobile-tabs {
  display: none;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 12px;
  gap: 8px;
}

@media (max-width: 640px) {
  .mobile-tabs {
    display: flex;
  }
}

.mobile-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-tab.active {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
}

.mobile-tab svg {
  flex-shrink: 0;
}

.panels-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

@media (max-width: 640px) {
  .panels-container {
    flex-direction: column;
  }
}

/* Hide panels on mobile based on active tab */
@media (max-width: 640px) {
  :deep(.question-panel.mobile-hidden),
  :deep(.answer-panel.mobile-hidden) {
    display: none;
  }

  :deep(.question-panel:not(.mobile-hidden)),
  :deep(.answer-panel:not(.mobile-hidden)) {
    width: 100% !important;
    flex: 1;
  }
}

/* Hide resizable divider on mobile */
.hide-mobile {
  display: flex;
}

@media (max-width: 640px) {
  .hide-mobile {
    display: none !important;
  }
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
