<template>
  <!-- Full screen loader / Play screen -->
  <AudioLoader
    :is-loading="isAudioLoading"
    :loaded-count="loadedCount"
    :total-audios="totalAudios"
    :is-started="isStarted"
    @play="startPlayback"
  />

  <!-- Listening completed modal -->
  <ListeningCompletedModal :is-visible="listeningStore.isCompleted" />

  <div class="question-panel">
    <div class="listening-header">
      <div class="header-info">
        <span class="part-label">Part {{ listeningStore.currentPart }}</span>
        <p class="instruction">
          Listen and answer questions {{ (listeningStore.currentPart - 1) * 10 + 1 }}–{{
            listeningStore.currentPart * 10
          }}.
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

    <!-- Display all questions in current part -->
    <div ref="questionsContainerRef" class="questions-container">
      <template v-for="question in processedQuestions" :key="question.id">
        <!-- Question with children -->
        <ParentQuestion
          v-if="question.children && question.children.length > 0"
          :question="question"
        />

        <!-- Regular question without children -->
        <QuestionItem v-else :question="question" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'
import { useListeningAudio } from '@/composables/useListeningAudio'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useQuestionProcessor } from '@/composables/useQuestionProcessor'
import AudioLoader from './AudioLoader.vue'
import ListeningCompletedModal from './ListeningCompletedModal.vue'
import { QuestionItem, ParentQuestion } from './questions'

const listeningStore = useListeningStore()

// Questions container ref
const questionsContainerRef = ref<HTMLElement | null>(null)

// Audio composable
const {
  visibleAudioRef,
  isAudioLoading,
  isStarted,
  loadedCount,
  totalAudios,
  startPlayback,
  onAudioCanPlay,
  onAudioTimeUpdate,
  onAudioEnded,
  onAudioPlay,
  onAudioPause,
} = useListeningAudio()

// Question processor composable
const { processedQuestions, restoreGapValues, setupInputListener } = useQuestionProcessor({
  containerRef: questionsContainerRef,
})

// Drag and drop composable
const { setupEventListeners: setupDragDropListeners } = useDragAndDrop({
  containerRef: questionsContainerRef,
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
  nextTick(restoreGapValues)

  // Add beforeunload listener
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
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

.header-info {
  background: #f1f2ed;
  padding: 10px 16px;
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

.questions-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
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
</style>
