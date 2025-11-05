import { defineStore } from 'pinia'
import type {
  ListeningState,
  ListeningQuestion,
  ListeningTestRaw,
  ListeningPartRaw,
  ListeningQuestionRaw,
} from '@/types/listening'

const STORAGE_KEY = 'ielts_listening_state'

const loadFromStorage = (): ListeningState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading listening state:', error)
  }
  return null
}

const saveToStorage = (state: ListeningState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving listening state:', error)
  }
}

export const useListeningStore = defineStore('listening', {
  state: (): ListeningState => {
    const saved = loadFromStorage()
    return (
      saved || {
        currentSection: 1,
        currentQuestion: 1,
        sections: [
          {
            id: 1,
            title: 'Section 1',
            instructions: 'You will hear a conversation. Answer the questions as you listen.',
            audioUrl: '',
            questions: [
              {
                id: 1,
                type: 'fill-blank',
                text: 'Write the booking reference number:',
              },
              {
                id: 2,
                type: 'multiple-choice',
                text: 'What day is the appointment?',
                options: ['Monday', 'Wednesday', 'Friday'],
              },
            ],
          },
          {
            id: 2,
            title: 'Section 2',
            instructions: 'You will hear a monologue. Answer the questions.',
            audioUrl: '',
            questions: [
              {
                id: 11,
                type: 'true-false-not-given',
                text: 'The event will start at 7 pm.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              },
            ],
          },
          {
            id: 3,
            title: 'Section 3',
            instructions: 'You will hear a discussion between students.',
            audioUrl: '',
            questions: [
              {
                id: 21,
                type: 'fill-blank',
                text: 'Write ONE WORD ONLY: The project topic is _________.',
              },
            ],
          },
          {
            id: 4,
            title: 'Section 4',
            instructions: 'You will hear a lecture. Answer the questions.',
            audioUrl: '',
            questions: [
              {
                id: 31,
                type: 'multiple-choice',
                text: 'What is the main subject of the lecture?',
                options: ['Ecology', 'Architecture', 'Economics'],
              },
            ],
          },
        ],
        answers: {},
        test: undefined,
      }
    )
  },

  getters: {
    currentSectionData: (state) => {
      if (state.test && state.test.parts?.length) {
        const part = [...state.test.parts]
          .sort((a, b) => a.order - b.order)
          .find((p) => p.order === state.currentSection)
        if (part) return (useListeningStore() as any)._mapPartToSection(part)
      }
      return state.sections.find((s) => s.id === state.currentSection)
    },
    currentQuestionItem(): ListeningQuestion | undefined {
      const section = this.currentSectionData as unknown as
        | { questions: ListeningQuestion[] }
        | undefined
      if (!section) return undefined
      return (section.questions as ListeningQuestion[]).find(
        (q: ListeningQuestion) => q.id === this.currentQuestion,
      )
    },
    questionIdsInSection(): number[] {
      const section = this.currentSectionData as unknown as
        | { questions: ListeningQuestion[] }
        | undefined
      return section
        ? (section.questions as ListeningQuestion[]).map((q: ListeningQuestion) => q.id)
        : []
    },
  },

  actions: {
    setTest(test: ListeningTestRaw): void {
      this.test = test
      // initialize to first part order
      const firstPart = test.parts.sort((a, b) => a.order - b.order)[0]
      if (firstPart) {
        this.currentSection = firstPart.order
        const ids = (firstPart.questions as ListeningQuestionRaw[])
          .sort((a: ListeningQuestionRaw, b: ListeningQuestionRaw) => a.order - b.order)
          .map((qItem: ListeningQuestionRaw) => qItem.id)
        this.currentQuestion = ids[0] as number
      }
      saveToStorage(this.$state)
    },

    // Mapping helpers from backend raw to UI-friendly structures
    _mapPartToSection(part: ListeningPartRaw) {
      return {
        id: part.id,
        title: part.title,
        instructions: part.content || '',
        audioUrl: part.file || '',
        questions: (part.questions as ListeningQuestionRaw[])
          .sort(
            (aItem: ListeningQuestionRaw, bItem: ListeningQuestionRaw) => aItem.order - bItem.order,
          )
          .map((qItem: ListeningQuestionRaw) => this._mapQuestion(qItem)),
      }
    },

    _mapQuestion(q: ListeningQuestionRaw): ListeningQuestion {
      // Basic mapping to supported UI types; others fall back to fill-blank for now
      let type: ListeningQuestion['type'] = 'fill-blank'
      if (q.type === 'multiple_choice') type = 'multiple-choice'
      // 'sentence_completion' maps to fill-blank

      const text = q.name || q.title || ''
      const options = Array.isArray(q.options) ? (q.options as string[]) : undefined
      return {
        id: q.id,
        type,
        text,
        options,
      }
    },

    setSection(section: number): void {
      this.currentSection = section
      const ids = this.questionIdsInSection
      if (ids.length > 0) this.currentQuestion = ids[0] as number
      saveToStorage(this.$state)
    },

    setQuestion(questionId: number): void {
      this.currentQuestion = questionId
      saveToStorage(this.$state)
    },

    updateAnswer(questionId: number, answer: string | number): void {
      this.answers[questionId] = answer
      saveToStorage(this.$state)
    },

    clearListening(): void {
      this.currentSection = 1
      this.answers = {}
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
