import { defineStore } from 'pinia'
import type { ListeningState } from '@/types/listening'
import type { ExamTestRaw, PartRaw, QuestionRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_listening_state'

interface StoredListeningState {
  currentPart: number
  currentQuestion: number
  currentAudioIndex: number
  answers: Record<number, string | number>
}

const storage = useLocalStorage<StoredListeningState>(STORAGE_KEY)

export const useListeningStore = defineStore('listening', {
  state: (): ListeningState => {
    const saved = storage.load()

    return {
      currentPart: saved?.currentPart ?? 1,
      currentQuestion: saved?.currentQuestion ?? 1,
      currentAudioIndex: saved?.currentAudioIndex ?? 0,
      answers: saved?.answers ?? {},
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
      return [...part.questions]
        .filter((q) => q.type !== 'parent')
        .sort((a, b) => a.order - b.order)
    },

    questionIdsInPart(): number[] {
      return this.currentQuestions.map((q) => q.id)
    },

    partOrders(): number[] {
      if (!this.test?.parts) return []
      return [...this.test.parts].sort((a, b) => a.order - b.order).map((p) => p.order)
    },
  },

  actions: {
    saveToStorage(): void {
      storage.save({
        currentPart: this.currentPart,
        currentQuestion: this.currentQuestion,
        currentAudioIndex: this.currentAudioIndex,
        answers: this.answers,
      })
    },

    setAudioIndex(index: number): void {
      this.currentAudioIndex = index
      this.saveToStorage()
    },

    setTest(test: ExamTestRaw): void {
      this.test = test.listening

      // Agar currentPart test da mavjud bo'lmasa, birinchi partga o'rnatish
      const parts = [...this.test.parts].sort((a, b) => a.order - b.order)
      const currentPartExists = parts.some((p) => p.order === this.currentPart)

      if (!currentPartExists && parts.length > 0) {
        const firstPart = parts[0]!
        this.currentPart = firstPart.order
        const questions = [...firstPart.questions]
          .filter((q) => q.type !== 'parent')
          .sort((a, b) => a.order - b.order)
        if (questions.length > 0) {
          this.currentQuestion = questions[0]!.id
        }
        this.saveToStorage()
      }
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

    updateAnswer(questionId: number, answer: string | number): void {
      this.answers[questionId] = answer
      this.saveToStorage()
    },

    clearListening(): void {
      this.currentPart = 1
      this.currentQuestion = 1
      this.currentAudioIndex = 0
      this.answers = {}
      storage.remove()
    },
  },
})
