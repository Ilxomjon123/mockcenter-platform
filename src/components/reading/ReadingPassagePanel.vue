<template>
  <div class="passage-panel" :style="{ width: `${width}%` }">
    <div ref="passageContainerRef" class="passage-content" @mouseup="handleMouseUp">
      <div class="passage-text" v-html="processedPassageContent"></div>
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
            v-for="color in colors"
            :key="color.name"
            class="color-btn"
            :style="{ backgroundColor: color.value }"
            :title="`Highlight ${color.name}`"
            @mousedown.prevent
            @click="applyHighlight(color.value)"
          ></button>
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
import { ref, onMounted, watch, nextTick } from 'vue'
import type { ReadingTestRaw } from '@/types/reading'
import { useReadingStore } from '@/stores/readingStore'
import { useReadingQuestionProcessor } from '@/composables/useReadingQuestionProcessor'

type Part = ReadingTestRaw['parts'][0]

interface Props {
  width: number
  passage?: Part | null
}

const colors = [
  { name: 'yellow', value: '#fef08a' },
  { name: 'green', value: '#bbf7d0' },
  { name: 'pink', value: '#fbcfe8' },
  { name: 'blue', value: '#bfdbfe' },
  { name: 'orange', value: '#fed7aa' },
  { name: 'purple', value: '#e9d5ff' },
  { name: 'red', value: '#fecaca' },
  { name: 'cyan', value: '#a5f3fc' },
]

defineProps<Props>()
const readingStore = useReadingStore()
const passageContainerRef = ref<HTMLElement | null>(null)

// Use central question processor
const { processedPassageContent, restoreGapValues, setupInputListener } =
  useReadingQuestionProcessor({
    containerRef: passageContainerRef,
  })

// Highlight state
const showToolbar = ref(false)
const toolbarStyle = ref({ top: '0px', left: '0px' })

const handleMouseUp = () => {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0)

    // Check if selection is within passage-text
    const container = passageContainerRef.value?.querySelector('.passage-text')
    if (container && container.contains(range.commonAncestorContainer)) {
      // Automatically apply yellow highlight immediately, without showing toolbar
      applyHighlight('#fef08a', range)
      // Clear selection after highlighting
      selection.removeAllRanges()
    }
  }
}

// Expand range to word boundaries
const expandRangeToWords = (range: Range): Range => {
  const newRange = range.cloneRange()

  // Expand start to word boundary
  const startNode = newRange.startContainer
  if (startNode.nodeType === Node.TEXT_NODE) {
    const text = startNode.textContent || ''
    let startOffset = newRange.startOffset

    // Move back to start of word
    while (
      startOffset > 0 &&
      text[startOffset - 1] !== undefined &&
      /\w/.test(text[startOffset - 1]!)
    ) {
      startOffset--
    }
    newRange.setStart(startNode, startOffset)
  }

  // Expand end to word boundary
  const endNode = newRange.endContainer
  if (endNode.nodeType === Node.TEXT_NODE) {
    const text = endNode.textContent || ''
    let endOffset = newRange.endOffset

    // Move forward to end of word
    while (
      endOffset < text.length &&
      text[endOffset] !== undefined &&
      /\w/.test(text[endOffset]!)
    ) {
      endOffset++
    }
    newRange.setEnd(endNode, endOffset)
  }

  return newRange
}

const applyHighlight = (color?: string, customRange?: Range) => {
  const selection = window.getSelection()
  if (!selection) return

  // Use provided range or get current selection range
  let range: Range
  if (customRange) {
    range = customRange
  } else {
    if (selection.rangeCount === 0) return
    range = selection.getRangeAt(0)
  }

  // Expand range to include full words
  range = expandRangeToWords(range)

  const commonAncestor = range.commonAncestorContainer

  // Check if selection is already within a highlight span
  let highlightNode: HTMLElement | null = null
  if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
    highlightNode = (commonAncestor as HTMLElement).closest('.passage-highlight')
  } else {
    highlightNode = (commonAncestor.parentElement as HTMLElement).closest('.passage-highlight')
  }

  // If already highlighted, remove the highlight
  if (highlightNode) {
    const parent = highlightNode.parentNode
    while (highlightNode.firstChild) {
      parent?.insertBefore(highlightNode.firstChild, highlightNode)
    }
    parent?.removeChild(highlightNode)

    // Save updated HTML to store
    const container = passageContainerRef.value?.querySelector('.passage-text')
    if (container) {
      readingStore.savePassageHtml(container.innerHTML)
    }

    selection.removeAllRanges()
    return
  }

  // Otherwise, apply new highlight
  const span = document.createElement('span')
  span.className = 'passage-highlight'
  // Use yellow as default color if not specified
  span.style.backgroundColor = color || '#fef08a'
  span.dataset.highlightId = Math.random().toString(36).substr(2, 9)

  try {
    const content = range.extractContents()
    span.appendChild(content)
    range.insertNode(span)

    // Save highlighted HTML to store for persistence
    const container = passageContainerRef.value?.querySelector('.passage-text')
    if (container) {
      readingStore.savePassageHtml(container.innerHTML)
    }

    // Clear selection after highlighting
    selection.removeAllRanges()
  } catch (e) {
    console.error('Could not apply highlight:', e)
  }
}

const removeHighlight = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const commonAncestor = range.commonAncestorContainer

  let highlightNode: HTMLElement | null = null
  if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
    highlightNode = (commonAncestor as HTMLElement).closest('.passage-highlight')
  } else {
    highlightNode = (commonAncestor.parentElement as HTMLElement).closest('.passage-highlight')
  }

  if (highlightNode) {
    const parent = highlightNode.parentNode
    while (highlightNode.firstChild) {
      parent?.insertBefore(highlightNode.firstChild, highlightNode)
    }
    parent?.removeChild(highlightNode)

    // Save updated HTML to store
    const container = passageContainerRef.value?.querySelector('.passage-text')
    if (container) {
      readingStore.savePassageHtml(container.innerHTML)
    }

    showToolbar.value = false
    selection.removeAllRanges()
  }
}

onMounted(() => {
  setupInputListener()
  nextTick(restoreGapValues)
})

// Watch for content changes to restore values
watch(
  () => processedPassageContent.value,
  () => {
    nextTick(restoreGapValues)
  },
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
  min-width: 80px;
  width: auto;
  max-width: 100%;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 0 4px;
  text-align: center;
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.15s ease,
    width 0.1s ease;
  box-sizing: content-box;
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

.passage-text :deep(.match-dropzone.remove-animation) {
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

.passage-text :deep(.passage-highlight) {
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.color-btn:hover {
  transform: scale(1.1);
  border-color: white;
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
</style>
