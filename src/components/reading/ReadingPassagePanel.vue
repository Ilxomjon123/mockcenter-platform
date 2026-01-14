<template>
  <div class="passage-panel" :style="{ width: `${width}%` }">
    <div ref="passageContainerRef" class="passage-content">
      <h2 class="passage-title">{{ passage?.title }}</h2>
      <div class="passage-text" v-html="processedContent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { ReadingTestRaw } from '@/types/reading'
import { useReadingStore } from '@/stores/readingStore'

type Part = ReadingTestRaw['parts'][0]

interface Props {
  width: number
  passage?: Part | null
}

const props = defineProps<Props>()
const readingStore = useReadingStore()
const passageContainerRef = ref<HTMLElement | null>(null)

// Get starting question number for each part
const getStartNumber = (partOrder: number): number => {
  switch (partOrder) {
    case 1: return 1
    case 2: return 14
    case 3: return 27
    default: return 1
  }
}

// Process passage content for [match] placeholders
const processedContent = computed(() => {
  if (!props.passage?.content) return ''

  const currentPart = readingStore.currentPart
  let gapCounter = getStartNumber(currentPart) - 1

  return props.passage.content
    .replace(/\[gap\]/g, () => {
      gapCounter++
      return `<input type="text" placeholder="${gapCounter}" class="gap-input" data-gap="${gapCounter}" style="width: 100px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; margin: 0 4px; text-align: center;">`
    })
    .replace(/\[match\]/g, () => {
      gapCounter++
      return `<span class="match-dropzone" draggable="true" data-match="${gapCounter}" data-gap="${gapCounter}"><span class="match-number">${gapCounter}</span><span class="match-value"></span></span>`
    })
})

// Handle input events for gap inputs
const handleGapInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.classList.contains('gap-input')) return

  const gap = target.dataset.gap
  if (gap) {
    readingStore.updateAnswer(parseInt(gap, 10), target.value)
  }
}

// Restore saved values
const restoreValues = () => {
  if (!passageContainerRef.value) return

  // Restore gap inputs
  const inputs = passageContainerRef.value.querySelectorAll<HTMLInputElement>('.gap-input')
  inputs.forEach((input) => {
    const gapNumber = input.dataset.gap
    if (!gapNumber) return

    const gapId = parseInt(gapNumber, 10)
    const savedValue = readingStore.answers[gapId]
    if (savedValue !== undefined) {
      input.value = String(savedValue)
    }
  })

  // Restore match dropzones and mark used options globally
  const dropzones = passageContainerRef.value.querySelectorAll<HTMLElement>('.match-dropzone')
  dropzones.forEach((dropzone) => {
    const matchNumber = dropzone.dataset.match
    if (!matchNumber) return

    const matchId = parseInt(matchNumber, 10)
    const savedValue = readingStore.answers[matchId]
    const valueEl = dropzone.querySelector('.match-value')
    if (savedValue !== undefined && valueEl) {
      valueEl.textContent = String(savedValue)
      dropzone.classList.add('has-value')

      // Mark option as used globally (might be in question panel)
      const usedOption = document.querySelector(
        `.draggable-option[data-option-key="${savedValue}"]`
      ) as HTMLElement
      if (usedOption) {
        usedOption.classList.add('used')
      }
    }
  })
}

onMounted(() => {
  if (passageContainerRef.value) {
    passageContainerRef.value.addEventListener('input', handleGapInput)
  }
  nextTick(restoreValues)
})

// Watch for content changes
watch(
  () => processedContent.value,
  () => {
    nextTick(restoreValues)
  }
)
</script>

<style scoped>
.passage-panel {
  background: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.passage-content {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
}

.passage-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.passage-text {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
}

.passage-text :deep(p) {
  margin-bottom: 16px;
}

/* Gap input styles */
.passage-text :deep(.gap-input) {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 0 4px;
  text-align: center;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease;
}

.passage-text :deep(.gap-input:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Match dropzone styles */
.passage-text :deep(.match-dropzone) {
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

.passage-text :deep(.match-dropzone:hover) {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.passage-text :deep(.match-dropzone.drag-over) {
  border-color: #3b82f6;
  border-style: dashed;
  background: #dbeafe;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.passage-text :deep(.match-dropzone.has-value) {
  border-style: solid;
  border-color: #d1d5db;
  background: #ffffff;
  cursor: grab;
}

.passage-text :deep(.match-dropzone.has-value:hover) {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.passage-text :deep(.match-dropzone.dragging-from) {
  opacity: 0.5;
  border-color: #3b82f6;
  border-style: dashed;
  cursor: grabbing;
}

.passage-text :deep(.match-dropzone.drop-animation) {
  animation: drop-bounce 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes drop-bounce {
  0% { transform: scale(1.05); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.passage-text :deep(.match-dropzone.remove-animation) {
  animation: shake-remove 0.15s ease-in-out;
}

@keyframes shake-remove {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.passage-text :deep(.match-number) {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.passage-text :deep(.match-dropzone.has-value .match-number) {
  display: none;
}

.passage-text :deep(.match-value) {
  font-weight: 500;
  color: #374151;
}
</style>
