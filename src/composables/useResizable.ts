import { ref, onMounted, onUnmounted } from 'vue'
import { useLocalStoragePrimitive } from './useLocalStorage'

const STORAGE_KEY = 'ielts_panel_width'
const storage = useLocalStoragePrimitive(STORAGE_KEY, 50)

const loadWidth = (): number => {
  const width = storage.load() as number
  return width >= 20 && width <= 80 ? width : 50
}

const saveWidth = (width: number): void => {
  storage.save(width)
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
