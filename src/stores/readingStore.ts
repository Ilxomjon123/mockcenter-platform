import { defineStore } from 'pinia'
import type { ReadingState, ReadingTestRaw } from '@/types/reading'
import type { ExamTestRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_reading_state'
const storage = useLocalStorage<ReadingState>(STORAGE_KEY)

export const useReadingStore = defineStore('reading', {
  state: (): ReadingState => {
    const saved = storage.load()
    return {
      currentPart: saved?.currentPart ?? 1,
      answers: saved?.answers ?? {},
      test: undefined,
      highlights: saved?.highlights ?? {},
      isCompleted: saved?.isCompleted ?? false,
      isManualSubmit: saved?.isManualSubmit ?? false,
      startTime: saved?.startTime,
      partStats: saved?.partStats ?? {},
    }
  },

  getters: {
    currentPassage: (state) => {
      if (!state.test) return null
      return state.test.parts.find((p) => p.order === state.currentPart)
    },
  },

  actions: {
    saveToStorage(): void {
      storage.save({
        currentPart: this.currentPart,
        answers: this.answers,
        highlights: this.highlights,
        isCompleted: this.isCompleted,
        isManualSubmit: this.isManualSubmit,
        startTime: this.startTime,
        partStats: this.partStats,
      } as ReadingState)
    },

    setTest(test: ExamTestRaw): void {
      const reading = test.reading as ReadingTestRaw
      this.test = reading
      const parts = [...reading.parts].sort((a, b) => a.order - b.order)

      type RawPart = (typeof parts)[0]
      type RawQuestion = RawPart['questions'][0]
      type RawChild = NonNullable<RawQuestion['children']>[0]

      // Calculate part stats
      const stats: Record<number, { start: number; end: number }> = {}
      let currentCounter = 1

      const countGapsAndMatches = (text: string | null | undefined): number => {
        if (!text) return 0
        const gaps = (text.match(/\[gap\]/g) || []).length
        const matches = (text.match(/\[match\]/g) || []).length
        return gaps + matches
      }

      const processNode = (q: RawQuestion | RawChild) => {
        if (q.type === 'true_false_not_given') {
          currentCounter += 1
        } else if (q.type === 'test' || q.type === 'multiple_choice') {
          currentCounter += (q as RawQuestion).answers_count || 1
        }
        currentCounter += countGapsAndMatches(q.content)

        if ('children' in q && q.children) {
          ;[...q.children].sort((a, b) => a.order - b.order).forEach(processNode)
        }
      }

      parts.forEach((part) => {
        const start = currentCounter
        currentCounter += countGapsAndMatches(part.content)

        if (part.questions) {
          const sortedQuestions = [...part.questions].sort((a, b) => a.order - b.order)
          sortedQuestions.forEach(processNode)
        }
        stats[part.order] = { start, end: currentCounter - 1 }
      })
      this.partStats = stats

      // Agar currentPart passages da mavjud bo'lmasa, birinchisiga o'rnatish
      const currentPartExists = parts.some((p) => p.order === this.currentPart)
      this.currentPart = currentPartExists ? this.currentPart : parts[0]?.order || 1

      if (!this.highlights) this.highlights = {}

      this.saveToStorage()
    },
    setPart(part: number): void {
      this.currentPart = part
      this.saveToStorage()
    },

    setCompleted(completed: boolean, isManual: boolean = false): void {
      this.isCompleted = completed
      this.isManualSubmit = isManual
      this.saveToStorage()
    },

    setStartTime(time: number): void {
      // Faqat bir marta set qilinishi kerak
      if (!this.startTime) {
        this.startTime = time
        this.saveToStorage()
      }
    },

    updateAnswer(questionId: number, answer: string | number): void {
      this.answers[questionId] = answer
      this.saveToStorage()
    },

    savePassageHtml(html: string): void {
      this.highlights[this.currentPart] = html
      this.saveToStorage()
    },

    clearReading(): void {
      this.currentPart = 1
      this.answers = {}
      this.highlights = {}
      this.isCompleted = false
      this.isManualSubmit = false
      this.startTime = undefined
      storage.remove()
    },
  },
})
