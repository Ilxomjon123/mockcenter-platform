import { defineStore } from 'pinia'
import type { ReadingState, Passage, Question } from '@/types/reading'
import type { ExamTestRaw, PartRaw, QuestionRaw } from '@/types/test'
import mockReadingData from '@/data/mockReadingData.json'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_reading_state'
const storage = useLocalStorage<ReadingState>(STORAGE_KEY)

export const useReadingStore = defineStore('reading', {
  state: (): ReadingState => {
    const saved = storage.load()
    return (
      saved || {
        currentPart: 1,
        passages: mockReadingData as Passage[],
        answers: {},
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
      const reading = test.reading
      const parts = [...reading.parts].sort((a, b) => a.order - b.order)
      const mapQuestion = (q: QuestionRaw): Question => {
        let type: Question['type'] = 'fill-blank'
        if (q.type === 'multiple_choice') type = 'multiple-choice'
        if (q.type === 'matching') type = 'matching'
        const text = q.name || q.title || ''
        const options = Array.isArray(q.options) ? (q.options as string[]) : undefined
        return { id: q.id, type, text, options }
      }
      const passages: Passage[] = parts.map((p: PartRaw) => ({
        id: p.order,
        title: p.title,
        content: p.content || '',
        questions: [...p.questions].sort((a, b) => a.order - b.order).map(mapQuestion),
      }))
      this.$patch({
        currentPart: passages[0]?.id || 1,
        passages,
        answers: {},
      })
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
