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
            <div v-if="question.options_title" class="options-title">
              {{ question.options_title }}
            </div>
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
      return `<span class="match-dropzone" draggable="true" data-match="${gapCounter}" data-gap="${gapCounter}"><span class="match-number">${gapCounter}</span><span class="match-value"></span></span>`
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
        return `<span class="draggable-option" draggable="true" data-option-key="${opt}" data-option-value="${opt}">${opt}</span>`
      })
      .join('')
  }

  // If options is an object (key-value pairs)
  if (typeof options === 'object') {
    return Object.entries(options as Record<string, string>)
      .map(
        ([key, value]) =>
          `<span class="draggable-option" draggable="true" data-option-key="${key}" data-option-value="${value}">${value}</span>`,
      )
      .join('')
  }

  return String(options)
}

// Restore saved values to gap inputs and match dropzones
const restoreGapValues = () => {
  if (!questionsContainerRef.value) return

  // First, reset all options to visible
  const allOptions = questionsContainerRef.value.querySelectorAll<HTMLElement>('.draggable-option')
  allOptions.forEach((opt) => opt.classList.remove('used'))

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

  // Restore match dropzones and hide used options
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

      // Hide the used option
      const usedOption = questionsContainerRef.value?.querySelector(
        `.draggable-option[data-option-key="${savedValue}"]`
      ) as HTMLElement
      if (usedOption) {
        usedOption.classList.add('used')
      }
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
let sourceDropzone: HTMLElement | null = null // Track source dropzone when dragging from dropzone
let draggedValue: string | null = null // Track the value being dragged
let touchClone: HTMLElement | null = null
let currentDropzone: HTMLElement | null = null

// Create custom drag image
const createDragImage = (element: HTMLElement, text?: string): HTMLElement => {
  const clone = document.createElement('span')
  clone.classList.add('drag-ghost')
  clone.textContent = text || element.textContent || ''
  clone.style.position = 'fixed'
  clone.style.pointerEvents = 'none'
  clone.style.zIndex = '10000'
  clone.style.transform = 'rotate(3deg) scale(1.05)'
  clone.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)'
  clone.style.opacity = '0.95'
  document.body.appendChild(clone)
  return clone
}

const handleDragStart = (e: DragEvent) => {
  const target = e.target as HTMLElement

  // Check if dragging from an option
  if (target.classList.contains('draggable-option')) {
    draggedOption = target
    target.classList.add('dragging')
    draggedValue = target.dataset.optionKey || ''
    sourceDropzone = null

    e.dataTransfer?.setData('text/plain', draggedValue)

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      const dragImage = target.cloneNode(true) as HTMLElement
      dragImage.style.transform = 'rotate(3deg)'
      dragImage.style.opacity = '0.9'
      document.body.appendChild(dragImage)
      e.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2)
      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
    return
  }

  // Check if dragging from a dropzone with value
  const dropzone = target.closest('.match-dropzone') as HTMLElement
  if (dropzone && dropzone.classList.contains('has-value')) {
    const valueEl = dropzone.querySelector('.match-value')
    draggedValue = valueEl?.textContent || ''
    if (!draggedValue) return

    sourceDropzone = dropzone
    draggedOption = null
    dropzone.classList.add('dragging-from')

    e.dataTransfer?.setData('text/plain', draggedValue)

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      // Create drag image with the value text
      const dragImage = document.createElement('span')
      dragImage.textContent = draggedValue
      dragImage.style.padding = '10px 20px'
      dragImage.style.background = '#fff'
      dragImage.style.border = '1px solid #3b82f6'
      dragImage.style.borderRadius = '6px'
      dragImage.style.position = 'absolute'
      dragImage.style.top = '-1000px'
      document.body.appendChild(dragImage)
      e.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2)
      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
  }
}

