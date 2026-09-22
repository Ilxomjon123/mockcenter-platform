<template>
  <!-- Full screen loader / Play screen -->
  <AudioLoader
    :is-loading="isAudioLoading"
    :loaded-count="loadedCount"
    :total-audios="totalAudios"
    :is-started="isStarted"
    @play="startPlayback"
  />

  <!-- Transfer time modal (shown when all audios finish) -->
  <TransferTimeModal :is-visible="showTransferTimeModal" @start="handleStartTransferTime" />

  <!-- Listening completed modal -->
  <ListeningCompletedModal :is-visible="listeningStore.isCompleted" />

  <div class="question-panel">
    <div class="listening-header">
      <div class="header-info">
        <span class="part-label">{{ $t('footer.part', { part: listeningStore.currentPart }) }}</span>
        <p class="instruction">
          {{ $t('listening.listenAndAnswer', { start: currentPartRange.start, end: currentPartRange.end }) }}
        </p>
      </div>
    </div>

    <!-- Main audio player (hidden) -->
    <audio
      ref="visibleAudioRef"
      style="display: none"
      @ended="onAudioEnded"
      @play="onAudioPlay"
      @pause="onAudioPause"
      @canplay="onAudioCanPlay"
      @timeupdate="onAudioTimeUpdate"
    ></audio>

    <!-- Main content area -->
    <div
      ref="questionsContainerRef"
      class="questions-container"
      :class="{ 'has-part-media': !!partImageMatch }"
      @mouseup="handleMouseUp"
    >
      <!-- Split layout: Image on the LEFT, instructions and questions on the RIGHT -->
      <div v-if="partImageMatch" class="media-split-layout">
        <!-- Left: Map / Diagram (standalone image without outer card) -->
        <div class="media-split-left" v-html="partImageMatch"></div>

        <!-- Right: Instructions and Questions -->
        <div class="media-split-right">
          <div v-if="partTextContent" class="compact-intro-text" v-html="partTextContent"></div>
          <div class="questions-list-wrapper">
            <template v-for="question in processedQuestions" :key="question.id">
              <ParentQuestion
                v-if="question.children && question.children.length > 0"
                :question="question"
              />
              <QuestionItem v-else :question="question" />
            </template>
          </div>
        </div>
      </div>

      <!-- Standard layout (Parts without images) -->
      <template v-else>
        <div
          v-if="currentPartContent"
          class="part-intro-content"
          v-html="currentPartContent"
        ></div>

        <template v-for="question in processedQuestions" :key="question.id">
          <ParentQuestion
            v-if="question.children && question.children.length > 0"
            :question="question"
          />
          <QuestionItem v-else :question="question" />
        </template>
      </template>
    </div>


    <!-- Highlight Toolbar -->
    <Teleport to="body">
      <div
        v-if="showToolbar"
        class="highlight-toolbar"
        :style="{
          top: toolbarStyle.top,
          left: toolbarStyle.left,
          transform: 'translateX(-50%)',
        }"
      >
        <div class="color-options">
          <button
            class="color-btn"
            :style="{ backgroundColor: '#fef08a' }"
            title="Highlight"
            @mousedown.prevent
            @click="applyHighlight('#fef08a')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="color: #854d0e"
            >
              <path d="m9 11-6 6v3h9l3-3" />
              <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
            </svg>
          </button>
          <div class="divider"></div>
          <button
            class="clear-btn"
            title="Remove Highlight"
            @mousedown.prevent
            @click="removeHighlight"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
        <div class="toolbar-arrow"></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted, watch, nextTick } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import { useListeningAudio } from '@/composables/useListeningAudio'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useQuestionProcessor } from '@/composables/useQuestionProcessor'
import { useTextHighlight } from '@/composables/useTextHighlight'
import { sanitizeHtml } from '@/utils/sanitize'
import AudioLoader from './AudioLoader.vue'
import ListeningCompletedModal from './ListeningCompletedModal.vue'
import TransferTimeModal from './TransferTimeModal.vue'
import { QuestionItem, ParentQuestion } from './questions'

const listeningStore = useListeningStore()

// Questions container ref
const questionsContainerRef = ref<HTMLElement | null>(null)

// Question range for the current part, from the same source of truth as ExamFooter
const currentPartRange = computed(() => {
  const stats = listeningStore.partStats[listeningStore.currentPart]
  return stats ?? { start: 0, end: 0 }
})

const currentPartContent = computed(() => {
  const part = listeningStore.test?.parts?.find(
    (p) => p.order === listeningStore.currentPart
  )
  // Server HTML is sanitized: <audio>, scripts and event handlers are dropped,
  // <img> is kept with a safe src (the backend makes /storage URLs absolute).
  const content = sanitizeHtml(part?.content || '').replace(/<p>\s*<\/p>/gi, '')
  return content.trim()
})

const partImageMatch = computed(() => {
  const match = currentPartContent.value.match(/<img\b[^>]*>/i)
  if (!match) return null
  // Strip inline border, shadow and container styles so the image stands on its own ("o'zi tursin")
  return match[0].replace(/\s*style="[^"]*"/gi, '')
})

