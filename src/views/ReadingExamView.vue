<template>
  <div class="exam-view">
    <ExamHeader :timer="remainingTimeFormatted" :is-timer-low="isTimerLow" />

    <div class="main-content">
      <!-- Shared sticky header -->
      <div class="reading-header">
        <div class="header-info">
          <span class="part-label">{{ $t('footer.part', { part: readingStore.currentPart }) }}</span>
          <p class="instruction">{{ currentPartInstruction }}</p>
        </div>
      </div>

      <!-- Mobile Tab Switcher (only for multi-panel parts) -->
      <div v-if="hasPassage && !isPassageOnly" class="mobile-tabs">
        <button
          class="mobile-tab"
          :class="{ active: activeTab === 'passage' }"
          @click="activeTab = 'passage'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {{ $t('common.passage') }}
        </button>
        <button
          class="mobile-tab"
          :class="{ active: activeTab === 'questions' }"
          @click="activeTab = 'questions'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          {{ $t('common.questions') }}
        </button>
      </div>

      <!-- Gap-text part (every answer is a gap in the passage, e.g. CEFR Part 1):
           single full-width passage, no question panel -->
      <div v-if="isPassageOnly" class="single-panel-container">
        <ReadingPassagePanel
          :width="100"
          :passage="readingStore.currentPassage"
          class="full-width-passage"
        />
      </div>

      <!-- Passage + questions side by side -->
      <div v-else class="panels-container" :class="{ 'no-passage': !hasPassage }">
        <ReadingPassagePanel
          v-if="hasPassage"
          :width="leftWidth"
          :passage="readingStore.currentPassage"
          :class="{ 'mobile-hidden': activeTab !== 'passage' }"
        />

        <ResizableDivider
          v-if="hasPassage"
          :is-dragging="isDragging"
          @start-drag="startDrag"
          class="hide-mobile"
        />

        <ReadingQuestionPanel :class="{ 'mobile-hidden': hasPassage && activeTab !== 'questions' }" />
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
import { useI18n } from 'vue-i18n'
import { useReadingStore } from '@/stores/readingStore'
import { useAuthStore } from '@/stores/authStore'
import { useResizable } from '@/composables/useResizable'
import { useGlobalReadingDragDrop } from '@/composables/useGlobalReadingDragDrop'
import { isPassageOnlyPart } from '@/utils/questionUtils'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import ReadingPassagePanel from '@/components/reading/ReadingPassagePanel.vue'
import ReadingQuestionPanel from '@/components/reading/ReadingQuestionPanel.vue'
import ResizableDivider from '@/components/exam/ResizableDivider.vue'
import ReadingCompletedModal from '@/components/reading/ReadingCompletedModal.vue'
import { useHealthCheck } from '@/composables/useHealthCheck'

const { t } = useI18n()
const readingStore = useReadingStore()
const authStore = useAuthStore()
const { leftWidth, isDragging, startDrag } = useResizable()
const { setupGlobalListeners, cleanupGlobalListeners } = useGlobalReadingDragDrop()
const currentQuestion = ref(0)

// Mobile tab state
const activeTab = ref<'passage' | 'questions'>('passage')

// 60 minutes in milliseconds
const SIXTY_MINUTES_MS = 60 * 60 * 1000

// Health check - send current section and timer to backend
const getTimerSeconds = () => {
  const start = readingStore.startTime || Date.now()
  return Math.max(0, Math.floor((SIXTY_MINUTES_MS - (Date.now() - start)) / 1000))
}
useHealthCheck('reading', getTimerSeconds)
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

const hasPassage = computed((): boolean => {
  const content = readingStore.currentPassage?.content
  return !!content && content.trim() !== ''
})

// Every answer of the current part is a gap/dropzone inside the passage and the
// questions carry nothing to show → render the passage alone, full width.
const isPassageOnly = computed((): boolean => isPassageOnlyPart(readingStore.currentPassage))

const isCefr = computed(() => ['cerf', 'cefr'].includes((authStore.examType || '').toLowerCase()))

const currentPartInstruction = computed((): string => {
  const range = getQuestionsRange.value
  const generic = t('reading.readAndAnswer', { range })
  if (!isCefr.value) return generic

  // CEFR Multilevel reading instructions (question ranges come from the data)
  switch (readingStore.currentPart) {
    case 1:
      return 'Read the text. Fill in each gap with ONE word. You must use a word which is somewhere in the rest of the text.'
    case 2:
      return `Read the texts ${range} and the statements. Decide which text matches with the situation described in the statements. Each statement can be used ONCE only. There are extra statements which you do not need to use.`
    case 3:
      return `Read the text and the list of headings. Choose the correct heading for each paragraph (questions ${range}).`
    case 4:
    case 5:
      return `Read the following text for questions ${range}.`
    default:
      return generic
  }
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

  // Find the input or dropzone across the active main-content area
  const container = document.querySelector('.main-content') || document

  // Try gap input first
  let element = container.querySelector<HTMLInputElement>(
    `.gap-input[data-gap="${questionNumber}"]`,
  )

  // If not found, try match dropzone
  if (!element) {
    element = container.querySelector<HTMLElement>(
      `.match-dropzone[data-gap="${questionNumber}"]`,
    ) as HTMLInputElement
  }

  // If not found, try question container or matching row with matching question number
  if (!element) {
    const qEl = container.querySelector(`[data-question-number="${questionNumber}"]`)
    if (qEl) {
      qEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

.reading-header {
  background: white;
  padding: 8px 24px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .reading-header {
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

.single-panel-container {
  flex: 1;
  display: flex;
  overflow-y: auto;
  background: #ffffff;
  justify-content: center;
}

.single-panel-container :deep(.passage-panel) {
  width: 100% !important;
  max-width: 960px;
  margin: 0 auto;
  border-right: none !important;
}

.single-panel-container :deep(.passage-content) {
  padding: 36px 48px;
}

@media (max-width: 640px) {
  .single-panel-container :deep(.passage-content) {
    padding: 20px 16px;
  }
}

.panels-container.no-passage :deep(.question-panel) {
  width: 100% !important;
  flex: 1;
}

@media (max-width: 640px) {
  .panels-container {
    flex-direction: column;
  }
}

/* Hide panels on mobile based on active tab */
@media (max-width: 640px) {
  :deep(.passage-panel.mobile-hidden),
  :deep(.question-panel.mobile-hidden) {
    display: none;
  }

  :deep(.passage-panel:not(.mobile-hidden)),
  :deep(.question-panel:not(.mobile-hidden)) {
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
