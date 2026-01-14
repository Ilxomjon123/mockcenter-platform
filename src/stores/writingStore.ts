import { defineStore } from 'pinia'
import type { WritingState, WritingTestRaw } from '@/types/writing'
import type { ExamTestRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_writing_state'
const storage = useLocalStorage<WritingState>(STORAGE_KEY)

export const useWritingStore = defineStore('writing', {
  state: (): WritingState => {
    const saved = storage.load()
    return (
      saved || {
        currentPage: 1,
        answers: {},
        test: undefined,
        startTime: undefined,
        isCompleted: false,
        isManualSubmit: false,
      }
    )
  },

  getters: {
    currentAnswer: (state): string => {
      return state.answers[state.currentPage] || ''
    },

    currentPart: (state) => {
      if (!state.test) return null
      return state.test.parts.find((p) => p.order === state.currentPage) || null
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
      const writing = test.writing as WritingTestRaw
      this.test = writing
      this.currentPage = writing.parts.length > 0 ? Math.min(...writing.parts.map((p) => p.order)) : 1

      // Initialize answers if not present
      writing.parts.forEach(part => {
        if (this.answers[part.order] === undefined) {
          this.answers[part.order] = ''
        }
      })

      storage.save(this.$state)
    },
    setPage(page: number): void {
      this.currentPage = page
      storage.save(this.$state)
    },

    updateAnswer(text: string): void {
      this.answers[this.currentPage] = text
      storage.save(this.$state)
    },

    setStartTime(time: number): void {
      this.startTime = time
      storage.save(this.$state)
    },

    setCompleted(completed: boolean, isManual: boolean = false): void {
      this.isCompleted = completed
      this.isManualSubmit = isManual
      storage.save(this.$state)
    },

    clearWriting(): void {
      this.currentPage = 1
      this.answers = {}
      this.test = undefined
      this.startTime = undefined
      this.isCompleted = false
      this.isManualSubmit = false
      storage.remove()
    },
  },
})
