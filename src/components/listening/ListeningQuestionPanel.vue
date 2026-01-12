<template>
  <!-- Full screen loader -->
  <div v-if="isAudioLoading" class="audio-loader-overlay">
    <div class="loader-content">
      <div class="spinner"></div>
      <p class="loader-text">Audiolar yuklanmoqda... ({{ loadedCount }}/{{ totalAudios }})</p>
    </div>
  </div>

  <div class="question-panel">
    <div class="questions-header">
      <h3 class="questions-title">Part {{ listeningStore.currentPart }}</h3>
      <p class="questions-instruction">
        Listen and answer questions {{ (listeningStore.currentPart - 1) * 10 + 1 }}–{{
          listeningStore.currentPart * 10
        }}.
      </p>
    </div>

    <audio
      ref="visibleAudioRef"
      style="display: none"
      @ended="onAudioEnded"
      @play="onAudioPlay"
      @pause="onAudioPause"
    ></audio>

    <!-- Hidden audio elements for preloading -->
    <div style="display: none">
      <audio
        v-for="(url, index) in audioUrls"
        :key="index"
        :ref="(el) => setAudioRef(el as HTMLAudioElement, index)"
        :src="url"
        preload="auto"
        @canplaythrough="onAudioLoaded(index)"
        @error="onAudioError(index)"
      ></audio>
    </div>

    <!-- Display all questions in current part -->
    <div ref="questionsContainerRef" class="questions-container">
      <div
        v-for="question in listeningStore.currentQuestions"
        :key="question.id"
        class="question-item"
      >
        <div class="question-text" v-html="question.title"></div>

        <div class="question-text" v-html="replaceGapsWithInputs(question.content)"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'

const listeningStore = useListeningStore()

// Questions container ref
const questionsContainerRef = ref<HTMLElement | null>(null)

const replaceGapsWithInputs = (text: string | null | unknown): string => {
  if (!text || typeof text !== 'string') return ''
  let gapCounter = (listeningStore.currentPart - 1) * 10

  return text
    .replace(/\[gap\]/g, () => {
      gapCounter++
      return `<input type="text" placeholder="${gapCounter}" class="gap-input" data-gap="${gapCounter}" style="width: 100px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; margin: 0 4px; text-align: center;">`
    })
    .replace(/\[match\]/g, () => {
      gapCounter++
      return `<input type="text" disabled placeholder="${gapCounter}" class="gap-input" data-gap="${gapCounter}" style="width: 100px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; margin: 0 4px; text-align: center;">`
    })
}

// Restore saved values to gap inputs
const restoreGapValues = () => {
  if (!questionsContainerRef.value) return

  const inputs = questionsContainerRef.value.querySelectorAll<HTMLInputElement>('.gap-input')
  inputs.forEach((input) => {
    const gapNumber = input.dataset.gap
    if (!gapNumber) return

    const gapId = parseInt(gapNumber, 10)
    const savedValue = listeningStore.answers[gapId]
    if (savedValue !== undefined) {
      input.value = String(savedValue)
    }
  })
}

// Handle input events using event delegation
const handleGapInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.classList.contains('gap-input')) return

  const gap = target.dataset.gap
  if (gap) {
    listeningStore.updateAnswer(parseInt(gap, 10), target.value)
  }
}

// Setup event delegation on mount
onMounted(() => {
  if (questionsContainerRef.value) {
    questionsContainerRef.value.addEventListener('input', handleGapInput)
  }
  nextTick(restoreGapValues)
})

// Watch for part/questions changes to restore values
watch(
  () => [listeningStore.currentPart, listeningStore.currentQuestions],
  () => {
    nextTick(restoreGapValues)
  },
  { deep: true },
)

// ============ AUDIO HANDLING ============

// Get all audio URLs from parts
const audioUrls = computed(() => {
  if (!listeningStore.test?.parts) return []
  return [...listeningStore.test.parts]
    .sort((a, b) => a.order - b.order)
    .map((p) => p.file)
    .filter((url): url is string => !!url)
})

