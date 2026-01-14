import { defineStore } from 'pinia'
import type { ReadingState, ReadingTestRaw } from '@/types/reading'
import type { ExamTestRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_reading_state'
const storage = useLocalStorage<ReadingState>(STORAGE_KEY)

export const useReadingStore = defineStore('reading', {
  state: (): ReadingState => {
    const saved = storage.load()
    return (
      saved || {
        currentPart: 1,
        answers: {},
        test: undefined,
      }
    )
  },

  getters: {
    currentPassage: (state) => {
      if (!state.test) return null
      return state.test.parts.find((p) => p.order === state.currentPart)
    },
  },

  actions: {
    setTest(test: ExamTestRaw): void {
      const reading = test.reading as ReadingTestRaw
      this.test = reading
      const parts = [...reading.parts].sort((a, b) => a.order - b.order)

      // Agar currentPart passages da mavjud bo'lmasa, birinchisiga o'rnatish
      const currentPartExists = parts.some((p) => p.order === this.currentPart)
      this.currentPart = currentPartExists ? this.currentPart : parts[0]?.order || 1
      storage.save(this.$state)
    },
    setPart(part: number): void {
      this.currentPart = part
      storage.save(this.$state)
    },

    updateAnswer(questionId: number, answer: string | number): void {
      this.answers[questionId] = answer
      storage.save(this.$state)
    },

    clearReading(): void {
      this.currentPart = 1
      this.answers = {}
      storage.remove()
    },
  },
})
