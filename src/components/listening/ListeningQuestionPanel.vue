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

        <!-- Two column layout when options exist -->
        <div v-if="hasOptions(question.options)" class="question-row">
          <div class="question-col">
            <div class="question-content" v-html="replaceGapsWithInputs(question.content)"></div>
          </div>
          <div class="question-col">
            <div v-if="question.options_title" class="options-title">{{ question.options_title }}</div>
            <div class="question-options" v-html="formatOptions(question.options)"></div>
          </div>
        </div>

        <!-- Single column when no options -->
        <div v-else class="question-content" v-html="replaceGapsWithInputs(question.content)"></div>
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
      return `<span class="match-dropzone" data-match="${gapCounter}" data-gap="${gapCounter}"><span class="match-number">${gapCounter}</span><span class="match-value"></span></span>`
    })
}

// Check if question has options
const hasOptions = (options: unknown): boolean => {
  if (!options) return false
  if (Array.isArray(options) && options.length > 0) return true
  if (typeof options === 'object' && Object.keys(options as object).length > 0) return true
  return false
}

// Format options for display (draggable)
const formatOptions = (options: unknown): string => {
  if (!options) return ''

  // If options is an array
  if (Array.isArray(options)) {
    return options
      .map((opt) => {
        return `<div class="option-item draggable-option" draggable="true" data-option-key="${opt}" data-option-value="${opt}">${opt}</div>`
      })
      .join('')
  }

  // If options is an object (key-value pairs)
  if (typeof options === 'object') {
    return Object.entries(options as Record<string, string>)
      .map(([key, value]) => `<div class="option-item draggable-option" draggable="true" data-option-key="${key}" data-option-value="${value}">${value}</div>`)
      .join('')
  }

  return String(options)
}

// Restore saved values to gap inputs and match dropzones
const restoreGapValues = () => {
  if (!questionsContainerRef.value) return

  // Restore gap inputs
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

  // Restore match dropzones
  const dropzones = questionsContainerRef.value.querySelectorAll<HTMLElement>('.match-dropzone')
  dropzones.forEach((dropzone) => {
    const matchNumber = dropzone.dataset.match
    if (!matchNumber) return

    const matchId = parseInt(matchNumber, 10)
    const savedValue = listeningStore.answers[matchId]
    const valueEl = dropzone.querySelector('.match-value')
    if (savedValue !== undefined && valueEl) {
      valueEl.textContent = String(savedValue)
      dropzone.classList.add('has-value')
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

// ============ DRAG AND DROP ============
let draggedOption: HTMLElement | null = null

const handleDragStart = (e: DragEvent) => {
  const target = e.target as HTMLElement
  if (!target.classList.contains('draggable-option')) return

  draggedOption = target
  target.classList.add('dragging')

  // Set drag data
  const optionKey = target.dataset.optionKey || ''
  e.dataTransfer?.setData('text/plain', optionKey)
}

const handleDragEnd = (e: DragEvent) => {
  const target = e.target as HTMLElement
  target.classList.remove('dragging')
  draggedOption = null
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  const target = e.target as HTMLElement
  const dropzone = target.closest('.match-dropzone') as HTMLElement
  if (dropzone) {
    dropzone.classList.add('drag-over')
  }
}

const handleDragLeave = (e: DragEvent) => {
  const target = e.target as HTMLElement
  const dropzone = target.closest('.match-dropzone') as HTMLElement
  if (dropzone) {
    dropzone.classList.remove('drag-over')
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const target = e.target as HTMLElement
  const dropzone = target.closest('.match-dropzone') as HTMLElement

  if (!dropzone || !draggedOption) return

  dropzone.classList.remove('drag-over')

  const matchNumber = dropzone.dataset.match
  const optionKey = draggedOption.dataset.optionKey

  if (matchNumber && optionKey) {
    // Update the dropzone display
    const valueEl = dropzone.querySelector('.match-value')
    if (valueEl) {
      valueEl.textContent = optionKey
      dropzone.classList.add('has-value')
    }

    // Save to store
    listeningStore.updateAnswer(parseInt(matchNumber, 10), optionKey)
  }
}

// Handle click on dropzone to clear it
const handleDropzoneClick = (e: Event) => {
  const target = e.target as HTMLElement
  const dropzone = target.closest('.match-dropzone') as HTMLElement

  if (!dropzone || !dropzone.classList.contains('has-value')) return

  const matchNumber = dropzone.dataset.match
  const valueEl = dropzone.querySelector('.match-value')

  if (matchNumber && valueEl) {
    // Clear the dropzone
    valueEl.textContent = ''
    dropzone.classList.remove('has-value')

    // Remove from store
    delete listeningStore.answers[parseInt(matchNumber, 10)]
    listeningStore.saveToStorage()
  }
}

// Setup event delegation on mount
onMounted(() => {
  if (questionsContainerRef.value) {
    // Input events
    questionsContainerRef.value.addEventListener('input', handleGapInput)

    // Drag and drop events
    questionsContainerRef.value.addEventListener('dragstart', handleDragStart)
    questionsContainerRef.value.addEventListener('dragend', handleDragEnd)
    questionsContainerRef.value.addEventListener('dragover', handleDragOver)
    questionsContainerRef.value.addEventListener('dragleave', handleDragLeave)
    questionsContainerRef.value.addEventListener('drop', handleDrop)
    questionsContainerRef.value.addEventListener('click', handleDropzoneClick)
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

.question-row {
  display: flex;
  gap: 24px;
}

.question-col {
  flex: 1;
  min-width: 0;
}

.question-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.8;
}

.options-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.question-options {
  font-size: 14px;
  color: #374151;
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.option-item {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.option-item:last-child {
  border-bottom: none;
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

/* Drag and Drop Styles */
.draggable-option {
  cursor: grab;
  user-select: none;
  transition: all 0.2s;
  padding: 8px 12px !important;
  border-radius: 4px;
  margin-bottom: 4px;
}

.draggable-option:hover {
  background: #e5e7eb;
}

.draggable-option.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.match-dropzone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 32px;
  padding: 4px 8px;
  margin: 0 4px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  vertical-align: middle;
  font-size: 14px;
}

.match-dropzone:hover {
  border-color: #9ca3af;
}

.match-dropzone.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.match-dropzone.has-value {
  border-color: #d1d5db;
  background: white;
}

.match-dropzone.has-value:hover {
  border-color: #ef4444;
}

.match-number {
  font-size: 14px;
  color: #9ca3af;
}

.match-dropzone.has-value .match-number {
  display: none;
}

.match-value {
  font-weight: 500;
  color: #374151;
}
</style>
