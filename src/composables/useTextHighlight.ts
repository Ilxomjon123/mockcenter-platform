import { ref, type Ref } from 'vue'

export interface UseTextHighlightOptions {
  /** Ref to the container element that holds the highlightable content */
  containerRef: Ref<HTMLElement | null>
  /** Returns the previously saved HTML for the current part/passage, if any */
  getSavedHtml: () => string | null | undefined
  /** Called with the container's updated innerHTML whenever a highlight is applied/removed */
  onSave: (html: string) => void
}

// Shared text-highlighting engine (selection toolbar, word-boundary expansion,
// apply/remove highlight, restore-on-mount) used by question/passage panels.
export function useTextHighlight(options: UseTextHighlightOptions) {
  const { containerRef, getSavedHtml, onSave } = options

  // Highlight state
  const showToolbar = ref(false)
  const toolbarStyle = ref({ top: '0px', left: '0px' })
  let savedRange: Range | null = null

  // Restore saved highlights into the current DOM
  const restoreQuestionHighlights = () => {
    const container = containerRef.value
    if (!container) return

    const savedHtml = getSavedHtml()

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
                } catch {
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

  const handleMouseUp = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0)

      // Check if selection is within the container
      const container = containerRef.value
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
      const container = containerRef.value
      if (container) {
        onSave(container.innerHTML)
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
      const container = containerRef.value
      if (container) {
        onSave(container.innerHTML)
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
      const container = containerRef.value
      if (container) {
        onSave(container.innerHTML)
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

  return {
    showToolbar,
    toolbarStyle,
    restoreQuestionHighlights,
    handleMouseUp,
    applyHighlight,
    removeHighlight,
    handleClickOutside,
  }
}
