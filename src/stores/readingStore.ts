import { defineStore } from 'pinia'
import type { ReadingState, Passage, Question, ReadingTestRaw } from '@/types/reading'
import type { ExamTestRaw, PartRaw, QuestionRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_reading_state'
const storage = useLocalStorage<ReadingState>(STORAGE_KEY)

export const useReadingStore = defineStore('reading', {
  state: (): ReadingState => {
    const saved = storage.load()
    return (
      saved || {
        currentPart: 1,
        passages: [],
        answers: {},
        test: undefined,
      }
    )
  },

  getters: {
    currentPassage: (state) => {
      return state.passages.find((p) => p.id === state.currentPart)
    },
  },

  actions: {
    setTest(test: ExamTestRaw): void {
      const reading = test.reading as ReadingTestRaw
      this.test = reading
      const parts = [...reading.parts].sort((a, b) => a.order - b.order)
      const mapQuestion = (q: QuestionRaw): Question => {
        let type: Question['type'] = 'fill-blank'

        // Map backend types to frontend types
        if (q.type === 'multiple_choice' || q.type === 'test') {
          type = 'multiple-choice'
        } else if (q.type === 'matching') {
          type = 'matching'
        } else if (q.type === 'true_false_not_given') {
          type = 'true-false-not-given'
        } else if (
          q.type === 'gap_filling' ||
          q.type === 'sentence_completion' ||
          q.type === 'summary_completion' ||
          q.type === 'short_answer_questions'
        ) {
          type = 'fill-blank'
        }

        const text = q.name || q.title || ''
        const options = Array.isArray(q.options) ? (q.options as string[]) : undefined
        return { id: q.id, type, text, options }
      }
      const passages: Passage[] = parts.map((p: PartRaw) => {
        // Filter out 'parent' type questions as they are just grouping containers
        const validQuestions = [...p.questions]
          .filter((q) => q.type !== 'parent')
          .sort((a, b) => a.order - b.order)
          .map(mapQuestion)

        return {
          id: p.order,
          title: p.title,
          content: p.content || '',
          questions: validQuestions,
        }
      })
      // Agar currentPart passages da mavjud bo'lmasa, birinchisiga o'rnatish
      const currentPartExists = passages.some((p) => p.id === this.currentPart)
      this.$patch({
        currentPart: currentPartExists ? this.currentPart : passages[0]?.id || 1,
        passages,
      })
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
