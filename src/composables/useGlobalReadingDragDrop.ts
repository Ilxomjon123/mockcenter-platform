import { ref } from 'vue'
import { useReadingStore } from '@/stores/readingStore'

// Global drag state
const draggedOption = ref<HTMLElement | null>(null)
const sourceDropzone = ref<HTMLElement | null>(null)
const draggedValue = ref<string | null>(null)
const touchClone = ref<HTMLElement | null>(null)
const currentDropzone = ref<HTMLElement | null>(null)

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
    clone.style.transform = 'rotate(3deg) scale(1.05)'
    clone.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)'
    clone.style.opacity = '0.95'
    clone.style.padding = '6px 14px'
    clone.style.borderRadius = '4px'
    clone.style.background = '#ffffff'
    clone.style.border = '1px solid #3b82f6'
    clone.style.fontSize = '13px'
    clone.style.color = '#374151'
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

  // ============ MOUSE DRAG EVENTS ============

  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement

    // Check if dragging from an option
    if (target.classList.contains('draggable-option')) {
      draggedOption.value = target
      target.classList.add('dragging')
      draggedValue.value = target.dataset.optionKey || ''
      sourceDropzone.value = null

      e.dataTransfer?.setData('text/plain', draggedValue.value)

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
      draggedValue.value = valueEl?.textContent || ''
      if (!draggedValue.value) return

      sourceDropzone.value = dropzone
      draggedOption.value = null
      dropzone.classList.add('dragging-from')

      e.dataTransfer?.setData('text/plain', draggedValue.value)

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        const dragImage = document.createElement('span')
        dragImage.textContent = draggedValue.value
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

    if (sourceDropzone.value) {
      sourceDropzone.value.classList.remove('dragging-from')
    }

    draggedOption.value = null
    sourceDropzone.value = null
    draggedValue.value = null

    document.querySelectorAll('.match-dropzone.drag-over').forEach((el) => {
      el.classList.remove('drag-over')
    })
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const dropzone = target.closest('.match-dropzone') as HTMLElement
    if (dropzone && dropzone !== sourceDropzone.value) {
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

    if (!dropzone || (!draggedOption.value && !sourceDropzone.value)) return
    if (dropzone === sourceDropzone.value) return

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
      draggedOption.value = option
      draggedValue.value = option.dataset.optionKey || ''
      sourceDropzone.value = null
      option.classList.add('touch-dragging')

      touchClone.value = createDragImage(draggedValue.value)
      touchClone.value.style.left = `${touch.clientX - 60}px`
      touchClone.value.style.top = `${touch.clientY - 20}px`
      return
    }

    // Check if touching a dropzone with value
    const dropzone = target.closest('.match-dropzone') as HTMLElement
    if (dropzone && dropzone.classList.contains('has-value')) {
      const valueEl = dropzone.querySelector('.match-value')
      draggedValue.value = valueEl?.textContent || ''
      if (!draggedValue.value) return

      sourceDropzone.value = dropzone
      draggedOption.value = null
      dropzone.classList.add('dragging-from')

      touchClone.value = createDragImage(draggedValue.value)
      touchClone.value.style.left = `${touch.clientX - 60}px`
      touchClone.value.style.top = `${touch.clientY - 20}px`
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if ((!draggedOption.value && !sourceDropzone.value) || !touchClone.value) return

    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return

    touchClone.value.style.left = `${touch.clientX - 60}px`
    touchClone.value.style.top = `${touch.clientY - 20}px`

    touchClone.value.style.display = 'none'
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY)
    touchClone.value.style.display = ''

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
    if (!draggedOption.value && !sourceDropzone.value) return

    if (draggedOption.value) {
      draggedOption.value.classList.remove('touch-dragging')
    }
    if (sourceDropzone.value) {
      sourceDropzone.value.classList.remove('dragging-from')
    }

    if (touchClone.value) {
      touchClone.value.remove()
      touchClone.value = null
    }

    if (currentDropzone.value && currentDropzone.value !== sourceDropzone.value) {
      currentDropzone.value.classList.remove('drag-over')
      currentDropzone.value.classList.add('drop-animation')
      const dz = currentDropzone.value
      setTimeout(() => dz.classList.remove('drop-animation'), 300)

      handleDropOnZone(currentDropzone.value)
    }

    draggedOption.value = null
    sourceDropzone.value = null
    draggedValue.value = null
    currentDropzone.value = null
  }

  // Handle click on dropzone to clear it
  const handleDropzoneClick = (e: Event) => {
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
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('dragend', handleDragEnd)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)
    document.addEventListener('click', handleDropzoneClick)

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  // Cleanup global event listeners
  const cleanupGlobalListeners = () => {
    document.removeEventListener('dragstart', handleDragStart)
    document.removeEventListener('dragend', handleDragEnd)
    document.removeEventListener('dragover', handleDragOver)
    document.removeEventListener('dragleave', handleDragLeave)
    document.removeEventListener('drop', handleDrop)
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
