import { ref } from 'vue'
import { useReadingStore } from '@/stores/readingStore'

// Global drag state
const draggedOption = ref<HTMLElement | null>(null)
const sourceDropzone = ref<HTMLElement | null>(null)
const draggedValue = ref<string | null>(null)
const dragClone = ref<HTMLElement | null>(null)
const currentDropzone = ref<HTMLElement | null>(null)
const isDragging = ref(false)

export function useGlobalReadingDragDrop() {
  const readingStore = useReadingStore()

  // Helper to show option by key (search globally)
  const showOptionByKey = (key: string) => {
    const option = document.querySelector(
      `.draggable-option[data-option-key="${key}"]`
    ) as HTMLElement
    if (option) {
      option.classList.remove('used')
    }
  }

  // Create custom drag image
  const createDragImage = (text: string): HTMLElement => {
    const clone = document.createElement('span')
    clone.classList.add('drag-ghost')
    clone.textContent = text
    clone.style.position = 'fixed'
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = '10000'
    clone.style.transform = 'translate(-50%, -50%) rotate(3deg) scale(1.05)'
    clone.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)'
    clone.style.opacity = '0.95'
    clone.style.padding = '6px 14px'
    clone.style.borderRadius = '4px'
    clone.style.background = '#ffffff'
    clone.style.border = '1px solid #3b82f6'
    clone.style.fontSize = '13px'
    clone.style.color = '#374151'
    clone.style.whiteSpace = 'nowrap'
    document.body.appendChild(clone)
    return clone
  }

  // Handle drop on a dropzone
  const handleDropOnZone = (dropzone: HTMLElement) => {
    const matchNumber = dropzone.dataset.match
    if (!matchNumber || !draggedValue.value) return

    // If target dropzone already has a value, restore that option
    const oldValue = dropzone.querySelector('.match-value')?.textContent
    if (oldValue) {
      showOptionByKey(oldValue)
    }

    // Update the target dropzone display
    const valueEl = dropzone.querySelector('.match-value')
    if (valueEl) {
      valueEl.textContent = draggedValue.value
      dropzone.classList.add('has-value')
    }

    // Save to store
    readingStore.updateAnswer(parseInt(matchNumber, 10), draggedValue.value)

    // Handle source: either an option or another dropzone
    if (draggedOption.value) {
      // Mark option as used globally
      const allOptions = document.querySelectorAll(
        `.draggable-option[data-option-key="${draggedValue.value}"]`
      )
      allOptions.forEach((opt) => opt.classList.add('used'))
    } else if (sourceDropzone.value) {
      const sourceValueEl = sourceDropzone.value.querySelector('.match-value')
      const sourceMatchNumber = sourceDropzone.value.dataset.match
      if (sourceValueEl) {
        sourceValueEl.textContent = ''
      }
      sourceDropzone.value.classList.remove('has-value', 'dragging-from')

      if (sourceMatchNumber) {
        delete readingStore.answers[parseInt(sourceMatchNumber, 10)]
      }
    }
  }

  // ============ MOUSE EVENTS (Tauri-compatible) ============

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement

    // Check if clicking on an option
    const option = target.closest('.draggable-option') as HTMLElement
    if (option && !option.classList.contains('used')) {
      e.preventDefault()
      isDragging.value = true
      draggedOption.value = option
      draggedValue.value = option.dataset.optionKey || ''
      sourceDropzone.value = null
      option.classList.add('dragging')

      dragClone.value = createDragImage(draggedValue.value)
      dragClone.value.style.left = `${e.clientX}px`
      dragClone.value.style.top = `${e.clientY}px`
      return
    }

    // Check if clicking on a dropzone with value
    const dropzone = target.closest('.match-dropzone') as HTMLElement
    if (dropzone && dropzone.classList.contains('has-value')) {
      e.preventDefault()
      const valueEl = dropzone.querySelector('.match-value')
      draggedValue.value = valueEl?.textContent || ''
      if (!draggedValue.value) return

      isDragging.value = true
      sourceDropzone.value = dropzone
      draggedOption.value = null
      dropzone.classList.add('dragging-from')

      dragClone.value = createDragImage(draggedValue.value)
      dragClone.value.style.left = `${e.clientX}px`
      dragClone.value.style.top = `${e.clientY}px`
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !dragClone.value) return

    e.preventDefault()
    dragClone.value.style.left = `${e.clientX}px`
    dragClone.value.style.top = `${e.clientY}px`

    // Hide clone temporarily to get element underneath
    dragClone.value.style.display = 'none'
    const elementUnder = document.elementFromPoint(e.clientX, e.clientY)
    dragClone.value.style.display = ''

    const dropzone = elementUnder?.closest('.match-dropzone') as HTMLElement

    // Remove highlight from previous dropzone
    if (currentDropzone.value && currentDropzone.value !== dropzone) {
      currentDropzone.value.classList.remove('drag-over')
    }

    // Add highlight to current dropzone
    if (dropzone && dropzone !== sourceDropzone.value) {
      dropzone.classList.add('drag-over')
      currentDropzone.value = dropzone
    } else {
      currentDropzone.value = null
    }
  }

  const handleMouseUp = () => {
    if (!isDragging.value) return

    // Clean up dragging state
    if (draggedOption.value) {
      draggedOption.value.classList.remove('dragging')
    }
    if (sourceDropzone.value) {
      sourceDropzone.value.classList.remove('dragging-from')
    }

    // Remove drag clone
    if (dragClone.value) {
      dragClone.value.remove()
      dragClone.value = null
    }

    // Handle drop if we're over a valid dropzone
    if (currentDropzone.value && currentDropzone.value !== sourceDropzone.value) {
      currentDropzone.value.classList.remove('drag-over')
      currentDropzone.value.classList.add('drop-animation')
      const dz = currentDropzone.value
      setTimeout(() => dz.classList.remove('drop-animation'), 300)

      handleDropOnZone(currentDropzone.value)
    }

    // Reset state
    isDragging.value = false
    draggedOption.value = null
    sourceDropzone.value = null
    draggedValue.value = null
    currentDropzone.value = null

    // Clean up any remaining drag-over classes
    document.querySelectorAll('.match-dropzone.drag-over').forEach((el) => {
      el.classList.remove('drag-over')
    })
  }

  // ============ TOUCH EVENTS ============

  const handleTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement
    const touch = e.touches[0]
    if (!touch) return

    // Check if touching an option
    const option = target.closest('.draggable-option') as HTMLElement
    if (option && !option.classList.contains('used')) {
      isDragging.value = true
      draggedOption.value = option
      draggedValue.value = option.dataset.optionKey || ''
      sourceDropzone.value = null
      option.classList.add('touch-dragging')

      dragClone.value = createDragImage(draggedValue.value)
      dragClone.value.style.left = `${touch.clientX}px`
      dragClone.value.style.top = `${touch.clientY}px`
      return
    }

    // Check if touching a dropzone with value
    const dropzone = target.closest('.match-dropzone') as HTMLElement
    if (dropzone && dropzone.classList.contains('has-value')) {
      const valueEl = dropzone.querySelector('.match-value')
      draggedValue.value = valueEl?.textContent || ''
      if (!draggedValue.value) return

      isDragging.value = true
      sourceDropzone.value = dropzone
      draggedOption.value = null
      dropzone.classList.add('dragging-from')

      dragClone.value = createDragImage(draggedValue.value)
      dragClone.value.style.left = `${touch.clientX}px`
      dragClone.value.style.top = `${touch.clientY}px`
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value || !dragClone.value) return

    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return

    dragClone.value.style.left = `${touch.clientX}px`
    dragClone.value.style.top = `${touch.clientY}px`

    dragClone.value.style.display = 'none'
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY)
    dragClone.value.style.display = ''

    const dropzone = elementUnder?.closest('.match-dropzone') as HTMLElement

    if (currentDropzone.value && currentDropzone.value !== dropzone) {
      currentDropzone.value.classList.remove('drag-over')
    }

    if (dropzone && dropzone !== sourceDropzone.value) {
      dropzone.classList.add('drag-over')
      currentDropzone.value = dropzone
    } else {
      currentDropzone.value = null
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging.value) return

    if (draggedOption.value) {
      draggedOption.value.classList.remove('touch-dragging')
    }
    if (sourceDropzone.value) {
      sourceDropzone.value.classList.remove('dragging-from')
    }

    if (dragClone.value) {
      dragClone.value.remove()
      dragClone.value = null
    }

    if (currentDropzone.value && currentDropzone.value !== sourceDropzone.value) {
      currentDropzone.value.classList.remove('drag-over')
      currentDropzone.value.classList.add('drop-animation')
      const dz = currentDropzone.value
      setTimeout(() => dz.classList.remove('drop-animation'), 300)

      handleDropOnZone(currentDropzone.value)
    }

    isDragging.value = false
    draggedOption.value = null
    sourceDropzone.value = null
    draggedValue.value = null
    currentDropzone.value = null
  }

  // Handle click on dropzone to clear it
  const handleDropzoneClick = (e: Event) => {
    // Don't trigger click if we just finished dragging
    if (isDragging.value) return

    const target = e.target as HTMLElement
    const dropzone = target.closest('.match-dropzone') as HTMLElement

    if (!dropzone || !dropzone.classList.contains('has-value')) return

    // Don't clear if we're starting a drag
    if (dropzone.classList.contains('dragging-from')) return

    dropzone.classList.add('remove-animation')

    const matchNumber = dropzone.dataset.match
    const valueEl = dropzone.querySelector('.match-value')
    const currentValue = valueEl?.textContent

    if (matchNumber && valueEl) {
      setTimeout(() => {
        if (currentValue) {
          showOptionByKey(currentValue)
        }

        valueEl.textContent = ''
        dropzone.classList.remove('has-value', 'remove-animation')

        delete readingStore.answers[parseInt(matchNumber, 10)]
      }, 150)
    }
  }

  // Setup global event listeners
  const setupGlobalListeners = () => {
    // Mouse events (Tauri-compatible)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Click to clear
    document.addEventListener('click', handleDropzoneClick)

    // Touch events
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  // Cleanup global event listeners
  const cleanupGlobalListeners = () => {
    document.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    document.removeEventListener('click', handleDropzoneClick)

    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }

  return {
    setupGlobalListeners,
    cleanupGlobalListeners,
  }
}
