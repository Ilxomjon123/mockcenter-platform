import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type ContrastMode = 'black-on-white' | 'white-on-black' | 'yellow-on-black'
export type TextSize = 'regular' | 'large' | 'extra-large'

export const useSettingsStore = defineStore('settings', () => {
  const contrast = ref<ContrastMode>(
    (localStorage.getItem('contrast') as ContrastMode) || 'black-on-white'
  )
  const textSize = ref<TextSize>((localStorage.getItem('textSize') as TextSize) || 'regular')

  const setContrast = (mode: ContrastMode) => {
    contrast.value = mode
    localStorage.setItem('contrast', mode)
    applyContrast(mode)
  }

  const setTextSize = (size: TextSize) => {
    textSize.value = size
    localStorage.setItem('textSize', size)
    applyTextSize(size)
  }

  const applyContrast = (mode: ContrastMode) => {
    const root = document.documentElement

    // Remove all contrast classes
    root.classList.remove('contrast-black-on-white', 'contrast-white-on-black', 'contrast-yellow-on-black')

    // Add the new contrast class
    root.classList.add(`contrast-${mode}`)
  }

  const applyTextSize = (size: TextSize) => {
    const root = document.documentElement

    // Remove all text size classes
    root.classList.remove('text-size-regular', 'text-size-large', 'text-size-extra-large')

    // Add the new text size class
    root.classList.add(`text-size-${size}`)
  }

  // Initialize settings on store creation
  const initializeSettings = () => {
    applyContrast(contrast.value)
    applyTextSize(textSize.value)
  }

  // Watch for changes and persist
  watch(contrast, (newValue) => {
    localStorage.setItem('contrast', newValue)
    applyContrast(newValue)
  })

  watch(textSize, (newValue) => {
    localStorage.setItem('textSize', newValue)
    applyTextSize(newValue)
  })

  return {
    contrast,
    textSize,
    setContrast,
    setTextSize,
    initializeSettings,
  }
})
