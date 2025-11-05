import { defineStore } from 'pinia'
import type { WritingState } from '@/types/writing'
import type { ExamTestRaw, PartRaw } from '@/types/test'

const STORAGE_KEY = 'ielts_writing_state'

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
    setTest(test: ExamTestRaw): void {
      const parts = [...test.writing.parts].sort((a, b) => a.order - b.order)
      // Store prompts in local storage-friendly way by reusing answers fields and currentPage only
      // Extend store with any to avoid changing public types too much
      ;(this as any).prompts = parts.map((p: PartRaw) => ({
        title: p.title,
        content: p.content || '',
      }))
      this.currentPage = 1
      saveToStorage(this.$state)
    },
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

    clearWriting(): void {
      this.currentPage = 1
      this.answers.part1 = ''
      this.answers.part2 = ''
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
