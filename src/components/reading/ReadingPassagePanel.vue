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
import { ref, onMounted, watch, nextTick } from 'vue'
import type { ReadingTestRaw } from '@/types/reading'
import { useReadingStore } from '@/stores/readingStore'
import { useReadingQuestionProcessor } from '@/composables/useReadingQuestionProcessor'

type Part = ReadingTestRaw['parts'][0]

interface Props {
  width: number
  passage?: Part | null
}

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
let savedRange: Range | null = null

const handleMouseUp = () => {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0)

    // Check if selection is within passage-text
    const container = passageContainerRef.value?.querySelector('.passage-text')
    if (container && container.contains(range.commonAncestorContainer)) {
      // Don't show toolbar if selection is within an input
      const ancestor = range.commonAncestorContainer
      const parentElement =
        ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : (ancestor as Element)
      if (parentElement?.closest('input, select, textarea')) {
        return
      }

      // Save the range for later use
      savedRange = range.cloneRange()

      // Get selection position
      const rect = range.getBoundingClientRect()
      const toolbarHeight = 48 // Approximate toolbar height

      // Position toolbar above the selection
      toolbarStyle.value = {
        top: `${rect.top + window.scrollY - toolbarHeight - 8}px`,
        left: `${rect.left + rect.width / 2 + window.scrollX}px`,
      }

      showToolbar.value = true
    }
  } else {
    // Hide toolbar when selection is cleared
    showToolbar.value = false
    savedRange = null
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

const applyHighlight = (color: string) => {
  if (!savedRange) return

  const range = expandRangeToWords(savedRange)
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

    showToolbar.value = false
    savedRange = null
    window.getSelection()?.removeAllRanges()
    return
  }

  // Otherwise, apply new highlight
  const span = document.createElement('span')
  span.className = 'passage-highlight'
  span.style.backgroundColor = color
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

    // Clear selection and hide toolbar
    showToolbar.value = false
    savedRange = null
    window.getSelection()?.removeAllRanges()
  } catch (e) {
    console.error('Could not apply highlight:', e)
  }
}

const removeHighlight = () => {
  if (!savedRange) return

  const commonAncestor = savedRange.commonAncestorContainer

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
    savedRange = null
    window.getSelection()?.removeAllRanges()
  }
}

// Hide toolbar when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.highlight-toolbar') && !target.closest('.passage-text')) {
    showToolbar.value = false
    savedRange = null
  }
}

onMounted(() => {
  setupInputListener()
  nextTick(restoreGapValues)
  document.addEventListener('mousedown', handleClickOutside)
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

@media (max-width: 640px) {
  .passage-panel {
    width: 100% !important;
  }
}

.passage-content {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
  font-family: Arial, sans-serif;
}

@media (max-width: 640px) {
  .passage-content {
    padding: 16px;
  }
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
  font-family: Arial, sans-serif;
}

.passage-text :deep(p) {
  margin-bottom: 16px;
}

.passage-text :deep(h1),
.passage-text :deep(h2),
.passage-text :deep(h3),
.passage-text :deep(h4),
.passage-text :deep(h5),
.passage-text :deep(h6) {
  font-weight: 600;
  margin: 24px 0 12px;
  font-size: 15px;
  color: #1f2937;
}

/* Part instruction card styles - visible in full-width Part 1, hidden in split-panel parts 2-5 */
.full-width-passage .passage-text :deep(.part-instruction-card) {
  display: block !important;
  margin-bottom: 22px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: none;
}

.full-width-passage .passage-text :deep(.instruction-badge) {
  display: inline-block;
  font-weight: 700;
  font-size: 14px;
  color: #1e293b;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}

.full-width-passage .passage-text :deep(.instruction-text) {
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
  margin: 0;
}

.passage-panel:not(.full-width-passage) .passage-text :deep(.part-instruction-card) {
  display: none !important;
}

/* Article title & paragraphs */
.passage-text :deep(.reading-article-title) {
  font-weight: 700;
  font-size: 17px;
  color: #0f172a;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.passage-text :deep(.reading-paragraph) {
  margin-bottom: 16px;
  font-size: 15px;
  line-height: 1.8;
  color: #334155;
}

/* Paragraph header with dropzone for Part 3 Heading Matching */
.passage-text :deep(.paragraph-header-with-dropzone) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.passage-text :deep(.paragraph-badge) {
  font-weight: 700;
  font-size: 13.5px;
  color: #1e293b;
  flex-shrink: 0;
}

.passage-text :deep(.match-dropzone.heading-dropzone) {
  display: inline-flex;
  align-items: center;
  min-width: 220px;
  min-height: 34px;
  padding: 4px 10px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  text-align: left;
}

.passage-text :deep(.match-dropzone.heading-dropzone:hover) {
  border-color: #94a3b8;
  background: #f8fafc;
}

.passage-text :deep(.match-dropzone.heading-dropzone.drag-over) {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.passage-text :deep(.match-dropzone.heading-dropzone.has-value) {
  border-style: solid;
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #1e293b;
  font-weight: 600;
}

.passage-text :deep(.match-dropzone.heading-dropzone .match-value) {
  font-size: 13.5px;
  font-weight: 600;
  color: #1e293b;
}

.passage-text :deep(.dropzone-hint) {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  margin-left: 6px;
}

.passage-text :deep(.match-dropzone.has-value .dropzone-hint) {
  display: none;
}

.passage-text :deep(.reading-text-body) {
  font-size: 15.5px;
  line-height: 2.1;
  color: #334155;
}

/* Gap input styles */
.passage-text :deep(.gap-input) {
  min-width: 90px;
  width: auto;
  max-width: 100%;
  padding: 4px 10px;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  margin: 0 4px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  background-color: #ffffff;
  outline: none;
  transition: all 0.15s ease-in-out;
  box-sizing: content-box;
  vertical-align: baseline;
}

.passage-text :deep(.gap-input:focus) {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  background-color: #f8fafc;
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
</style>
