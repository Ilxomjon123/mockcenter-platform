import { defineStore } from 'pinia'
import type { ListeningState } from '@/types/listening'
import type { ExamTestRaw, PartRaw, QuestionRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_listening_state'

interface StoredListeningState {
  currentPart: number
  currentQuestion: number
  currentAudioIndex: number
  currentAudioTime: number
  hasStarted: boolean
  answers: Record<string | number, string | number>
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
      // Faqat top-level questionlarni olish (parent_id bo'lmaganlar)
      // Children har bir questionning children arrayida keladi
      return [...part.questions]
        .filter((q) => !q.parent_id)
        .sort((a, b) => a.order - b.order)
    },

    questionIdsInPart(): number[] {
      const ids: number[] = []
      this.currentQuestions.forEach((q) => {
        ids.push(q.id)
        // Children ID larini ham qo'shish
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
  },

  actions: {
    saveToStorage(): void {
      storage.save({
        currentPart: this.currentPart,
        currentQuestion: this.currentQuestion,
        currentAudioIndex: this.currentAudioIndex,
        currentAudioTime: this.currentAudioTime,
        hasStarted: this.hasStarted,
        answers: this.answers,
      })
    },

    setStarted(started: boolean): void {
      this.hasStarted = started
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

      // Agar currentPart test da mavjud bo'lmasa, birinchi partga o'rnatish
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

    clearListening(): void {
      this.currentPart = 1
      this.currentQuestion = 1
      this.currentAudioIndex = 0
      this.currentAudioTime = 0
      this.hasStarted = false
      this.answers = {}
      storage.remove()
    },
  },
})
