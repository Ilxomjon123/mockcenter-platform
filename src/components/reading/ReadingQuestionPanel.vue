<template>
  <div class="question-panel">
    <!-- Display all questions in current part -->
    <div ref="questionsContainerRef" class="questions-container" @mouseup="handleMouseUp">
      <template v-for="question in processedQuestions" :key="question.id">
        <!-- Question with children (parent type) -->
        <ParentQuestion
          v-if="question.children && question.children.length > 0"
          :question="question"
        />

        <!-- Regular question without children -->
        <QuestionItem v-else :question="question" />
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
import { useReadingQuestionProcessor } from '@/composables/useReadingQuestionProcessor'
import { useReadingStore } from '@/stores/readingStore'
import { QuestionItem, ParentQuestion } from './questions'

const readingStore = useReadingStore()

// Questions container ref
const questionsContainerRef = ref<HTMLElement | null>(null)

// Question processor composable
const { processedQuestions, restoreGapValues, setupInputListener } = useReadingQuestionProcessor({
  containerRef: questionsContainerRef,
})

// Restore question highlights from store
const restoreQuestionHighlights = () => {
  const container = questionsContainerRef.value
  if (!container) return

  const currentPart = readingStore.currentPart
  const savedHtml = readingStore.questionHighlights[currentPart]

  if (savedHtml && typeof savedHtml === 'string') {
    // Parse saved HTML to extract highlights
    const parser = new DOMParser()
    const savedDoc = parser.parseFromString(`<div>${savedHtml}</div>`, 'text/html')
    const savedHighlights = savedDoc.querySelectorAll('.question-highlight')

    // Apply each saved highlight to current DOM
    savedHighlights.forEach((savedHighlight) => {
      const highlightId = savedHighlight.getAttribute('data-highlight-id')
      const backgroundColor = (savedHighlight as HTMLElement).style.backgroundColor
      const highlightText = savedHighlight.textContent

      if (!highlightText) return

      // Find and highlight matching text in current DOM
      const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)

      let node: Node | null
      while ((node = treeWalker.nextNode())) {
        if (node.textContent && node.textContent.includes(highlightText)) {
          const parent = node.parentElement
          if (
            parent &&
            !parent.closest('.question-highlight') &&
            !parent.closest('input, select, textarea')
          ) {
            const text = node.textContent
            const index = text.indexOf(highlightText)
            if (index !== -1) {
              const range = document.createRange()
              range.setStart(node, index)
              range.setEnd(node, index + highlightText.length)

              const span = document.createElement('span')
              span.className = 'question-highlight'
              span.style.backgroundColor = backgroundColor
              span.dataset.highlightId = highlightId || Math.random().toString(36).substr(2, 9)

              try {
                range.surroundContents(span)
              } catch (e) {
                // Skip if range crosses element boundaries
              }
              break
            }
          }
        }
      }
    })
  }
}

// Highlight colors
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

// Highlight state
const showToolbar = ref(false)
const toolbarStyle = ref({ top: '0px', left: '0px' })

const handleMouseUp = () => {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0)

    // Check if selection is within questions container
    const container = questionsContainerRef.value
    if (container && container.contains(range.commonAncestorContainer)) {
      // Don't apply highlight if selection is within an input or select
      const ancestor = range.commonAncestorContainer
      const parentElement =
        ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : (ancestor as Element)
      if (!parentElement?.closest('input, select, textarea')) {
        // Automatically apply yellow highlight immediately, without showing toolbar
        applyHighlight('#fef08a', range)
        // Clear selection after highlighting
        selection.removeAllRanges()
      }
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
    while (startOffset > 0 && /\w/.test(text[startOffset - 1])) {
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
    while (endOffset < text.length && /\w/.test(text[endOffset])) {
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

  if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
    highlightNode = (commonAncestor as HTMLElement).closest('.question-highlight')
  } else {
    highlightNode = (commonAncestor.parentElement as HTMLElement).closest('.question-highlight')
  }

  // If already highlighted, remove the highlight
  if (highlightNode) {
    const parent = highlightNode.parentNode
    while (highlightNode.firstChild) {
      parent?.insertBefore(highlightNode.firstChild, highlightNode)
    }
    parent?.removeChild(highlightNode)

    // Save updated HTML to store
    const container = questionsContainerRef.value
    if (container) {
      readingStore.saveQuestionHtml(container.innerHTML)
    }

    selection.removeAllRanges()
    return
  }

  // Otherwise, apply new highlight
  const span = document.createElement('span')
  span.className = 'question-highlight'
  // Use yellow as default color if not specified
  span.style.backgroundColor = color || '#fef08a'
  span.dataset.highlightId = Math.random().toString(36).substr(2, 9)

  try {
    const content = range.extractContents()
    span.appendChild(content)
    range.insertNode(span)

    // Save highlighted HTML to store for persistence
    const container = questionsContainerRef.value
    if (container) {
      readingStore.saveQuestionHtml(container.innerHTML)
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
    highlightNode = (commonAncestor as HTMLElement).closest('.question-highlight')
  } else {
    highlightNode = (commonAncestor.parentElement as HTMLElement).closest('.question-highlight')
  }

  if (highlightNode) {
    const parent = highlightNode.parentNode
    while (highlightNode.firstChild) {
      parent?.insertBefore(highlightNode.firstChild, highlightNode)
    }
    parent?.removeChild(highlightNode)

    // Save updated HTML to store
    const container = questionsContainerRef.value
    if (container) {
      readingStore.saveQuestionHtml(container.innerHTML)
    }

    showToolbar.value = false
    selection.removeAllRanges()
  }
}

// Setup event delegation on mount
onMounted(() => {
  setupInputListener()
  restoreGapValues()
  nextTick(restoreQuestionHighlights)
})

// Watch for part changes to restore highlights
watch(
  () => readingStore.currentPart,
  () => {
    nextTick(restoreQuestionHighlights)
  },
)
</script>

<style scoped>
.question-panel {
  flex: 1;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
