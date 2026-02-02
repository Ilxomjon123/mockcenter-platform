import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ContrastMode = 'black-on-white' | 'white-on-black' | 'yellow-on-black'
export type TextSize = 'regular' | 'large' | 'extra-large'

// Cache for classList operations
const contrastClasses = ['contrast-black-on-white', 'contrast-white-on-black', 'contrast-yellow-on-black'] as const
const textSizeClasses = ['text-size-regular', 'text-size-large', 'text-size-extra-large'] as const

export const useSettingsStore = defineStore('settings', () => {
  const contrast = ref<ContrastMode>(
    (localStorage.getItem('contrast') as ContrastMode) || 'black-on-white'
  )
  const textSize = ref<TextSize>((localStorage.getItem('textSize') as TextSize) || 'regular')

  const applyContrast = (mode: ContrastMode): void => {
    const root = document.documentElement
    root.classList.remove(...contrastClasses)
    root.classList.add(`contrast-${mode}`)
  }

  const applyTextSize = (size: TextSize): void => {
    const root = document.documentElement
    root.classList.remove(...textSizeClasses)
    root.classList.add(`text-size-${size}`)
  }

  const setContrast = (mode: ContrastMode): void => {
    contrast.value = mode
    localStorage.setItem('contrast', mode)
    applyContrast(mode)
  }

  const setTextSize = (size: TextSize): void => {
    textSize.value = size
    localStorage.setItem('textSize', size)
    applyTextSize(size)
  }

  const initializeSettings = (): void => {
    applyContrast(contrast.value)
    applyTextSize(textSize.value)
  }

  return {
    contrast,
    textSize,
    setContrast,
    setTextSize,
    initializeSettings,
  }
})
