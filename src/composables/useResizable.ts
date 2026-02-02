import { ref, onMounted, onUnmounted } from 'vue'
import { useLocalStoragePrimitive } from './useLocalStorage'

const STORAGE_KEY = 'ielts_panel_width'
const storage = useLocalStoragePrimitive(STORAGE_KEY, 50)

const loadWidth = (): number => {
  const width = storage.load() as number
  return width >= 20 && width <= 80 ? width : 50
}

// Debounce timer for saving to storage
let saveTimer: ReturnType<typeof setTimeout> | null = null
const saveWidth = (width: number): void => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    storage.save(width)
    saveTimer = null
  }, 500)
}

export function useResizable() {
  const leftWidth = ref(loadWidth())
  const isDragging = ref(false)

  // Cache window.innerWidth to avoid reflow
  let cachedWidth = 0

  const startDrag = (): void => {
    isDragging.value = true
    cachedWidth = window.innerWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const onDrag = (e: MouseEvent): void => {
    if (!isDragging.value) return

    const newLeftWidth = (e.clientX / cachedWidth) * 100

    // Min 20%, Max 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      leftWidth.value = newLeftWidth
      saveWidth(newLeftWidth)
    }
  }

  const stopDrag = (): void => {
    if (!isDragging.value) return
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
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  })

  return {
    leftWidth,
    isDragging,
    startDrag,
  }
}
