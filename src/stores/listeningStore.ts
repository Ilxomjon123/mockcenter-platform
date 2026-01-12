import { defineStore } from 'pinia'
import type {
  ListeningState,
  ListeningQuestion,
  ListeningTestRaw,
  ListeningPartRaw,
  ListeningQuestionRaw,
} from '@/types/listening'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'ielts_listening_state'
const storage = useLocalStorage<ListeningState>(STORAGE_KEY)

// Mapping helpers from backend raw to UI-friendly structures
function mapQuestion(q: ListeningQuestionRaw): ListeningQuestion {
  let type: ListeningQuestion['type'] = 'fill-blank'

  // Map backend types to frontend types
  if (q.type === 'multiple_choice' || q.type === 'test') {
    type = 'multiple-choice'
  } else if (q.type === 'true_false_not_given') {
    type = 'true-false-not-given'
  } else if (
    q.type === 'gap_filling' ||
    q.type === 'sentence_completion' ||
    q.type === 'summary_completion'
  ) {
    type = 'fill-blank'
  }

  const text = q.name || q.title || ''
  const options = Array.isArray(q.options) ? (q.options as string[]) : undefined
  return {
    id: q.id,
    type,
    text,
    options,
  }
}

function mapPartToSection(part: ListeningPartRaw) {
  // Filter out 'parent' type questions as they are just grouping containers
  const validQuestions = (part.questions as ListeningQuestionRaw[]).filter(
    (q) => q.type !== 'parent',
  )

  return {
    id: part.order, // Use order as section id for consistency
    title: part.title,
    instructions: part.content || '',
    audioUrl: part.file || '',
    questions: validQuestions
      .sort((aItem: ListeningQuestionRaw, bItem: ListeningQuestionRaw) => aItem.order - bItem.order)
      .map((qItem: ListeningQuestionRaw) => mapQuestion(qItem)),
  }
}

export const useListeningStore = defineStore('listening', {
  state: (): ListeningState => {
    const saved = storage.load()

    return (
      saved || {
        text: '',
        currentSection: 1,
        currentQuestion: 1,
        sections: [],
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
        if (part) return mapPartToSection(part)
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
      storage.save(this.$state)
    },


    setSection(section: number): void {
      this.currentSection = section
      const ids = this.questionIdsInSection
      if (ids.length > 0) this.currentQuestion = ids[0] as number
      storage.save(this.$state)
    },

    setQuestion(questionId: number): void {
      this.currentQuestion = questionId
      storage.save(this.$state)
    },

    updateAnswer(questionId: number, answer: string | number): void {
      this.answers[questionId] = answer
      storage.save(this.$state)
    },

    clearListening(): void {
      this.currentSection = 1
      this.answers = {}
      storage.remove()
    },
  },
})
