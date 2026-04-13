import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  CscaSubjectSession,
  CscaTestResponse,
  CscaSubjectResult,
} from '@/types/csca'
import { CSCA_SUBJECT_DURATION_MINUTES } from '@/types/csca'

const STORAGE_KEY = 'csca_state'

interface PersistedState {
  subjects: CscaSubjectSession[]
  activeSessionId: number | null
  answers: Record<number, Record<number, string>>
  startedAt: Record<number, number>
  submittedSessionIds: number[]
  results: Record<number, CscaSubjectResult>
}

export const useCscaStore = defineStore('csca', () => {
  const subjects = ref<CscaSubjectSession[]>([])
  const activeSessionId = ref<number | null>(null)
  // Answers keyed by session_id then question_id
  const answers = ref<Record<number, Record<number, string>>>({})
  // When each subject was started (unix ms)
  const startedAt = ref<Record<number, number>>({})
  // Locally tracked submitted session ids (set after backend ack)
  const submittedSessionIds = ref<number[]>([])
  const results = ref<Record<number, CscaSubjectResult>>({})
  const currentQuestionIndex = ref(0)

  const activeSession = computed(() =>
    subjects.value.find((s) => s.session_id === activeSessionId.value) || null,
  )

  const activeAnswers = computed(() => {
    if (!activeSessionId.value) return {}
    return answers.value[activeSessionId.value] || {}
  })

  const isSubmitted = (sessionId: number) =>
    submittedSessionIds.value.includes(sessionId)

  const pendingSubjects = computed(() =>
    subjects.value.filter((s) => !isSubmitted(s.session_id)),
  )

  const completedSubjects = computed(() =>
    subjects.value.filter((s) => isSubmitted(s.session_id)),
  )

  const allCompleted = computed(
    () => subjects.value.length > 0 && pendingSubjects.value.length === 0,
  )

  // Time left in seconds for the active subject (null if not started).
  // NOTE: not a computed — caller must invoke on every tick since Date.now() is not reactive.
  const getTimeLeftSeconds = (): number | null => {
    if (!activeSessionId.value) return null
    const start = startedAt.value[activeSessionId.value]
    if (!start) return null
    const elapsed = Math.floor((Date.now() - start) / 1000)
    const total = CSCA_SUBJECT_DURATION_MINUTES * 60
    return Math.max(0, total - elapsed)
  }

  const setTest = (response: CscaTestResponse) => {
    subjects.value = response.subjects

    // Hydrate submitted sessions and results from backend data
    for (const subj of response.subjects) {
      if (subj.submitted_at && subj.score !== undefined && subj.score !== null) {
        if (!submittedSessionIds.value.includes(subj.session_id)) {
          submittedSessionIds.value.push(subj.session_id)
        }
        results.value[subj.session_id] = {
          session_id: subj.session_id,
          subject: subj.subject,
          correct_count: subj.correct_count ?? 0,
          total_questions: subj.total_questions,
          score: subj.score,
        }
      }
    }

    persist()
  }

  const startSubject = (sessionId: number) => {
    const session = subjects.value.find((s) => s.session_id === sessionId)
    if (!session || isSubmitted(sessionId)) return

    activeSessionId.value = sessionId
    currentQuestionIndex.value = 0

    // Only set startedAt on first start
    if (!startedAt.value[sessionId]) {
      startedAt.value[sessionId] = Date.now()
    }
    if (!answers.value[sessionId]) {
      answers.value[sessionId] = {}
    }
    persist()
  }

  const setAnswer = (questionId: number, option: string) => {
    const sessionId = activeSessionId.value
    if (!sessionId) return
    const sessionAnswers = answers.value[sessionId] ?? {}
    sessionAnswers[questionId] = option
    answers.value[sessionId] = sessionAnswers
    persist()
  }

  const goToQuestion = (index: number) => {
    if (!activeSession.value) return
    if (index < 0 || index >= activeSession.value.questions.length) return
    currentQuestionIndex.value = index
  }

  const nextQuestion = () => {
    if (!activeSession.value) return
    if (currentQuestionIndex.value < activeSession.value.questions.length - 1) {
      currentQuestionIndex.value++
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--
    }
  }

  const markSubmitted = (sessionId: number, result: CscaSubjectResult) => {
    if (!submittedSessionIds.value.includes(sessionId)) {
      submittedSessionIds.value.push(sessionId)
    }
    results.value[sessionId] = result
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = null
      currentQuestionIndex.value = 0
    }
    persist()
  }

  const clearCsca = () => {
    subjects.value = []
    activeSessionId.value = null
    answers.value = {}
    startedAt.value = {}
    submittedSessionIds.value = []
    results.value = {}
    currentQuestionIndex.value = 0
    localStorage.removeItem(STORAGE_KEY)
  }

  const persist = () => {
    const state: PersistedState = {
      subjects: subjects.value,
      activeSessionId: activeSessionId.value,
      answers: answers.value,
      startedAt: startedAt.value,
      submittedSessionIds: submittedSessionIds.value,
      results: results.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full or unavailable
    }
  }

  const restore = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const state = JSON.parse(raw) as PersistedState
      subjects.value = state.subjects || []
      activeSessionId.value = state.activeSessionId ?? null
      answers.value = state.answers || {}
      startedAt.value = state.startedAt || {}
      submittedSessionIds.value = state.submittedSessionIds || []
      results.value = state.results || {}
    } catch {
      // ignore parse errors
    }
  }

  // Auto-persist on answers change
  watch(answers, persist, { deep: true })

  return {
    subjects,
    activeSessionId,
    activeSession,
    activeAnswers,
    answers,
    startedAt,
    submittedSessionIds,
    results,
    currentQuestionIndex,
    pendingSubjects,
    completedSubjects,
    allCompleted,
    getTimeLeftSeconds,
    setTest,
    startSubject,
    setAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    markSubmitted,
    isSubmitted,
    clearCsca,
    persist,
    restore,
  }
})
