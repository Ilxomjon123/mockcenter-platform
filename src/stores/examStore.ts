import { defineStore } from 'pinia'
import type { ExamState } from '@/types/exam'

export const useExamStore = defineStore('exam', {
  state: (): ExamState => ({
    currentPage: 1,
    answers: {
      part1: '',
      part2: '',
    },
  }),

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
    },

    updateAnswer(text: string): void {
      if (this.currentPage === 1) {
        this.answers.part1 = text
      } else {
        this.answers.part2 = text
      }
    },
  },
})