const handleDragEnd = (e: DragEvent) => {
  const target = e.target as HTMLElement
  target.classList.remove('dragging')

  // Clear source dropzone state
  if (sourceDropzone) {
    sourceDropzone.classList.remove('dragging-from')
  }

  draggedOption = null
  sourceDropzone = null
  draggedValue = null

  // Clear all drag-over states
  document.querySelectorAll('.match-dropzone.drag-over').forEach((el) => {
    el.classList.remove('drag-over')
  })
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  const target = e.target as HTMLElement
  const dropzone = target.closest('.match-dropzone') as HTMLElement
  // Don't highlight source dropzone
  if (dropzone && dropzone !== sourceDropzone) {
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

  // Need either draggedOption or sourceDropzone, and a valid dropzone
  if (!dropzone || (!draggedOption && !sourceDropzone)) return
  // Can't drop on the same dropzone
  if (dropzone === sourceDropzone) return

  dropzone.classList.remove('drag-over')
  dropzone.classList.add('drop-animation')
  setTimeout(() => dropzone.classList.remove('drop-animation'), 300)

  const matchNumber = dropzone.dataset.match

  if (matchNumber && draggedValue) {
    // If target dropzone already has a value, restore that option
    const oldValue = dropzone.querySelector('.match-value')?.textContent
    if (oldValue) {
      showOptionByKey(oldValue)
    }

    // Update the target dropzone display
    const valueEl = dropzone.querySelector('.match-value')
    if (valueEl) {
      valueEl.textContent = draggedValue
      dropzone.classList.add('has-value')
    }

    // Save to store
    listeningStore.updateAnswer(parseInt(matchNumber, 10), draggedValue)

    // Handle source: either an option or another dropzone
    if (draggedOption) {
      // Dragging from option list - hide it
      draggedOption.classList.add('used')
    } else if (sourceDropzone) {
      // Dragging from another dropzone - clear the source
      const sourceValueEl = sourceDropzone.querySelector('.match-value')
      const sourceMatchNumber = sourceDropzone.dataset.match
      if (sourceValueEl) {
        sourceValueEl.textContent = ''
      }
      sourceDropzone.classList.remove('has-value', 'dragging-from')

      // Remove from store
      if (sourceMatchNumber) {
        delete listeningStore.answers[parseInt(sourceMatchNumber, 10)]
        listeningStore.saveToStorage()
      }
    }
  }
}

// Helper to show option by key
const showOptionByKey = (key: string) => {
  if (!questionsContainerRef.value) return
  const option = questionsContainerRef.value.querySelector(
    `.draggable-option[data-option-key="${key}"]`
  ) as HTMLElement
  if (option) {
    option.classList.remove('used')
  }
}

// ============ TOUCH SUPPORT ============
const handleTouchStart = (e: TouchEvent) => {
  const target = e.target as HTMLElement

  const touch = e.touches[0]
  if (!touch) return

  // Check if touching an option
  const option = target.closest('.draggable-option') as HTMLElement
  if (option) {
    draggedOption = option
    draggedValue = option.dataset.optionKey || ''
    sourceDropzone = null
    option.classList.add('touch-dragging')

    touchClone = createDragImage(option, draggedValue)
    touchClone.style.left = `${touch.clientX - 60}px`
    touchClone.style.top = `${touch.clientY - 20}px`
    return
  }

  // Check if touching a dropzone with value
  const dropzone = target.closest('.match-dropzone') as HTMLElement
  if (dropzone && dropzone.classList.contains('has-value')) {
    const valueEl = dropzone.querySelector('.match-value')
    draggedValue = valueEl?.textContent || ''
    if (!draggedValue) return

    sourceDropzone = dropzone
    draggedOption = null
    dropzone.classList.add('dragging-from')

    touchClone = createDragImage(dropzone, draggedValue)
    touchClone.style.left = `${touch.clientX - 60}px`
    touchClone.style.top = `${touch.clientY - 20}px`
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if ((!draggedOption && !sourceDropzone) || !touchClone) return

  e.preventDefault()
  const touch = e.touches[0]
  if (!touch) return

  // Move the clone
  touchClone.style.left = `${touch.clientX - 60}px`
  touchClone.style.top = `${touch.clientY - 20}px`

  // Find dropzone under touch point
  touchClone.style.display = 'none'
  const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY)
  touchClone.style.display = ''

  const dropzone = elementUnder?.closest('.match-dropzone') as HTMLElement

  // Update drag-over states
  if (currentDropzone && currentDropzone !== dropzone) {
    currentDropzone.classList.remove('drag-over')
  }

  // Don't highlight source dropzone
  if (dropzone && dropzone !== sourceDropzone) {
    dropzone.classList.add('drag-over')
    currentDropzone = dropzone
  } else {
    currentDropzone = null
  }
}

const handleTouchEnd = () => {
  if (!draggedOption && !sourceDropzone) return

  // Clean up dragging states
  if (draggedOption) {
    draggedOption.classList.remove('touch-dragging')
  }
  if (sourceDropzone) {
    sourceDropzone.classList.remove('dragging-from')
  }

  // Remove clone
  if (touchClone) {
    touchClone.remove()
    touchClone = null
  }

  // Handle drop if over a valid dropzone
  if (currentDropzone && currentDropzone !== sourceDropzone) {
    currentDropzone.classList.remove('drag-over')
    currentDropzone.classList.add('drop-animation')
    setTimeout(() => currentDropzone?.classList.remove('drop-animation'), 300)

    const matchNumber = currentDropzone.dataset.match

    if (matchNumber && draggedValue) {
      // If target dropzone already has a value, restore that option
      const oldValue = currentDropzone.querySelector('.match-value')?.textContent
      if (oldValue) {
        showOptionByKey(oldValue)
      }

      const valueEl = currentDropzone.querySelector('.match-value')
      if (valueEl) {
        valueEl.textContent = draggedValue
        currentDropzone.classList.add('has-value')
      }

      listeningStore.updateAnswer(parseInt(matchNumber, 10), draggedValue)

      // Handle source
      if (draggedOption) {
        draggedOption.classList.add('used')
      } else if (sourceDropzone) {
        const sourceValueEl = sourceDropzone.querySelector('.match-value')
        const sourceMatchNumber = sourceDropzone.dataset.match
        if (sourceValueEl) {
          sourceValueEl.textContent = ''
        }
        sourceDropzone.classList.remove('has-value')

        if (sourceMatchNumber) {
          delete listeningStore.answers[parseInt(sourceMatchNumber, 10)]
          listeningStore.saveToStorage()
        }
      }
    }
  }

  draggedOption = null
  sourceDropzone = null
  draggedValue = null
  currentDropzone = null
}

// Handle click on dropzone to clear it
const handleDropzoneClick = (e: Event) => {
  const target = e.target as HTMLElement
  const dropzone = target.closest('.match-dropzone') as HTMLElement

  if (!dropzone || !dropzone.classList.contains('has-value')) return

  // Add remove animation
  dropzone.classList.add('remove-animation')

  const matchNumber = dropzone.dataset.match
  const valueEl = dropzone.querySelector('.match-value')
  const currentValue = valueEl?.textContent

  if (matchNumber && valueEl) {
    setTimeout(() => {
      // Show the option back
      if (currentValue) {
        showOptionByKey(currentValue)
      }

      // Clear the dropzone
      valueEl.textContent = ''
      dropzone.classList.remove('has-value', 'remove-animation')

      // Remove from store
      delete listeningStore.answers[parseInt(matchNumber, 10)]
      listeningStore.saveToStorage()
    }, 150)
  }
}

// Setup event delegation on mount
onMounted(() => {
  if (questionsContainerRef.value) {
    // Input events
    questionsContainerRef.value.addEventListener('input', handleGapInput)

    // Drag and drop events (mouse)
    questionsContainerRef.value.addEventListener('dragstart', handleDragStart)
    questionsContainerRef.value.addEventListener('dragend', handleDragEnd)
    questionsContainerRef.value.addEventListener('dragover', handleDragOver)
    questionsContainerRef.value.addEventListener('dragleave', handleDragLeave)
    questionsContainerRef.value.addEventListener('drop', handleDrop)
    questionsContainerRef.value.addEventListener('click', handleDropzoneClick)

    // Touch events for mobile
    questionsContainerRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    questionsContainerRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    questionsContainerRef.value.addEventListener('touchend', handleTouchEnd)
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
      const totalParts = newTest.parts.filter((p) => p.file).length
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
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
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

/* Drag and Drop Styles - using :deep() for v-html content */
:deep(.draggable-option) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 6px 14px;
  border-radius: 4px;
  margin: 4px 0;
  background: #ffffff;
  border: 1px solid #d1d5db;
  font-size: 13px;
  color: #374151;
  -webkit-touch-callout: none;
  touch-action: none;
}

:deep(.draggable-option:hover) {
  border-color: #9ca3af;
  background: #f9fafb;
  cursor: grab;
}

:deep(.draggable-option:active) {
  cursor: grabbing;
}

:deep(.draggable-option.dragging) {
  opacity: 0.5;
  cursor: grabbing;
  border-color: #3b82f6;
  background: #eff6ff;
}

:deep(.draggable-option.touch-dragging) {
  opacity: 0.5;
}

:deep(.draggable-option.used) {
  display: none;
}

/* Drag ghost (for touch) */
:global(.drag-ghost) {
  padding: 6px 14px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #3b82f6;
  font-size: 13px;
  color: #374151;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

:deep(.match-dropzone) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 32px;
  padding: 4px 12px;
  margin: 0 4px;
  border: 1px dashed #9ca3af;
  border-radius: 4px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  vertical-align: middle;
  font-size: 13px;
  position: relative;
}

:deep(.match-dropzone:hover) {
  border-color: #3b82f6;
  background: #f0f9ff;
}

:deep(.match-dropzone.drag-over) {
  border-color: #3b82f6;
  border-style: dashed;
  background: #dbeafe;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

:deep(.match-dropzone.has-value) {
  border-style: solid;
  border-color: #d1d5db;
  background: #ffffff;
  cursor: grab;
}

:deep(.match-dropzone.has-value:hover) {
  border-color: #3b82f6;
  background: #f0f9ff;
}

:deep(.match-dropzone.dragging-from) {
  opacity: 0.5;
  border-color: #3b82f6;
  border-style: dashed;
  cursor: grabbing;
}

/* Drop animation */
:deep(.match-dropzone.drop-animation) {
  animation: drop-bounce 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes drop-bounce {
  0% {
    transform: scale(1.05);
  }
  50% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

/* Remove animation */
:deep(.match-dropzone.remove-animation) {
  animation: shake-remove 0.15s ease-in-out;
}

@keyframes shake-remove {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

:deep(.match-number) {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

:deep(.match-dropzone.has-value .match-number) {
  display: none;
}

:deep(.match-value) {
  font-weight: 500;
  color: #374151;
}
</style>
