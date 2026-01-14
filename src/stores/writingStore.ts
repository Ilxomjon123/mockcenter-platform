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
        answers: {
          part1: '',
          part2: '',
        },
        test: undefined,
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
      const writing = test.writing as WritingTestRaw
      this.test = writing
      const parts = [...writing.parts].sort((a, b) => a.order - b.order)
      const prompts = parts.map((p) => ({
        title: p.title,
        content: p.content || '',
      }))
      this.$patch({
        currentPage: 1,
        prompts,
      })
      storage.save(this.$state)
    },
    setPage(page: number): void {
      this.currentPage = page
      storage.save(this.$state)
    },

    updateAnswer(text: string): void {
      if (this.currentPage === 1) {
        this.answers.part1 = text
      } else {
        this.answers.part2 = text
      }
      storage.save(this.$state)
    },

    clearWriting(): void {
      this.currentPage = 1
      this.answers.part1 = ''
      this.answers.part2 = ''
      storage.remove()
    },
  },
})
