import { defineStore } from 'pinia'
import type { ReadingState, ReadingTestRaw, HighlightItem } from '@/types/reading'
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
        highlights: {},
      }
    )
  },

  getters: {
    currentPassage: (state) => {
      if (!state.test) return null
      return state.test.parts.find((p) => p.order === state.currentPart)
    },
    currentHighlights: (state) => {
      return state.highlights[state.currentPart] || []
    },
    partStats: (state) => {
      if (!state.test || !state.test.parts) return { 1: { start: 1, end: 13 }, 2: { start: 14, end: 26 }, 3: { start: 27, end: 40 } }

      const parts = [...state.test.parts].sort((a, b) => a.order - b.order)
      const stats: Record<number, { start: number; end: number }> = {}
      let currentCounter = 1

      parts.forEach((part) => {
        const start = currentCounter

        // Count in passage content
        if (part.content) {
          const gaps = (part.content.match(/\[gap\]/g) || []).length
          const matches = (part.content.match(/\[match\]/g) || []).length
          currentCounter += gaps + matches
        }

        // Count in questions
        if (part.questions) {
          const sortedQuestions = [...part.questions].sort((a, b) => a.order - b.order)
          sortedQuestions.forEach((q) => {
            // Process root question
            if (q.type === 'true_false_not_given') {
              currentCounter += 1
            } else if (q.type === 'test' || q.type === 'multiple_choice') {
              currentCounter += q.answers_count || 1
            }

            if (q.content) {
              const gaps = (q.content.match(/\[gap\]/g) || []).length
              const matches = (q.content.match(/\[match\]/g) || []).length
              currentCounter += gaps + matches
            }

            // Process children
            if (q.children) {
              const sortedChildren = [...q.children].sort((a, b) => a.order - b.order)
              sortedChildren.forEach((child) => {
                if (child.type === 'true_false_not_given') {
                  currentCounter += 1
                } else if (child.type === 'test' || child.type === 'multiple_choice') {
                  currentCounter += child.answers_count || 1
                }
                if (child.content) {
                  const gaps = (child.content.match(/\[gap\]/g) || []).length
                  const matches = (child.content.match(/\[match\]/g) || []).length
                  currentCounter += gaps + matches
                }
              })
            }
          })
        }

        stats[part.order] = { start, end: currentCounter - 1 }
      })

      return stats
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

      if (!this.highlights) this.highlights = {}

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

    addHighlight(highlight: HighlightItem): void {
      if (!this.highlights[this.currentPart] || typeof this.highlights[this.currentPart] === 'string') {
        this.highlights[this.currentPart] = []
      }
      ;(this.highlights[this.currentPart] as HighlightItem[]).push(highlight)
      storage.save(this.$state)
    },

    savePassageHtml(html: string): void {
      this.highlights[this.currentPart] = html
      storage.save(this.$state)
    },

    removeHighlight(highlightId: string): void {
      if (this.highlights[this.currentPart] && Array.isArray(this.highlights[this.currentPart])) {
        this.highlights[this.currentPart] = (this.highlights[this.currentPart] as HighlightItem[]).filter(
          (h) => h.id !== highlightId
        )
        storage.save(this.$state)
      }
    },

    clearHighlights(): void {
      this.highlights[this.currentPart] = []
      storage.save(this.$state)
    },

    clearReading(): void {
      this.currentPart = 1
      this.answers = {}
      this.highlights = {}
      storage.remove()
    },
  },
})
