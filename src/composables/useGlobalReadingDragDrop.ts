import { ref } from 'vue'
import { useReadingStore } from '@/stores/readingStore'

// Global drag state
const draggedOption = ref<HTMLElement | null>(null)
const sourceDropzone = ref<HTMLElement | null>(null)
const draggedValue = ref<string | null>(null)
const draggedDisplay = ref<string | null>(null)
// Kind of the value being dragged ('match' | 'heading'). Drops are only
// allowed onto a dropzone of the same kind so the two families never mix.
const draggedKind = ref<string>('match')
const dragClone = ref<HTMLElement | null>(null)
const currentDropzone = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const selectedOption = ref<HTMLElement | null>(null)
let startX = 0
let startY = 0
// A click-to-place happens on mouseup; the browser then fires `click` on the same
// dropzone, which would otherwise immediately clear the value just placed.
let suppressClickZone: HTMLElement | null = null
let suppressClickUntil = 0

export function useGlobalReadingDragDrop() {
  const readingStore = useReadingStore()

  // Helper to show option by key within a kind family (search globally)
  const showOptionByKey = (key: string, kind: string) => {
    const targetKey = key.trim().toUpperCase()
    const options = document.querySelectorAll(
      `.draggable-option[data-kind="${kind}"]`
    )
    options.forEach((opt) => {
      const optEl = opt as HTMLElement
      const k = (optEl.dataset.optionKey || '').trim().toUpperCase()
      if (k === targetKey) {
        optEl.classList.remove('used')
      }
    })
  }

  // Create custom drag image
  const createDragImage = (text: string): HTMLElement => {
    const clone = document.createElement('span')
    clone.classList.add('drag-ghost')
    clone.textContent = text
    clone.style.position = 'fixed'
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = '10000'
    clone.style.transform = 'translate(-50%, -50%)'
    clone.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
    clone.style.opacity = '0.95'
    clone.style.padding = '6px 14px'
    clone.style.borderRadius = '6px'
    clone.style.background = '#ffffff'
    clone.style.border = '1.5px solid #94a3b8'
    clone.style.fontSize = '13px'
    clone.style.fontWeight = '600'
    clone.style.color = '#1e293b'
    clone.style.whiteSpace = 'nowrap'
    clone.style.maxWidth = '300px'
    clone.style.overflow = 'hidden'
    clone.style.textOverflow = 'ellipsis'
    document.body.appendChild(clone)
    return clone
  }

  // Handle drop or placement on a dropzone
  const handleDropOnZone = (dropzone: HTMLElement) => {
    const matchNumber = dropzone.dataset.match
    if (!matchNumber || !draggedValue.value) return

    // Reject drops across kind families (e.g. heading option onto match dropzone)
    const zoneKind = dropzone.dataset.kind ?? 'match'
    if (zoneKind !== draggedKind.value) return

    // If target dropzone already has a value, restore that option
    const oldKey = dropzone.dataset.storedKey || dropzone.querySelector('.match-value')?.textContent
    if (oldKey) {
      showOptionByKey(oldKey, zoneKind)
    }

    const optKey = draggedValue.value
    const optDisplay = draggedDisplay.value || optKey

    // Update the target dropzone display
    const valueEl = dropzone.querySelector('.match-value')
    if (valueEl) {
      valueEl.textContent = optDisplay
      dropzone.dataset.storedKey = optKey
      dropzone.classList.add('has-value')
    }

    // Save key to store (e.g. 'A', 'B', etc.)
    readingStore.updateAnswer(parseInt(matchNumber, 10), optKey)

    // Handle source: either an option or another dropzone
    if (draggedOption.value) {
      // Mark option as used within the same kind family
      const allOptions = document.querySelectorAll(
        `.draggable-option[data-kind="${zoneKind}"]`
      )
      allOptions.forEach((opt) => {
        const optEl = opt as HTMLElement
        if ((optEl.dataset.optionKey || '').trim().toUpperCase() === optKey.trim().toUpperCase()) {
          optEl.classList.add('used')
          optEl.classList.remove('selected-option')
        }
      })
      if (selectedOption.value === draggedOption.value) {
        selectedOption.value = null
      }
    } else if (sourceDropzone.value) {
      const sourceValueEl = sourceDropzone.value.querySelector('.match-value')
      const sourceMatchNumber = sourceDropzone.value.dataset.match
      if (sourceValueEl) {
        sourceValueEl.textContent = ''
      }
      delete sourceDropzone.value.dataset.storedKey
      sourceDropzone.value.classList.remove('has-value', 'dragging-from')

      if (sourceMatchNumber) {
        delete readingStore.answers[parseInt(sourceMatchNumber, 10)]
        readingStore.saveToStorage()
      }
    }
  }

  // ============ MOUSE EVENTS (Tauri-compatible) ============

  const handleMouseDown = (e: MouseEvent) => {
    startX = e.clientX
    startY = e.clientY

    const target = e.target as HTMLElement

    // Check if clicking on an option
    const option = target.closest('.draggable-option') as HTMLElement
    if (option && !option.classList.contains('used')) {
      // Prevent text selection (and the highlight toolbar) while dragging
      e.preventDefault()
      isDragging.value = true
      draggedOption.value = option
      draggedValue.value = option.dataset.optionKey || ''
      draggedDisplay.value = option.dataset.optionDisplay || draggedValue.value
      draggedKind.value = option.dataset.kind || 'match'
      sourceDropzone.value = null
      option.classList.add('dragging')

      dragClone.value = createDragImage(draggedDisplay.value || draggedValue.value)
      dragClone.value.style.left = `${e.clientX}px`
      dragClone.value.style.top = `${e.clientY}px`
      return
    }

    // Check if clicking on a dropzone with value
    const dropzone = target.closest('.match-dropzone') as HTMLElement
    if (dropzone && dropzone.classList.contains('has-value')) {
      const storedKey = dropzone.dataset.storedKey
      const valueEl = dropzone.querySelector('.match-value')
      draggedValue.value = storedKey || valueEl?.textContent || ''
      draggedDisplay.value = valueEl?.textContent || draggedValue.value
      if (!draggedValue.value) return

      e.preventDefault()
      isDragging.value = true
      draggedKind.value = dropzone.dataset.kind || 'match'
      sourceDropzone.value = dropzone
      draggedOption.value = null
      dropzone.classList.add('dragging-from')

      dragClone.value = createDragImage(draggedDisplay.value || draggedValue.value)
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
    const kindMatches = !!dropzone && (dropzone.dataset.kind ?? 'match') === draggedKind.value

    // Remove highlight from previous dropzone
    if (currentDropzone.value && currentDropzone.value !== dropzone) {
      currentDropzone.value.classList.remove('drag-over')
    }

    // Add highlight to current dropzone (only same-kind zones are valid targets)
    if (dropzone && kindMatches && dropzone !== sourceDropzone.value) {
      dropzone.classList.add('drag-over')
      currentDropzone.value = dropzone
    } else {
      currentDropzone.value = null
    }
  }

  const handleMouseUp = (e: MouseEvent) => {
    const moved = Math.hypot(e.clientX - startX, e.clientY - startY)
    const isClick = moved < 6

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

    // If dragged and dropped onto a dropzone
    if (isDragging.value && !isClick && currentDropzone.value && currentDropzone.value !== sourceDropzone.value) {
      currentDropzone.value.classList.remove('drag-over')
      currentDropzone.value.classList.add('drop-animation')
      const dz = currentDropzone.value
      setTimeout(() => dz.classList.remove('drop-animation'), 300)

      handleDropOnZone(currentDropzone.value)
    }

    // Click-to-place handling
    if (isClick) {
      const target = e.target as HTMLElement
      const clickedOption = target.closest('.draggable-option') as HTMLElement
      const clickedDropzone = target.closest('.match-dropzone') as HTMLElement

      if (clickedOption && !clickedOption.classList.contains('used')) {
        if (selectedOption.value === clickedOption) {
          clickedOption.classList.remove('selected-option')
          selectedOption.value = null
        } else {
          document.querySelectorAll('.draggable-option.selected-option').forEach((el) => {
            el.classList.remove('selected-option')
          })
          clickedOption.classList.add('selected-option')
          selectedOption.value = clickedOption
        }
      } else if (clickedDropzone && selectedOption.value) {
        // Place (or replace) the selected option into the clicked dropzone
        const zoneKind = clickedDropzone.dataset.kind ?? 'match'
        const optKind = selectedOption.value.dataset.kind ?? 'match'
        if (zoneKind === optKind) {
          draggedValue.value = selectedOption.value.dataset.optionKey || ''
          draggedDisplay.value = selectedOption.value.dataset.optionDisplay || draggedValue.value
          draggedKind.value = optKind
          draggedOption.value = selectedOption.value
          sourceDropzone.value = null

          handleDropOnZone(clickedDropzone)
          suppressClickZone = clickedDropzone
          suppressClickUntil = Date.now() + 500
        }
      } else if (!clickedDropzone) {
        document.querySelectorAll('.draggable-option.selected-option').forEach((el) => {
          el.classList.remove('selected-option')
        })
        selectedOption.value = null
      }
    }

    // Reset state
    isDragging.value = false
    draggedOption.value = null
    sourceDropzone.value = null
    draggedValue.value = null
    draggedDisplay.value = null
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
      draggedDisplay.value = option.dataset.optionDisplay || draggedValue.value
      draggedKind.value = option.dataset.kind || 'match'
      sourceDropzone.value = null
      option.classList.add('touch-dragging')

      dragClone.value = createDragImage(draggedDisplay.value || draggedValue.value)
      dragClone.value.style.left = `${touch.clientX}px`
      dragClone.value.style.top = `${touch.clientY}px`
      return
    }

    // Check if touching a dropzone with value
    const dropzone = target.closest('.match-dropzone') as HTMLElement
    if (dropzone && dropzone.classList.contains('has-value')) {
      const valueEl = dropzone.querySelector('.match-value')
      // Always carry the stored option KEY; the box may show "A) heading text"
      draggedValue.value = dropzone.dataset.storedKey || valueEl?.textContent || ''
      draggedDisplay.value = valueEl?.textContent || draggedValue.value
      if (!draggedValue.value) return

      isDragging.value = true
      draggedKind.value = dropzone.dataset.kind || 'match'
      sourceDropzone.value = dropzone
      draggedOption.value = null
      dropzone.classList.add('dragging-from')

      dragClone.value = createDragImage(draggedDisplay.value || draggedValue.value)
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
    const kindMatches = !!dropzone && (dropzone.dataset.kind ?? 'match') === draggedKind.value

    if (currentDropzone.value && currentDropzone.value !== dropzone) {
      currentDropzone.value.classList.remove('drag-over')
    }

    if (dropzone && kindMatches && dropzone !== sourceDropzone.value) {
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
    draggedDisplay.value = null
    currentDropzone.value = null
  }

  // Handle click on dropzone to clear it
  const handleDropzoneClick = (e: Event) => {
    // Don't trigger click if we just finished dragging
    if (isDragging.value) return
    const target = e.target as HTMLElement
    const dropzone = target.closest('.match-dropzone') as HTMLElement

    // The click that follows a click-to-place must not clear the value
    if (suppressClickZone) {
      const suppress = dropzone === suppressClickZone && Date.now() < suppressClickUntil
      suppressClickZone = null
      if (suppress) return
    }

    if (!dropzone || !dropzone.classList.contains('has-value')) return

    // Don't clear if we're starting a drag
    if (dropzone.classList.contains('dragging-from')) return

    dropzone.classList.add('remove-animation')

    const matchNumber = dropzone.dataset.match
    const valueEl = dropzone.querySelector('.match-value')
    const storedKey = dropzone.dataset.storedKey || valueEl?.textContent
    const zoneKind = dropzone.dataset.kind ?? 'match'

    if (matchNumber && valueEl) {
      setTimeout(() => {
        if (storedKey) {
          showOptionByKey(storedKey, zoneKind)
        }

        valueEl.textContent = ''
        delete dropzone.dataset.storedKey
        dropzone.classList.remove('has-value', 'remove-animation')

        delete readingStore.answers[parseInt(matchNumber, 10)]
        readingStore.saveToStorage()
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
