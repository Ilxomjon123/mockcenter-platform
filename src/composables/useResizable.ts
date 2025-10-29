import { ref, onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'ielts_panel_width'

// LocalStorage'dan kenglikni o'qish
const loadWidth = (): number => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const width = parseFloat(saved)
      if (width >= 20 && width <= 80) {
        return width
      }
    }
  } catch (error) {
    console.error('Error loading width:', error)
  }
  return 50 // Default
}

// LocalStorage'ga kenglikni saqlash
const saveWidth = (width: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY, width.toString())
  } catch (error) {
    console.error('Error saving width:', error)
  }
}

export function useResizable() {
  const leftWidth = ref(loadWidth())
  const isDragging = ref(false)

  const startDrag = () => {
    isDragging.value = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return

    const containerWidth = window.innerWidth
    const newLeftWidth = (e.clientX / containerWidth) * 100

    // Min 20%, Max 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      leftWidth.value = newLeftWidth
      saveWidth(newLeftWidth)
    }
  }

  const stopDrag = () => {
    isDragging.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  onMounted(() => {
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  })

  return {
    leftWidth,
    isDragging,
    startDrag,
  }
}
