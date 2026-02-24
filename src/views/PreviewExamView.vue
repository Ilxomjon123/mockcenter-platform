<template>
  <div v-if="loading" class="preview-loading">
    <span class="spinner"></span>
    <p>Loading preview...</p>
  </div>

  <div v-else-if="error" class="preview-error">
    <p>{{ error }}</p>
    <a href="/" class="back-link">Go back</a>
  </div>

  <!-- Reading Preview -->
  <div v-else-if="sectionType === 'reading'" class="exam-view">
    <PreviewHeader timer="60:00" />

    <div class="main-content">
      <div class="section-header">
        <div class="header-info">
          <span class="part-label">Part {{ readingStore.currentPart }}</span>
          <p class="instruction">Read the text and answer questions {{ readingQuestionsRange }}</p>
        </div>
      </div>

      <div class="mobile-tabs">
        <button class="mobile-tab" :class="{ active: readingTab === 'passage' }" @click="readingTab = 'passage'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Passage
        </button>
        <button class="mobile-tab" :class="{ active: readingTab === 'questions' }" @click="readingTab = 'questions'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          Questions
        </button>
      </div>

      <div class="panels-container">
        <ReadingPassagePanel
          :width="leftWidth"
          :passage="readingStore.currentPassage"
          :class="{ 'mobile-hidden': readingTab !== 'passage' }"
        />
        <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" class="hide-mobile" />
        <ReadingQuestionPanel :class="{ 'mobile-hidden': readingTab !== 'questions' }" />
      </div>
    </div>

    <ExamFooter
      :current-page="readingStore.currentPart"
      :current-question="currentQuestion"
      :total-pages="readingTotalParts"
      :part-orders="readingPartOrders"
      :part-stats="readingStore.partStats"
      :answers="readingStore.answers"
      @change-page="readingStore.setPart"
      @change-question="handleReadingQuestionChange"
      @submit="noop"
    />
  </div>

  <!-- Writing Preview -->
  <div v-else-if="sectionType === 'writing'" class="exam-view">
    <PreviewHeader timer="60:00" />

    <div class="main-content">
      <div class="section-header">
        <div class="header-info">
          <span class="part-label">Part {{ writingStore.currentPage }}</span>
          <p class="instruction">{{ writingInstruction }}</p>
        </div>
      </div>

      <div class="mobile-tabs">
        <button class="mobile-tab" :class="{ active: writingTab === 'question' }" @click="writingTab = 'question'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Task
        </button>
        <button class="mobile-tab" :class="{ active: writingTab === 'answer' }" @click="writingTab = 'answer'">
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
          :class="{ 'mobile-hidden': writingTab !== 'question' }"
        />
        <ResizableDivider :is-dragging="isDragging" @start-drag="startDrag" class="hide-mobile" />
        <WritingAnswerPanel
          v-model="writingAnswer"
          :class="{ 'mobile-hidden': writingTab !== 'answer' }"
        />
      </div>
    </div>

    <ExamFooter
      :current-page="writingStore.currentPage"
      :total-pages="writingTotalPages"
      :part-orders="writingPartOrders"
      @change-page="writingStore.setPage"
      @submit="noop"
    />
  </div>

  <!-- Listening Preview -->
  <div v-else-if="sectionType === 'listening'" class="exam-view">
    <PreviewHeader />

    <div class="main-content">
      <ListeningQuestionPanel />
    </div>

    <ExamFooter
      :current-page="listeningStore.currentPart"
      :current-question="currentQuestion"
      :total-pages="listeningStore.test?.parts?.length || 0"
      :part-orders="listeningStore.partOrders"
      :part-stats="listeningStore.partStats"
      :answers="listeningStore.answers"
      @change-page="listeningStore.setPart"
      @change-question="handleListeningQuestionChange"
      @submit="noop"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import type { SectionWithPartsRaw, ExamTestRaw } from '@/types/test'
import { useReadingStore } from '@/stores/readingStore'
import { useWritingStore } from '@/stores/writingStore'
import { useListeningStore } from '@/stores/listeningStore'
import { useResizable } from '@/composables/useResizable'
import { useGlobalReadingDragDrop } from '@/composables/useGlobalReadingDragDrop'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import ResizableDivider from '@/components/exam/ResizableDivider.vue'
import ReadingPassagePanel from '@/components/reading/ReadingPassagePanel.vue'
import ReadingQuestionPanel from '@/components/reading/ReadingQuestionPanel.vue'
import WritingQuestionPanel from '@/components/writing/WritingQuestionPanel.vue'
import WritingAnswerPanel from '@/components/writing/WritingAnswerPanel.vue'
import ListeningQuestionPanel from '@/components/listening/ListeningQuestionPanel.vue'
import PreviewHeader from '@/components/exam/PreviewHeader.vue'

const route = useRoute()
const sectionType = ref<string>('')
const loading = ref(true)
const error = ref('')

const readingStore = useReadingStore()
const writingStore = useWritingStore()
const listeningStore = useListeningStore()
const { leftWidth, isDragging, startDrag } = useResizable()

// Tab states
const readingTab = ref<'passage' | 'questions'>('passage')
const writingTab = ref<'question' | 'answer'>('question')
const currentQuestion = ref(0)

const API_URL = import.meta.env.VITE_API_URL

// Drag and drop for reading
const { setupGlobalListeners, cleanupGlobalListeners } = useGlobalReadingDragDrop()

const noop = () => {}