const partTextContent = computed(() => {
  if (!partImageMatch.value) return currentPartContent.value
  return currentPartContent.value
    .replace(/<div\b[^>]*>\s*<img\b[^>]*>\s*<\/div>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim()
})

// Audio composable
const {
  visibleAudioRef,
  isAudioLoading,
  isStarted,
  loadedCount,
  totalAudios,
  allAudiosFinished,
  startPlayback,
  onAudioCanPlay,
  onAudioTimeUpdate,
  onAudioEnded,
  onAudioPlay,
  onAudioPause,
} = useListeningAudio()

// Transfer time modal
const showTransferTimeModal = ref(false)

// Watch for all audios finished to show transfer time modal
watch(allAudiosFinished, (finished) => {
  if (finished && !listeningStore.isInTransferTime && !listeningStore.isCompleted) {
    showTransferTimeModal.value = true
  }
})

// Handle start transfer time
const handleStartTransferTime = () => {
  showTransferTimeModal.value = false
  allAudiosFinished.value = false
  listeningStore.startTransferTime()
}

// Question processor composable
const { processedQuestions, restoreGapValues, setupInputListener } = useQuestionProcessor({
  containerRef: questionsContainerRef,
})

// Drag and drop composable
const {
  setupEventListeners: setupDragDropListeners,
  cleanupEventListeners: cleanupDragDropListeners,
} = useDragAndDrop({
  containerRef: questionsContainerRef,
})

// Text highlighting (selection toolbar, restore-on-mount, apply/remove) - shared composable
const {
  showToolbar,
  toolbarStyle,
  restoreQuestionHighlights,
  handleMouseUp,
  applyHighlight,
  removeHighlight,
  handleClickOutside,
} = useTextHighlight({
  containerRef: questionsContainerRef,
  getSavedHtml: () => listeningStore.questionHighlights[listeningStore.currentPart],
  onSave: (html) => listeningStore.saveQuestionHtml(html),
})

// Prevent page refresh/close during listening test
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (isStarted.value) {
    e.preventDefault()
    // Modern browsers require returnValue to be set
    e.returnValue = ''
    return ''
  }
}

// Setup event delegation on mount
onMounted(() => {
  setupInputListener()
  setupDragDropListeners()
  restoreGapValues()
  nextTick(restoreQuestionHighlights)

  // Add beforeunload listener
  window.addEventListener('beforeunload', handleBeforeUnload)
  // Add click outside listener for toolbar
  document.addEventListener('mousedown', handleClickOutside)
})

// Watch for part changes to restore highlights
watch(
  () => listeningStore.currentPart,
  () => {
    nextTick(restoreQuestionHighlights)
  },
)

// Document-level drag listeners need the container ref, which is gone after unmount
onBeforeUnmount(() => {
  cleanupDragDropListeners()
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
.question-panel {
  flex: 1;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.listening-header {
  background: white;
  padding: 8px 24px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .listening-header {
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

.questions-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

@media (max-width: 640px) {
  .questions-container {
    padding: 0 8px;
  }
}

/* Global drag ghost style */
:global(.drag-ghost) {
  padding: 6px 14px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #3b82f6;
  font-size: 13px;
  color: #374151;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* Question highlight style */
:deep(.question-highlight) {
  border-radius: 2px;
  padding: 2px 0;
  transition: background-color 0.2s ease;
}

/* Highlight Toolbar Styles */
.highlight-toolbar {
  position: absolute;
  z-index: 9999;
  background: #1f2937;
  border-radius: 8px;
  padding: 6px;
  display: flex;
  align-items: center;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  pointer-events: auto;
}

.color-options {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-btn:hover {
  transform: scale(1.1);
  border-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.divider {
  width: 1px;
  height: 20px;
  background: #4b5563;
  margin: 0 4px;
}

.clear-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #374151;
  color: #ef4444;
}

.toolbar-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #1f2937;
}

.part-intro-content {
  padding: 20px 32px;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
}

.part-intro-content :deep(img) {
  display: block;
  margin: 16px auto;
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
}

.part-intro-content :deep(audio),
:deep(audio) {
  display: none !important;
}

/* Side-by-side Media Split Layout (Part 4 Map / Images) */
.media-split-layout {
  display: grid;
  grid-template-columns: minmax(360px, 1.15fr) minmax(380px, 1fr);
  gap: 20px;
  padding: 16px 24px;
  max-width: 1560px;
  margin: 0 auto;
  align-items: start;
}

.media-split-left {
  position: sticky;
  top: 12px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.media-split-left :deep(img) {
  display: block;
  max-width: 100%;
  width: auto;
  max-height: calc(100vh - 180px);
  min-height: 220px;
  height: auto;
  object-fit: contain;
  border: none !important;
  border-radius: 4px;
  box-shadow: none !important;
  background: transparent !important;
  outline: none !important;
}

.media-split-left :deep(div) {
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.media-split-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.media-split-right :deep(.matching-group-container) {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.media-split-right :deep(.question-item) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.compact-intro-text {
  font-size: 13.5px;
  line-height: 1.55;
  color: #475569;
  padding: 2px 4px 6px 4px;
}

.compact-intro-text :deep(p) {
  margin: 0 0 6px 0;
}

.compact-intro-text :deep(p:last-child) {
  margin-bottom: 0;
}

@media (max-width: 1024px) {
  .media-split-layout {
    grid-template-columns: 1fr;
  }
  .media-split-left {
    position: static;
  }
  .media-split-left :deep(img) {
    max-height: 340px;
  }
}
</style>
