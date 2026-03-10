import { defineStore } from 'pinia'
import type { SectionWithPartsRaw, ExamTestRaw, PartRaw, QuestionRaw } from '@/types/test'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'cefr_speaking_state'

interface StoredSpeakingState {
  currentPartIndex: number
  currentQuestionIndex: number
  isCompleted: boolean
  phase?: string
  countdown?: number
  recordingTime?: number
  prepTotal?: number
}

const storage = useLocalStorage<StoredSpeakingState>(STORAGE_KEY, undefined, 500)

export const useSpeakingStore = defineStore('speaking', {
  state: () => {
    const saved = storage.load()

    return {
      currentPartIndex: saved?.currentPartIndex ?? -1,
      currentQuestionIndex: saved?.currentQuestionIndex ?? 0,
      isCompleted: saved?.isCompleted ?? false,
      phase: (saved?.phase ?? undefined) as string | undefined,
      savedCountdown: saved?.countdown ?? 0,
      savedRecordingTime: saved?.recordingTime ?? 0,
      savedPrepTotal: saved?.prepTotal ?? 0,
      test: undefined as SectionWithPartsRaw | undefined,
    }
  },

  getters: {
    parts(): PartRaw[] {
      if (!this.test?.parts?.length) return []
      return [...this.test.parts].sort((a, b) => a.order - b.order)
    },

    currentPart(): PartRaw | undefined {
      return this.parts[this.currentPartIndex]
    },

    currentQuestions(): QuestionRaw[] {
      const part = this.currentPart
      if (!part?.questions) return []
      return [...part.questions].filter((q) => !q.parent_id).sort((a, b) => a.order - b.order)
    },

    currentQuestion(): QuestionRaw | undefined {
      return this.currentQuestions[this.currentQuestionIndex]
    },

    totalParts(): number {
      return this.parts.length
    },

    partLabels(): string[] {
      return this.parts.map((p) => {
        const order = p.order
        // Map order to part labels: 1->1.1, 2->1.2, 3->2, 4->3
        if (order === 1) return '1.1'
        if (order === 2) return '1.2'
        if (order === 3) return '2'
        if (order === 4) return '3'
        return String(order)
      })
    },

    currentPartLabel(): string {
      return this.partLabels[this.currentPartIndex] ?? ''
    },
  },

  actions: {
    setTest(testData: ExamTestRaw) {
      if (testData.speaking) {
        this.test = testData.speaking
      }
    },

    saveState() {
      storage.saveImmediate({
        currentPartIndex: this.currentPartIndex,
        currentQuestionIndex: this.currentQuestionIndex,
        isCompleted: this.isCompleted,
        phase: this.phase,
        countdown: this.savedCountdown,
        recordingTime: this.savedRecordingTime,
        prepTotal: this.savedPrepTotal,
      })
    },

    clearSpeaking() {
      this.currentPartIndex = 0
      this.currentQuestionIndex = 0
      this.isCompleted = false
      this.phase = undefined
      this.savedCountdown = 0
      this.savedRecordingTime = 0
      this.savedPrepTotal = 0
      this.test = undefined
      storage.remove()
    },
  },
})
