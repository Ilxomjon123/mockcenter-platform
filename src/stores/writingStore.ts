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
    saveToStorage(): void {
      storage.save({
        currentPage: this.currentPage,
        answers: this.answers,
        test: this.test,
        startTime: this.startTime,
        isCompleted: this.isCompleted,
        isManualSubmit: this.isManualSubmit,
      } as WritingState)
    },

    setTest(test: ExamTestRaw): void {
      const writing = test.writing as WritingTestRaw
      this.test = writing
      this.currentPage =
        writing.parts.length > 0 ? Math.min(...writing.parts.map((p) => p.order)) : 1

      // Initialize answers if not present
      writing.parts.forEach((part) => {
        if (this.answers[part.order] === undefined) {
          this.answers[part.order] = ''
        }
      })

      this.saveToStorage()
    },

    setPage(page: number): void {
      this.currentPage = page
      this.saveToStorage()
    },

    updateAnswer(text: string): void {
      this.answers[this.currentPage] = text
      this.saveToStorage()
    },

    setStartTime(time: number): void {
      // Should only be set once
      if (!this.startTime) {
        this.startTime = time
        this.saveToStorage()
      }
    },

    setCompleted(completed: boolean, isManual: boolean = false): void {
      this.isCompleted = completed
      this.isManualSubmit = isManual
      this.saveToStorage()
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