const totalAudios = computed(() => audioUrls.value.length)

// Audio refs storage
const audioElements = ref<(HTMLAudioElement | null)[]>([])
const visibleAudioRef = ref<HTMLAudioElement | null>(null)

const setAudioRef = (el: HTMLAudioElement | null, index: number) => {
  if (el) {
    audioElements.value[index] = el
  }
}

// Loading state
const isAudioLoading = ref(true)
const loadedAudios = ref<Set<number>>(new Set())
const loadedCount = computed(() => loadedAudios.value.size)

// Current playing audio index (from store for persistence)
const currentAudioIndex = computed(() => listeningStore.currentAudioIndex)
const isAllAudiosFinished = ref(false)
const isPlaying = ref(false)

// Mark audio as loaded
const onAudioLoaded = (index: number) => {
  loadedAudios.value.add(index)

  // Check if all audios are loaded
  if (loadedAudios.value.size >= totalAudios.value && totalAudios.value > 0) {
    isAudioLoading.value = false
    // Start playing first audio
    startPlayback()
  }
}

const onAudioError = (index: number) => {
  console.error(`Audio ${index + 1} yuklanmadi`)
  // Still mark as "loaded" to not block other audios
  loadedAudios.value.add(index)

  if (loadedAudios.value.size >= totalAudios.value && totalAudios.value > 0) {
    isAudioLoading.value = false
    startPlayback()
  }
}

// Start playback from current index
const startPlayback = () => {
  if (isAllAudiosFinished.value) return

  const audioEl = audioElements.value[currentAudioIndex.value]
  if (audioEl && visibleAudioRef.value) {
    // Set the source of visible audio to current audio's source
    visibleAudioRef.value.src = audioEl.src
    visibleAudioRef.value.load()
    visibleAudioRef.value.play().catch((err) => {
      console.log('Autoplay blocked:', err)
    })
  }
}

// Handle audio ended - play next
const onAudioEnded = () => {
  const nextIndex = currentAudioIndex.value + 1

  if (nextIndex < totalAudios.value) {
    listeningStore.setAudioIndex(nextIndex)
    startPlayback()
  } else {
    // All audios finished
    isAllAudiosFinished.value = true
    isPlaying.value = false
    alert("Barcha audiolar tugadi! Listening bo'limi yakunlandi.")
  }
}

const onAudioPlay = () => {
  isPlaying.value = true
}

const onAudioPause = () => {
  isPlaying.value = false
}

// Watch for test data to initialize
watch(
  () => listeningStore.test,
  (newTest) => {
    if (newTest?.parts?.length) {
      // Reset loading state (but keep currentAudioIndex from store)
      loadedAudios.value = new Set()
      isAudioLoading.value = true

      // Check if all audios are already finished
      const totalParts = newTest.parts.filter(p => p.file).length
      if (currentAudioIndex.value >= totalParts && totalParts > 0) {
        isAllAudiosFinished.value = true
      } else {
        isAllAudiosFinished.value = false
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped>
/* Full screen loader overlay */
.audio-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.question-panel {
  flex: 1;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.questions-header {
  background: white;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.questions-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.questions-instruction {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.audio-container {
  background: white;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e5e5;
}

.audio-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.audio-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.audio-finished {
  font-size: 12px;
  color: #10b981;
  background: #d1fae5;
  padding: 2px 8px;
  border-radius: 4px;
}

.audio-player {
  width: 100%;
  max-width: 500px;
}

.questions-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.question-item {
  padding: 24px 32px;
  border-bottom: 1px solid #e5e5e5;
  background: white;
}

.question-text {
  font-size: 14px;
  color: #374151;
  margin: 0 0 12px 0;
}

.question-number {
  font-weight: 600;
  margin-right: 8px;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.option-label input[type='radio'] {
  cursor: pointer;
}

.fill-blank,
.matching-section {
  margin-top: 8px;
}

.blank-input {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.blank-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
