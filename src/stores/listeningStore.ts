import { defineStore } from 'pinia'
import type { ListeningState } from '@/types/listening'
import { QuestionType, type ExamTestRaw, type PartRaw, type QuestionRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_listening_state'

interface StoredListeningState {
  currentPart: number
  currentQuestion: number
  currentAudioIndex: number
  currentAudioTime: number
  hasStarted: boolean
  isCompleted: boolean
  isManualSubmit: boolean
  answers: Record<string | number, string | number>
  questionHighlights: Record<number, string>
}

const storage = useLocalStorage<StoredListeningState>(STORAGE_KEY)

export const useListeningStore = defineStore('listening', {
  state: (): ListeningState => {
    const saved = storage.load()

    return {
      currentPart: saved?.currentPart ?? 1,
      currentQuestion: saved?.currentQuestion ?? 1,
      currentAudioIndex: saved?.currentAudioIndex ?? 0,
      currentAudioTime: saved?.currentAudioTime ?? 0,
      hasStarted: saved?.hasStarted ?? false,
      isCompleted: saved?.isCompleted ?? false,
      isManualSubmit: saved?.isManualSubmit ?? false,
      answers: saved?.answers ?? {},
      questionHighlights: saved?.questionHighlights ?? {},
      test: undefined,
    }
  },

  getters: {
    currentPartData(): PartRaw | undefined {
      if (!this.test?.parts?.length) return undefined
      return [...this.test.parts]
        .sort((a, b) => a.order - b.order)
        .find((p) => p.order === this.currentPart)
    },

    currentQuestions(): QuestionRaw[] {
      const part = this.currentPartData
      if (!part?.questions) return []
      // Get only top-level questions (those without parent_id)
      // Children come in each question's children array
      return [...part.questions].filter((q) => !q.parent_id).sort((a, b) => a.order - b.order)
    },

    questionIdsInPart(): number[] {
      const ids: number[] = []
      this.currentQuestions.forEach((q) => {
        ids.push(q.id)
        // Also add children IDs
        if (q.children && q.children.length > 0) {
          q.children.forEach((child) => ids.push(child.id))
        }
      })
      return ids
    },

    partOrders(): number[] {
      if (!this.test?.parts) return []
      return [...this.test.parts].sort((a, b) => a.order - b.order).map((p) => p.order)
    },

    partStats(): Record<number, { start: number; end: number }> {
      if (!this.test?.parts) return {}

      const stats: Record<number, { start: number; end: number }> = {}
      const sortedParts = [...this.test.parts].sort((a, b) => a.order - b.order)
      let currentCounter = 1

      const countGapsAndMatches = (text: string | null | undefined): number => {
        if (!text) return 0
        const gaps = (text.match(/\[gap\]/g) || []).length
        const matches = (text.match(/\[match\]/g) || []).length
        return gaps + matches
      }

      const processQuestion = (q: QuestionRaw) => {
        if (
          q.type === QuestionType.TRUE_FALSE_NOT_GIVEN ||
          q.type === QuestionType.YES_NO_NOT_GIVEN
        ) {
          currentCounter += 1
        } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
          currentCounter += q.answers_count || 1
        }
        currentCounter += countGapsAndMatches(q.content)

        if (q.children && q.children.length > 0) {
          const sortedChildren = [...q.children].sort((a, b) => a.order - b.order)
          sortedChildren.forEach(processQuestion)
        }
      }

      sortedParts.forEach((part) => {
        const start = currentCounter
        currentCounter += countGapsAndMatches(part.content)

        if (part.questions) {
          const sortedQuestions = [...part.questions]
            .filter((q) => !q.parent_id)
            .sort((a, b) => a.order - b.order)
          sortedQuestions.forEach(processQuestion)
        }

        stats[part.order] = { start, end: currentCounter - 1 }
      })

      return stats
    },
  },

  actions: {
    saveToStorage(): void {
      storage.save({
        currentPart: this.currentPart,
        currentQuestion: this.currentQuestion,
        currentAudioIndex: this.currentAudioIndex,
        currentAudioTime: this.currentAudioTime,
        hasStarted: this.hasStarted,
        isCompleted: this.isCompleted,
        isManualSubmit: this.isManualSubmit,
        answers: this.answers,
        questionHighlights: this.questionHighlights,
      })
    },

    setStarted(started: boolean): void {
      this.hasStarted = started
      this.saveToStorage()
    },

    setCompleted(completed: boolean, isManual: boolean = false): void {
      this.isCompleted = completed
      this.isManualSubmit = isManual
      this.saveToStorage()
    },

    setAudioIndex(index: number): void {
      this.currentAudioIndex = index
      this.currentAudioTime = 0 // Reset time when switching audio
      this.saveToStorage()
    },

    setAudioTime(time: number): void {
      this.currentAudioTime = time
      this.saveToStorage()
    },

    setTest(test: ExamTestRaw): void {
      this.test = test.listening

      // If currentPart doesn't exist in test, set to first part
      const parts = [...this.test.parts].sort((a, b) => a.order - b.order)
      const currentPartExists = parts.some((p) => p.order === this.currentPart)

      if (!currentPartExists && parts.length > 0) {
        const firstPart = parts[0]!
        this.currentPart = firstPart.order
        const questions = [...firstPart.questions]
          .filter((q) => !q.parent_id)
          .sort((a, b) => a.order - b.order)
        if (questions.length > 0) {
          this.currentQuestion = questions[0]!.id
        }
        this.saveToStorage()
      }

      // Initialize questionHighlights if not exists
      if (!this.questionHighlights) this.questionHighlights = {}
    },

    setPart(part: number): void {
      this.currentPart = part
      const ids = this.questionIdsInPart
      if (ids.length > 0) {
        this.currentQuestion = ids[0]!
      }
      this.saveToStorage()
    },

    setQuestion(questionId: number): void {
      this.currentQuestion = questionId
      this.saveToStorage()
    },

    updateAnswer(questionId: string | number, answer: string | number): void {
      this.answers[questionId] = answer
      this.saveToStorage()
    },

    saveQuestionHtml(html: string): void {
      this.questionHighlights[this.currentPart] = html
      this.saveToStorage()
    },

    clearListening(): void {
      this.currentPart = 1
      this.currentQuestion = 1
      this.currentAudioIndex = 0
      this.currentAudioTime = 0
      this.hasStarted = false
      this.isCompleted = false
      this.isManualSubmit = false
      this.answers = {}
      this.questionHighlights = {}
      storage.remove()
    },
  },
})
