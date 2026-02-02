import { type Ref } from 'vue'
import { useListeningStore } from '@/stores/listeningStore'

interface DragAndDropOptions {
  containerRef: Ref<HTMLElement | null>
}

export function useDragAndDrop(options: DragAndDropOptions) {
  const listeningStore = useListeningStore()
  const { containerRef } = options

  // Drag state
  let draggedOption: HTMLElement | null = null
  let sourceDropzone: HTMLElement | null = null
  let draggedValue: string | null = null
  let dragClone: HTMLElement | null = null
  let currentDropzone: HTMLElement | null = null
  let isDragging = false

  // Helper to show option by key
  const showOptionByKey = (key: string) => {
    if (!containerRef.value) return
    const option = containerRef.value.querySelector(
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
    if (!matchNumber || !draggedValue) return

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
      draggedOption.classList.add('used')
    } else if (sourceDropzone) {
      const sourceValueEl = sourceDropzone.querySelector('.match-value')
      const sourceMatchNumber = sourceDropzone.dataset.match
      if (sourceValueEl) {
        sourceValueEl.textContent = ''
      }
      sourceDropzone.classList.remove('has-value', 'dragging-from')

      if (sourceMatchNumber) {
        delete listeningStore.answers[parseInt(sourceMatchNumber, 10)]
        listeningStore.saveToStorage()
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
      isDragging = true
      draggedOption = option
      draggedValue = option.dataset.optionKey || ''
      sourceDropzone = null
      option.classList.add('dragging')

      dragClone = createDragImage(draggedValue)
      dragClone.style.left = `${e.clientX}px`
      dragClone.style.top = `${e.clientY}px`
      return
    }

    // Check if clicking on a dropzone with value
    const dropzone = target.closest('.match-dropzone') as HTMLElement
    if (dropzone && dropzone.classList.contains('has-value')) {
      e.preventDefault()
      const valueEl = dropzone.querySelector('.match-value')
      draggedValue = valueEl?.textContent || ''
      if (!draggedValue) return

      isDragging = true
      sourceDropzone = dropzone
      draggedOption = null
      dropzone.classList.add('dragging-from')

      dragClone = createDragImage(draggedValue)
      dragClone.style.left = `${e.clientX}px`
      dragClone.style.top = `${e.clientY}px`
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragClone) return

    e.preventDefault()
    dragClone.style.left = `${e.clientX}px`
    dragClone.style.top = `${e.clientY}px`

    // Hide clone temporarily to get element underneath
    dragClone.style.display = 'none'
    const elementUnder = document.elementFromPoint(e.clientX, e.clientY)
    dragClone.style.display = ''

    const dropzone = elementUnder?.closest('.match-dropzone') as HTMLElement

    // Remove highlight from previous dropzone
    if (currentDropzone && currentDropzone !== dropzone) {
      currentDropzone.classList.remove('drag-over')
    }

    // Add highlight to current dropzone
    if (dropzone && dropzone !== sourceDropzone) {
      dropzone.classList.add('drag-over')
      currentDropzone = dropzone
    } else {
      currentDropzone = null
    }
  }

  const handleMouseUp = () => {
    if (!isDragging) return

    // Clean up dragging state
    if (draggedOption) {
      draggedOption.classList.remove('dragging')
    }
    if (sourceDropzone) {
      sourceDropzone.classList.remove('dragging-from')
    }

    // Remove drag clone
    if (dragClone) {
      dragClone.remove()
      dragClone = null
    }

    // Handle drop if we're over a valid dropzone
    if (currentDropzone && currentDropzone !== sourceDropzone) {
      currentDropzone.classList.remove('drag-over')
      currentDropzone.classList.add('drop-animation')
      const dz = currentDropzone
      setTimeout(() => dz.classList.remove('drop-animation'), 300)

      handleDropOnZone(currentDropzone)
    }

    // Reset state
    isDragging = false
    draggedOption = null
    sourceDropzone = null
    draggedValue = null
    currentDropzone = null

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
      isDragging = true
      draggedOption = option
      draggedValue = option.dataset.optionKey || ''
      sourceDropzone = null
      option.classList.add('touch-dragging')

      dragClone = createDragImage(draggedValue)
      dragClone.style.left = `${touch.clientX}px`
      dragClone.style.top = `${touch.clientY}px`
      return
    }

    // Check if touching a dropzone with value
    const dropzone = target.closest('.match-dropzone') as HTMLElement
    if (dropzone && dropzone.classList.contains('has-value')) {
      const valueEl = dropzone.querySelector('.match-value')
      draggedValue = valueEl?.textContent || ''
      if (!draggedValue) return

      isDragging = true
      sourceDropzone = dropzone
      draggedOption = null
      dropzone.classList.add('dragging-from')

      dragClone = createDragImage(draggedValue)
      dragClone.style.left = `${touch.clientX}px`
      dragClone.style.top = `${touch.clientY}px`
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !dragClone) return

    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return

    dragClone.style.left = `${touch.clientX}px`
    dragClone.style.top = `${touch.clientY}px`

    dragClone.style.display = 'none'
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY)
    dragClone.style.display = ''

    const dropzone = elementUnder?.closest('.match-dropzone') as HTMLElement

    if (currentDropzone && currentDropzone !== dropzone) {
      currentDropzone.classList.remove('drag-over')
    }

    if (dropzone && dropzone !== sourceDropzone) {
      dropzone.classList.add('drag-over')
      currentDropzone = dropzone
    } else {
      currentDropzone = null
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    if (draggedOption) {
      draggedOption.classList.remove('touch-dragging')
    }
    if (sourceDropzone) {
      sourceDropzone.classList.remove('dragging-from')
    }

    if (dragClone) {
      dragClone.remove()
      dragClone = null
    }

    if (currentDropzone && currentDropzone !== sourceDropzone) {
      currentDropzone.classList.remove('drag-over')
      currentDropzone.classList.add('drop-animation')
      const dz = currentDropzone
      setTimeout(() => dz.classList.remove('drop-animation'), 300)

      handleDropOnZone(currentDropzone)
    }

    isDragging = false
    draggedOption = null
    sourceDropzone = null
    draggedValue = null
    currentDropzone = null
  }

  // Handle click on dropzone to clear it
  const handleDropzoneClick = (e: Event) => {
    // Don't trigger click if we just finished dragging
    if (isDragging) return

    const target = e.target as HTMLElement
    const dropzone = target.closest('.match-dropzone') as HTMLElement

    if (!dropzone || !dropzone.classList.contains('has-value')) return

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

        delete listeningStore.answers[parseInt(matchNumber, 10)]
        listeningStore.saveToStorage()
      }, 150)
    }
  }

  // Setup event listeners
  const setupEventListeners = () => {
    if (!containerRef.value) return

    // Mouse events (Tauri-compatible)
    containerRef.value.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Click to clear
    containerRef.value.addEventListener('click', handleDropzoneClick)

    // Touch events
    containerRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    containerRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    containerRef.value.addEventListener('touchend', handleTouchEnd)
  }

  // Cleanup event listeners
  const cleanupEventListeners = () => {
    if (!containerRef.value) return

    containerRef.value.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    containerRef.value.removeEventListener('click', handleDropzoneClick)

    containerRef.value.removeEventListener('touchstart', handleTouchStart)
    containerRef.value.removeEventListener('touchmove', handleTouchMove)
    containerRef.value.removeEventListener('touchend', handleTouchEnd)
  }

  return {
    setupEventListeners,
    cleanupEventListeners,
  }
}
