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
  let touchClone: HTMLElement | null = null
  let currentDropzone: HTMLElement | null = null

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

  // ============ MOUSE DRAG EVENTS ============

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

    if (sourceDropzone) {
      sourceDropzone.classList.remove('dragging-from')
    }

    draggedOption = null
    sourceDropzone = null
    draggedValue = null

    document.querySelectorAll('.match-dropzone.drag-over').forEach((el) => {
      el.classList.remove('drag-over')
    })
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const dropzone = target.closest('.match-dropzone') as HTMLElement
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

    if (!dropzone || (!draggedOption && !sourceDropzone)) return
    if (dropzone === sourceDropzone) return

    dropzone.classList.remove('drag-over')
    dropzone.classList.add('drop-animation')
    setTimeout(() => dropzone.classList.remove('drop-animation'), 300)

    handleDropOnZone(dropzone)
  }

  // ============ TOUCH EVENTS ============

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

    touchClone.style.left = `${touch.clientX - 60}px`
    touchClone.style.top = `${touch.clientY - 20}px`

    touchClone.style.display = 'none'
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY)
    touchClone.style.display = ''

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
    if (!draggedOption && !sourceDropzone) return

    if (draggedOption) {
      draggedOption.classList.remove('touch-dragging')
    }
    if (sourceDropzone) {
      sourceDropzone.classList.remove('dragging-from')
    }

    if (touchClone) {
      touchClone.remove()
      touchClone = null
    }

    if (currentDropzone && currentDropzone !== sourceDropzone) {
      currentDropzone.classList.remove('drag-over')
      currentDropzone.classList.add('drop-animation')
      setTimeout(() => currentDropzone?.classList.remove('drop-animation'), 300)

      handleDropOnZone(currentDropzone)
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

    containerRef.value.addEventListener('dragstart', handleDragStart)
    containerRef.value.addEventListener('dragend', handleDragEnd)
    containerRef.value.addEventListener('dragover', handleDragOver)
    containerRef.value.addEventListener('dragleave', handleDragLeave)
    containerRef.value.addEventListener('drop', handleDrop)
    containerRef.value.addEventListener('click', handleDropzoneClick)

    containerRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    containerRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    containerRef.value.addEventListener('touchend', handleTouchEnd)
  }

  // Cleanup event listeners
  const cleanupEventListeners = () => {
    if (!containerRef.value) return

    containerRef.value.removeEventListener('dragstart', handleDragStart)
    containerRef.value.removeEventListener('dragend', handleDragEnd)
    containerRef.value.removeEventListener('dragover', handleDragOver)
    containerRef.value.removeEventListener('dragleave', handleDragLeave)
    containerRef.value.removeEventListener('drop', handleDrop)
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