// Fetch preview data using raw axios (bypassing auth interceptor)
const fetchPreview = async (type: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/exam/preview/${type}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })

    const section: SectionWithPartsRaw = response.data.data

    // Build a minimal ExamTestRaw with just this section
    const testData: ExamTestRaw = {
      id: 0,
      title: 'Preview',
      listening: type === 'listening' ? section : { id: 0, type: 'listening', title: '', parts: [] },
      reading: type === 'reading' ? section : { id: 0, type: 'reading', title: '', parts: [] },
      writing: type === 'writing' ? section : { id: 0, type: 'writing', title: '', parts: [] },
      speaking: { id: 0, type: 'speaking', title: '', parts: [] },
    }

    // Populate the appropriate store
    if (type === 'reading') {
      readingStore.clearReading()
      readingStore.setTest(testData)
    } else if (type === 'writing') {
      writingStore.clearWriting()
      writingStore.setTest(testData)
    } else if (type === 'listening') {
      listeningStore.clearListening()
      listeningStore.setTest(testData)
    }

    sectionType.value = type
  } catch (err) {
    if (axios.isAxiosError(err)) {
      error.value = err.response?.data?.message || 'Failed to load preview'
    } else {
      error.value = 'Failed to load preview'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const type = route.params.type as string
  if (!['listening', 'reading', 'writing'].includes(type)) {
    error.value = 'Invalid section type'
    loading.value = false
    return
  }
  fetchPreview(type)
  setupGlobalListeners()
})

onUnmounted(() => {
  cleanupGlobalListeners()
})

// Reading computed
const readingQuestionsRange = computed(() => {
  const part = readingStore.currentPart
  const stats = readingStore.partStats[part]
  return stats ? `${stats.start}-${stats.end}` : ''
})

const readingTotalParts = computed(() => readingStore.test?.parts.length || 0)

const readingPartOrders = computed(() =>
  readingStore.test?.parts.map((p) => p.order) || [],
)

const handleReadingQuestionChange = async (questionNumber: number) => {
  currentQuestion.value = questionNumber
  await nextTick()

  const container = document.querySelector('.question-panel .questions-container')
  if (!container) return

  let element = container.querySelector<HTMLInputElement>(`.gap-input[data-gap="${questionNumber}"]`)
  if (!element) {
    element = container.querySelector<HTMLElement>(`.match-dropzone[data-gap="${questionNumber}"]`) as HTMLInputElement
  }
  if (!element) {
    const mcQuestion = container.querySelector(`[data-question-number="${questionNumber}"]`)
    if (mcQuestion) {
      mcQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (element.tagName === 'INPUT') element.focus()
  }
}

// Writing computed
const writingAnswer = computed({
  get: () => writingStore.currentAnswer,
  set: (value: string) => writingStore.updateAnswer(value),
})

const writingInstruction = computed(() => {
  if (writingStore.currentPage === 1) {
    return 'You should spend about 20 minutes on this task. Write at least 150 words.'
  } else if (writingStore.currentPage === 2) {
    return 'You should spend about 40 minutes on this task. Write at least 250 words.'
  }
  return ''
})

const writingTotalPages = computed(() => writingStore.test?.parts.length || 0)

const writingPartOrders = computed(() =>
  writingStore.test?.parts.map((p) => p.order).sort((a, b) => a - b) || [],
)

// Listening
const handleListeningQuestionChange = (questionNumber: number) => {
  currentQuestion.value = questionNumber
}

// Handle focus/click on inputs to update footer
const handleInputFocus = (e: Event) => {
  const target = e.target as HTMLElement

  if (target.classList.contains('gap-input')) {
    const gap = (target as HTMLInputElement).dataset.gap
    if (gap) currentQuestion.value = parseInt(gap, 10)
    return
  }

  if (target.classList.contains('match-dropzone') || target.closest('.match-dropzone')) {
    const dropzone = target.classList.contains('match-dropzone')
      ? target
      : target.closest('.match-dropzone')
    const gap = (dropzone as HTMLElement)?.dataset.gap
    if (gap) currentQuestion.value = parseInt(gap, 10)
    return
  }

  const mcQuestion = target.closest('[data-question-number]')
  if (mcQuestion) {
    const qNum = (mcQuestion as HTMLElement).dataset.questionNumber
    if (qNum) currentQuestion.value = parseInt(qNum, 10)
  }
}

onMounted(() => {
  document.addEventListener('focusin', handleInputFocus)
  document.addEventListener('click', handleInputFocus)
})

onUnmounted(() => {
  document.removeEventListener('focusin', handleInputFocus)
  document.removeEventListener('click', handleInputFocus)
})
</script>

<style scoped>
.preview-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f9fafb;
}

.preview-loading p {
  color: #374151;
  font-size: 16px;
  margin: 0;
}

.spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #dc2626;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-error {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f9fafb;
}

.preview-error p {
  color: #991b1b;
  font-size: 16px;
}

.back-link {
  color: #dc2626;
  font-weight: 500;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

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

.main-content.no-header-footer {
  top: 0;
  bottom: 0;
}

@media (max-width: 640px) {
  .main-content {
    top: var(--header-height, 52px);
    bottom: var(--footer-height, 120px);
  }

  .main-content.no-header-footer {
    top: 0;
    bottom: 0;
  }
}

.section-header {
  background: white;
  padding: 8px 24px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .section-header {
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

@media (max-width: 640px) {
  :deep(.passage-panel.mobile-hidden),
  :deep(.question-panel.mobile-hidden),
  :deep(.answer-panel.mobile-hidden) {
    display: none;
  }

  :deep(.passage-panel:not(.mobile-hidden)),
  :deep(.question-panel:not(.mobile-hidden)),
  :deep(.answer-panel:not(.mobile-hidden)) {
    width: 100% !important;
    flex: 1;
  }
}

.hide-mobile {
  display: flex;
}

@media (max-width: 640px) {
  .hide-mobile {
    display: none !important;
  }
}

:deep(.exam-header) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

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
