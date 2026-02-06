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

// Highlight state
const showToolbar = ref(false)
const toolbarStyle = ref({ top: '0px', left: '0px' })
let savedRange: Range | null = null

const handleMouseUp = () => {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0)

    // Check if selection is within questions container
    const container = questionsContainerRef.value
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

    showToolbar.value = false
    savedRange = null
    window.getSelection()?.removeAllRanges()
    return
  }

  // Otherwise, apply new highlight
  const span = document.createElement('span')
  span.className = 'question-highlight'
  span.style.backgroundColor = color
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
    savedRange = null
    window.getSelection()?.removeAllRanges()
  }
}

// Hide toolbar when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.highlight-toolbar') && !target.closest('.questions-container')) {
    showToolbar.value = false
    savedRange = null
  }
}

// Setup event delegation on mount
onMounted(() => {
  setupInputListener()
  restoreGapValues()
  nextTick(restoreQuestionHighlights)
  document.addEventListener('mousedown', handleClickOutside)
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
  font-family: Arial, sans-serif;
  font-size: 14px;
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
</style>
