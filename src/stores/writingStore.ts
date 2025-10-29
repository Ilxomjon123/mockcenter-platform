import { defineStore } from 'pinia'
import type { WritingState } from '@/types/writing'

const STORAGE_KEY = 'ielts_exam_state'

// LocalStorage'dan ma'lumotlarni o'qish
const loadFromStorage = (): WritingState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading from storage:', error)
  }
  return null
}

// LocalStorage'ga ma'lumotlarni saqlash
const saveToStorage = (state: WritingState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving to storage:', error)
  }
}

export const useWritingStore = defineStore('writing', {
  state: (): WritingState => {
    const saved = loadFromStorage()
    return (
      saved || {
        currentPage: 1,
        answers: {
          part1: '',
          part2: '',
        },
      }
    )
  },

  getters: {
    currentAnswer: (state): string => {
      return state.currentPage === 1 ? state.answers.part1 : state.answers.part2
    },

    wordCount:
      () =>
      (text: string): number => {
        if (!text) return 0
        return text
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length
      },
  },

  actions: {
    setPage(page: number): void {
      this.currentPage = page
      saveToStorage(this.$state)
    },

    updateAnswer(text: string): void {
      if (this.currentPage === 1) {
        this.answers.part1 = text
      } else {
        this.answers.part2 = text
      }
      saveToStorage(this.$state)
    },

    clearExam(): void {
      this.currentPage = 1
      this.answers.part1 = ''
      this.answers.part2 = ''
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
