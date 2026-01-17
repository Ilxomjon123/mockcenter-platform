import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@/composables/useLocalStorage'

export enum AuthMode {
  EXAM = 'exam',
  PRACTICE = 'practice',
}

export const useModeStore = defineStore('mode', () => {
  const currentMode = useLocalStorage<AuthMode>('auth_mode', AuthMode.EXAM)

  const isExamMode = computed(() => currentMode.value === AuthMode.EXAM)

  const isPracticeMode = computed(() => currentMode.value === AuthMode.PRACTICE)

  const setExamMode = () => {
    currentMode.value = AuthMode.EXAM
  }

  const setPracticeMode = () => {
    currentMode.value = AuthMode.PRACTICE
  }

  const setMode = (mode: AuthMode) => {
    currentMode.value = mode
  }

  const clearMode = () => {
    currentMode.value = AuthMode.EXAM
  }

  return {
    currentMode,
    isExamMode,
    isPracticeMode,
    setExamMode,
    setPracticeMode,
    setMode,
    clearMode,
  }
})
