import { defineStore } from 'pinia'
import type { ReadingState, ReadingTestRaw } from '@/types/reading'
import { QuestionType, type ExamTestRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_reading_state'
const storage = useLocalStorage<ReadingState>(STORAGE_KEY, undefined, 500)

export const useReadingStore = defineStore('reading', {
  state: (): ReadingState => {
    const saved = storage.load()
    return {
      currentPart: saved?.currentPart ?? 1,
      answers: saved?.answers ?? {},
      test: undefined,
      highlights: saved?.highlights ?? {},
      questionHighlights: saved?.questionHighlights ?? {},
      isCompleted: saved?.isCompleted ?? false,
      isManualSubmit: saved?.isManualSubmit ?? false,
      isFinalized: saved?.isFinalized ?? false,
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
        questionHighlights: this.questionHighlights,
        isCompleted: this.isCompleted,
        isManualSubmit: this.isManualSubmit,
        isFinalized: this.isFinalized,
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

      // Pre-compiled regex for better performance
      const gapRegex = /\[gap\]/g
      const matchRegex = /\[match\]/g

      const countGapsAndMatches = (text: string | null | undefined): number => {
        if (!text) return 0
        const gaps = text.match(gapRegex)?.length ?? 0
        const matches = text.match(matchRegex)?.length ?? 0
        return gaps + matches
      }

      const processNode = (q: RawQuestion | RawChild): void => {
        const qType = q.type
        const hasChildren = 'children' in q && Array.isArray(q.children) && q.children.length > 0
        if (qType === QuestionType.TRUE_FALSE_NOT_GIVEN || qType === QuestionType.YES_NO_NOT_GIVEN) {
          currentCounter += 1
        } else if (qType === QuestionType.MULTIPLE_CHOICE) {
          currentCounter += (q as RawQuestion).answers_count || 1
        } else if (qType === QuestionType.MATCHING_INFORMATION && !hasChildren) {
          currentCounter += 1
        }
        currentCounter += countGapsAndMatches(q.content)

        if ('children' in q && q.children) {
          const sortedChildren = [...q.children].sort((a, b) => a.order - b.order)
          for (let i = 0; i < sortedChildren.length; i++) {
            processNode(sortedChildren[i]!)
          }
        }
      }

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!
        const start = currentCounter
        currentCounter += countGapsAndMatches(part.content)

        const questions = part.questions
        if (questions) {
          const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)
          for (let j = 0; j < sortedQuestions.length; j++) {
            processNode(sortedQuestions[j]!)
          }
        }
        stats[part.order] = { start, end: currentCounter - 1 }
      }
      this.partStats = stats

      // If currentPart doesn't exist in passages, set to first one
      const currentPartExists = parts.some((p) => p.order === this.currentPart)
      this.currentPart = currentPartExists ? this.currentPart : parts[0]?.order || 1

      if (!this.highlights) this.highlights = {}
      if (!this.questionHighlights) this.questionHighlights = {}

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

    setFinalized(finalized: boolean): void {
      this.isFinalized = finalized
      this.saveToStorage()
    },

    setStartTime(time: number): void {
      // Should only be set once
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

    saveQuestionHtml(html: string): void {
      this.questionHighlights[this.currentPart] = html
      this.saveToStorage()
    },

    clearReading(): void {
      this.currentPart = 1
      this.answers = {}
      this.highlights = {}
      this.questionHighlights = {}
      this.isCompleted = false
      this.isManualSubmit = false
      this.isFinalized = false
      this.startTime = undefined
      storage.remove()
    },
  },
})
